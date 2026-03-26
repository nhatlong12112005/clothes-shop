<?php

class DashboardReportModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /* =========================
       1. Tổng quan hệ thống
    ==========================*/
    public function summary($from = null, $to = null)
    {
        $sql = "
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                SUM(ROUND(od.quantity * od.price_at_purchase)) as total_revenue,
                SUM(ROUND(od.quantity * (od.price_at_purchase - bd.import_price))) as total_profit,
                SUM(od.quantity) as total_products_sold
            FROM orders o
            JOIN orderdetails od ON od.order_id = o.id
            JOIN batchdetails bd ON bd.id = od.batch_id
            WHERE o.status = 'completed'";
        $params = [];
        if ($from && $to) {
            $sql .= " AND DATE(o.order_date) BETWEEN ? AND ?";
            $params = [$from, $to];
        }
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /* =========================
       2. Top sản phẩm bán chạy
    ==========================*/
    public function topProducts($from = null, $to = null, $limit = 5)
    {
        $sql = "
            SELECT 
                p.id,
                p.name,
                SUM(od.quantity) as total_sold,
                SUM(ROUND(od.quantity * od.price_at_purchase)) as total_revenue,
                SUM(ROUND(od.quantity * (od.price_at_purchase - bd.import_price))) as total_profit
            FROM orderdetails od
            JOIN batchdetails bd ON bd.id = od.batch_id
            JOIN orders o ON o.id = od.order_id
            JOIN productvariants pv ON pv.id = od.variant_id
            JOIN product_images pi ON pi.id = pv.image_id
            JOIN products p ON p.id = pi.product_id
            WHERE o.status = 'completed'";
        $params = [];
        if ($from && $to) {
            $sql .= " AND DATE(o.order_date) BETWEEN ? AND ?";
            $params = [$from, $to];
        }
        $sql .= " GROUP BY p.id ORDER BY total_sold DESC LIMIT $limit";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /* =========================
       3. Full Dashboard Data
    ==========================*/
    public function dashboard($from, $to)
    {
        $summary = $this->summary($from, $to);
        $topProducts = $this->topProducts($from, $to);

        return [
            "from" => $from,
            "to" => $to,
            "total_orders" => (int)($summary['total_orders'] ?? 0),
            "total_revenue" => (float)($summary['total_revenue'] ?? 0),
            "total_profit" => (float)($summary['total_profit'] ?? 0),
            "total_products_sold" => (int)($summary['total_products_sold'] ?? 0),
            "top_products" => $topProducts
        ];
    }
}
