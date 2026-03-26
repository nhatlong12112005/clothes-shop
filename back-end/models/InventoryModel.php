<?php

class InventoryModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /* ===============================
       1. LẤY TỒN KHO THEO VARIANT
    =============================== */
    public function getStockByVariant($variantId)
    {
        $stmt = $this->conn->prepare("
            SELECT COALESCE(SUM(quantity_remaining),0) AS stock
            FROM batchdetails
            WHERE variant_id = ?
        ");

        $stmt->execute([$variantId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /* ===============================
       2. LẤY TỒN KHO THEO PRODUCT
    =============================== */
    public function getStockByProduct($productId)
    {
        $stmt = $this->conn->prepare("
            SELECT pv.id AS variant_id,
                   pi.color,
                   pv.size,
                   COALESCE(SUM(bd.quantity_remaining),0) AS stock
            FROM productvariants pv
            JOIN product_images pi ON pi.id = pv.image_id
            LEFT JOIN batchdetails bd 
                ON bd.variant_id = pv.id
            WHERE pi.product_id = ?
            GROUP BY pv.id
        ");

        $stmt->execute([$productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /* ===============================
       3. TRỪ KHO KHI BÁN (FIFO)
    =============================== */
    public function deductStock($variantId, $quantity)
    {
        try {
            $this->conn->beginTransaction();

            // Lấy các lô còn hàng theo thứ tự nhập cũ nhất
           $stmt = $this->conn->prepare("
                SELECT id, quantity_remaining
                FROM batchdetails
                WHERE variant_id = ?
                AND quantity_remaining > 0
                ORDER BY created_at ASC
                FOR UPDATE
            ");

            $stmt->execute([$variantId]);
            $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $remainingToDeduct = $quantity;

            foreach ($batches as $batch) {

                if ($remainingToDeduct <= 0) break;

                $available = $batch['quantity_remaining'];

                if ($available >= $remainingToDeduct) {
                    // Trừ đủ trong lô này
                    $update = $this->conn->prepare("
                        UPDATE batchdetails
                        SET quantity_remaining = quantity_remaining - ?
                        WHERE id = ?
                    ");
                    $update->execute([$remainingToDeduct, $batch['id']]);

                    $remainingToDeduct = 0;

                } else {
                    // Trừ hết lô này
                    $update = $this->conn->prepare("
                        UPDATE batchdetails
                        SET quantity_remaining = 0
                        WHERE id = ?
                    ");
                    $update->execute([$batch['id']]);

                    $remainingToDeduct -= $available;
                }
            }

            if ($remainingToDeduct > 0) {
                throw new Exception("Không đủ tồn kho");
            }

            $this->conn->commit();
            return "deducted";

        } catch (Exception $e) {
            $this->conn->rollBack();
            return $e->getMessage();
        }
    }

    /* ===============================
       4. DANH SÁCH TỒN KHO TỔNG
    =============================== */
    public function getInventoryList($filters = [])
    {
        $page  = $filters['page'] ?? 1;
        $limit = $filters['limit'] ?? 10;
        $offset = ($page - 1) * $limit;

        // Count total variants
        $countSql = "
            SELECT COUNT(pv.id)
            FROM productvariants pv
            JOIN product_images pi ON pi.id = pv.image_id
            JOIN products p ON p.id = pi.product_id
        ";
        $countStmt = $this->conn->prepare($countSql);
        $countStmt->execute();
        $totalRecords = $countStmt->fetchColumn();
        $totalPages = ceil($totalRecords / $limit);

        // Fetch paginated data
        $stmt = $this->conn->prepare("
            SELECT p.name AS product_name,
                   pv.id AS variant_id,
                   pi.color,
                   pv.size,
                   COALESCE(SUM(bd.quantity_remaining),0) AS stock
            FROM productvariants pv
            JOIN product_images pi ON pi.id = pv.image_id
            JOIN products p ON p.id = pi.product_id
            LEFT JOIN batchdetails bd 
                ON bd.variant_id = pv.id
            GROUP BY pv.id
            ORDER BY p.name ASC
            LIMIT $limit OFFSET $offset
        ");

        $stmt->execute();
        
        return [
            "data" => $stmt->fetchAll(PDO::FETCH_ASSOC),
            "pagination" => [
                "current_page" => (int)$page,
                "limit" => (int)$limit,
                "total_records" => (int)$totalRecords,
                "total_pages" => (int)$totalPages
            ]
        ];
    }
}
?>