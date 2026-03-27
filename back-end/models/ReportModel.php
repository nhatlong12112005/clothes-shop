<?php

class ReportModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Lấy tồn kho tại một thời điểm (Quá khứ) bằng cách đảo lộn thay đổi từ hiện tại
     * Hoặc tính tổng từ ban đầu đến mốc thời gian đó bằng cách SUM(change_qty)
     */
    public function getInventoryAtTime($datetime)
    {
        // Công thức: Tồn kho tại thời điểm T = SUM(change_qty) các log có created_at <= T
        $sql = "
            SELECT 
                p.id as product_id,
                p.name as product_name,
                pv.size,
                pi.color,
                COALESCE(SUM(il.change_qty), 0) as stock_at_time
            FROM products p
            JOIN product_images pi ON pi.product_id = p.id
            JOIN productvariants pv ON pv.image_id = pi.id
            LEFT JOIN inventory_logs il ON il.variant_id = pv.id AND il.created_at <= ?
            GROUP BY p.id, pv.id
            HAVING stock_at_time > 0
            ORDER BY p.name ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$datetime]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Báo cáo xuất / nhập ròng trong một khoảng thời gian
     */
    public function getImportExportReport($fromDate, $toDate)
    {
        $sql = "
            SELECT 
                p.id as product_id,
                p.name as product_name,
                pv.size,
                pi.color,
                COALESCE(SUM(CASE WHEN il.change_qty > 0 THEN il.change_qty ELSE 0 END), 0) as total_imported,
                COALESCE(SUM(CASE WHEN il.change_qty < 0 THEN ABS(il.change_qty) ELSE 0 END), 0) as total_exported
            FROM products p
            JOIN product_images pi ON pi.product_id = p.id
            JOIN productvariants pv ON pv.image_id = pi.id
            LEFT JOIN inventory_logs il ON il.variant_id = pv.id 
                AND DATE(il.created_at) >= ? AND DATE(il.created_at) <= ?
            GROUP BY p.id, pv.id
            HAVING total_imported > 0 OR total_exported > 0
            ORDER BY p.name ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$fromDate, $toDate]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Lấy danh sách sản phẩm sắp hết hàng theo ngưỡng
     */
    public function getLowStockProducts($threshold)
    {
        $sql = "
            SELECT 
                p.id as product_id,
                p.name as product_name,
                pv.size,
                pi.color,
                (
                   SELECT COALESCE(SUM(bd.quantity_remaining), 0)
                   FROM batchdetails bd
                   WHERE bd.variant_id = pv.id
                ) AS current_stock
            FROM products p
            JOIN product_images pi ON pi.product_id = p.id
            JOIN productvariants pv ON pv.image_id = pi.id
            WHERE p.status = 1 AND pv.status = 1
            HAVING current_stock <= ?
            ORDER BY current_stock ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$threshold]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
