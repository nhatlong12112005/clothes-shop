<?php

class ImportReceiptModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /*
     * 1️⃣ Tạo phiếu nhập (status = draft, CHƯA cộng kho)
     */
    public function createImportReceipt($data)
    {
        try {
            $this->conn->beginTransaction();

            // 1. Tạo phiếu nhập với status = draft
            $sql = "INSERT INTO importreceipts
                    (supplier_id, import_date, total_amount, status)
                    VALUES (?, NOW(), 0, 'draft')";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$data['supplier_id']]);

            $receiptId = $this->conn->lastInsertId();

            // 2. Thêm chi tiết phiếu (lưu tạm, CHƯA cộng vào batchdetails)
            $totalAmount = $this->_insertReceiptItems($receiptId, $data['items']);

            // 3. Cập nhật tổng tiền
            $this->conn->prepare("UPDATE importreceipts SET total_amount = ? WHERE id = ?")
                ->execute([$totalAmount, $receiptId]);

            $this->conn->commit();
            return [
                "status" => true,
                "message" => "Tạo phiếu nhập nháp thành công",
                "receipt_id" => $receiptId
            ];
        }
        catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return ["status" => false, "message" => $e->getMessage()];
        }
    }

    /*
     * 2️⃣ Cập nhật phiếu nhập (chỉ khi còn draft)
     */
    public function updateReceipt($receiptId, $data)
    {
        try {
            // Kiểm tra trạng thái
            $stmt = $this->conn->prepare("SELECT status FROM importreceipts WHERE id = ?");
            $stmt->execute([$receiptId]);
            $receipt = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$receipt) {
                return ["status" => false, "message" => "Phiếu nhập không tồn tại"];
            }
            if ($receipt['status'] !== 'draft') {
                return ["status" => false, "message" => "Chỉ có thể sửa phiếu nhập chưa hoàn thành"];
            }

            $this->conn->beginTransaction();

            // Xóa items cũ trong receipt_items
            $this->conn->prepare("DELETE FROM receipt_items WHERE receipt_id = ?")
                ->execute([$receiptId]);

            // Cập nhật supplier nếu có
            if (!empty($data['supplier_id'])) {
                $this->conn->prepare("UPDATE importreceipts SET supplier_id = ? WHERE id = ?")
                    ->execute([$data['supplier_id'], $receiptId]);
            }

            // Thêm items mới
            $totalAmount = $this->_insertReceiptItems($receiptId, $data['items']);

            // Cập nhật tổng tiền
            $this->conn->prepare("UPDATE importreceipts SET total_amount = ? WHERE id = ?")
                ->execute([$totalAmount, $receiptId]);

            $this->conn->commit();
            return ["status" => true, "message" => "Cập nhật phiếu nhập thành công"];
        }
        catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return ["status" => false, "message" => $e->getMessage()];
        }
    }

    /*
     * 3️⃣ Hoàn thành phiếu nhập → chuyển sang batchdetails (cộng kho thật)
     */
    public function completeReceipt($receiptId)
    {
        try {
            $stmt = $this->conn->prepare("SELECT status FROM importreceipts WHERE id = ?");
            $stmt->execute([$receiptId]);
            $receipt = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$receipt) {
                return ["status" => false, "message" => "Phiếu nhập không tồn tại"];
            }
            if ($receipt['status'] !== 'draft') {
                return ["status" => false, "message" => "Phiếu nhập đã hoàn thành rồi"];
            }

            $this->conn->beginTransaction();

            // Lấy danh sách items từ receipt_items
            $stmtItems = $this->conn->prepare("SELECT * FROM receipt_items WHERE receipt_id = ?");
            $stmtItems->execute([$receiptId]);
            $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

            if (empty($items)) {
                if ($this->conn->inTransaction()) {
                    $this->conn->rollBack();
                }
                return ["status" => false, "message" => "Phiếu nhập không có hàng nào"];
            }

            // Chuyển từng item sang batchdetails
            $sqlBatch = "INSERT INTO batchdetails
                         (import_receipt_id, variant_id, import_price, quantity_imported, quantity_remaining)
                         VALUES (?, ?, ?, ?, ?)";
            $stmtBatch = $this->conn->prepare($sqlBatch);

            $stmtGetVariantInfo = $this->conn->prepare("
                SELECT current_import_price 
                FROM productvariants 
                WHERE id = ? FOR UPDATE
            ");

            $stmtGetStock = $this->conn->prepare("
                SELECT COALESCE(SUM(quantity_remaining), 0) as current_stock
                FROM batchdetails 
                WHERE variant_id = ?
            ");

            $stmtUpdatePrice = $this->conn->prepare("
                UPDATE productvariants 
                SET current_import_price = ? 
                WHERE id = ?
            ");

            $stmtLog = $this->conn->prepare("
                INSERT INTO inventory_logs (variant_id, change_qty, type, reference_id)
                VALUES (?, ?, 'import', ?)
            ");

            foreach ($items as $item) {
                // Lấy giá vốn hiện tại
                $stmtGetVariantInfo->execute([$item['variant_id']]);
                $variantInfo = $stmtGetVariantInfo->fetch(PDO::FETCH_ASSOC);
                $currentImportPrice = $variantInfo ? (float)$variantInfo['current_import_price'] : 0.0;

                // Lấy số lượng tồn kho hiện tại
                $stmtGetStock->execute([$item['variant_id']]);
                $currentStock = (int)$stmtGetStock->fetchColumn();

                $importQty = (int)$item['quantity'];
                $importPrice = (float)$item['import_price'];

                // Tính Giá Vốn Bình Quân (Weighted Average Price)
                $newStockQty = $currentStock + $importQty;
                $newAveragePrice = 0;
                
                if ($newStockQty > 0) {
                    $newAveragePrice = (($currentStock * $currentImportPrice) + ($importQty * $importPrice)) / $newStockQty;
                }

                // Cập nhật giá vốn mới vào biến thể
                $stmtUpdatePrice->execute([$newAveragePrice, $item['variant_id']]);

                // Thêm vào lô hàng (batchdetails)
                $stmtBatch->execute([
                    $receiptId,
                    $item['variant_id'],
                    $item['import_price'],
                    $importQty,
                    $importQty,
                ]);

                // Ghi log nhập kho
                $stmtLog->execute([
                    $item['variant_id'],
                    $importQty,
                    $receiptId
                ]);
            }

            // Đánh dấu phiếu hoàn thành
            $this->conn->prepare("UPDATE importreceipts SET status='completed' WHERE id = ?")
                ->execute([$receiptId]);

            $this->conn->commit();
            return ["status" => true, "message" => "Phiếu nhập đã hoàn thành. Kho đã được cập nhật."];
        }
        catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return ["status" => false, "message" => $e->getMessage()];
        }
    }

    /*
     * Helper: insert items vào bảng receipt_items (bảng staging cho draft)
     */
    private function _insertReceiptItems($receiptId, $items)
    {

        $sql = "INSERT INTO receipt_items (receipt_id, variant_id, import_price, quantity) VALUES (?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        $total = 0;
        foreach ($items as $item) {
            $stmt->execute([$receiptId, $item['variant_id'], $item['import_price'], $item['quantity']]);
            $total += $item['import_price'] * $item['quantity'];
        }
        return $total;
    }

    /*
     * 4️⃣ Lấy danh sách phiếu nhập
     */
    public function getReceipts($supplier_id = null, $from_date = null, $to_date = null, $page = 1, $limit = 10)
    {
        $page  = (int)$page;
        $limit = (int)$limit;
        if ($page < 1) $page = 1;
        if ($limit < 1) $limit = 10;
        $offset = ($page - 1) * $limit;

        $sql = "SELECT ir.*, s.name AS supplier_name
                FROM importreceipts ir
                JOIN suppliers s ON s.id = ir.supplier_id
                WHERE 1=1";

        $countSql = "SELECT COUNT(*) FROM importreceipts ir WHERE 1=1";

        $params      = [];
        $countParams = [];

        if (!empty($supplier_id)) {
            $sql .= " AND ir.supplier_id = ?";
            $countSql .= " AND ir.supplier_id = ?";
            $params[] = $countParams[] = $supplier_id;
        }
        if (!empty($from_date)) {
            $sql .= " AND DATE(ir.import_date) >= ?";
            $countSql .= " AND DATE(ir.import_date) >= ?";
            $params[] = $countParams[] = $from_date;
        }
        if (!empty($to_date)) {
            $sql .= " AND DATE(ir.import_date) <= ?";
            $countSql .= " AND DATE(ir.import_date) <= ?";
            $params[] = $countParams[] = $to_date;
        }

        $sql .= " ORDER BY ir.import_date DESC LIMIT $limit OFFSET $offset";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmtCount = $this->conn->prepare($countSql);
        $stmtCount->execute($countParams);
        $totalRecords = $stmtCount->fetchColumn();

        return [
            "data"        => $data,
            "total"       => (int)$totalRecords,
            "page"        => $page,
            "limit"       => $limit,
            "total_pages" => ceil($totalRecords / $limit)
        ];
    }

    /*
     * 5️⃣ Chi tiết phiếu nhập
     */
    public function getReceiptDetail($receiptId)
    {
        $sqlReceipt = "SELECT ir.*, s.name AS supplier_name
                       FROM importreceipts ir
                       JOIN suppliers s ON s.id = ir.supplier_id
                       WHERE ir.id = ?";
        $stmtReceipt = $this->conn->prepare($sqlReceipt);
        $stmtReceipt->execute([$receiptId]);
        $receiptInfo = $stmtReceipt->fetch(PDO::FETCH_ASSOC);

        if (!$receiptInfo) return null;

        // Lấy items — nếu draft thì từ receipt_items, nếu completed thì từ batchdetails
        if ($receiptInfo['status'] === 'draft') {
            $sqlItems = "SELECT ri.id, ri.variant_id, ri.import_price,
                                ri.quantity AS quantity_imported, ri.quantity AS quantity_remaining,
                                pi.color, pv.size, p.name AS product_name
                         FROM receipt_items ri
                         JOIN productvariants pv ON pv.id = ri.variant_id
                         JOIN product_images pi ON pi.id = pv.image_id
                         JOIN products p ON p.id = pi.product_id
                         WHERE ri.receipt_id = ?";
        } else {
            $sqlItems = "SELECT bd.id, bd.variant_id, bd.import_price,
                                bd.quantity_imported, bd.quantity_remaining,
                                pi.color, pv.size, p.name AS product_name
                         FROM batchdetails bd
                         JOIN productvariants pv ON pv.id = bd.variant_id
                         JOIN product_images pi ON pi.id = pv.image_id
                         JOIN products p ON p.id = pi.product_id
                         WHERE bd.import_receipt_id = ?";
        }

        $stmtItems = $this->conn->prepare($sqlItems);
        $stmtItems->execute([$receiptId]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        return [
            "receipt_info" => $receiptInfo,
            "items"        => $items
        ];
    }
}