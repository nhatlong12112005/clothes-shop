<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
require_once "../../config/database.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$db    = (new Database())->getConnection();
$from  = $_GET['from']  ?? null;
$to    = $_GET['to']    ?? null;

$params = [];
$dateWhere = "";
if ($from && $to) {
    $dateWhere = " AND DATE(ir.import_date) BETWEEN ? AND ?";
    $params[] = $from;
    $params[] = $to;
} elseif ($from) {
    $dateWhere = " AND DATE(ir.import_date) >= ?";
    $params[] = $from;
} elseif ($to) {
    $dateWhere = " AND DATE(ir.import_date) <= ?";
    $params[] = $to;
}

// Tổng nhập kho (từ batchdetails)
$sqlImport = "SELECT 
    p.id AS product_id, p.name AS product_name, pi.color, pv.size,
    SUM(bd.quantity_imported) AS total_imported,
    SUM(bd.import_price * bd.quantity_imported) AS total_import_value,
    bd.id AS batch_id,
    ir.import_date
FROM batchdetails bd
JOIN importreceipts ir ON ir.id = bd.import_receipt_id
JOIN productvariants pv ON pv.id = bd.variant_id
JOIN product_images pi ON pi.id = pv.image_id
JOIN products p ON p.id = pi.product_id
WHERE 1=1 $dateWhere
GROUP BY bd.id
ORDER BY ir.import_date DESC";

$stmtImp = $db->prepare($sqlImport);
$stmtImp->execute($params);
$importData = $stmtImp->fetchAll(PDO::FETCH_ASSOC);

// Tổng xuất kho (từ orderdetails đơn completed)
$orderParams = [];
$orderDateWhere = "";
if ($from && $to) {
    $orderDateWhere = " AND DATE(o.order_date) BETWEEN ? AND ?";
    $orderParams = [$from, $to];
} elseif ($from) {
    $orderDateWhere = " AND DATE(o.order_date) >= ?";
    $orderParams = [$from];
} elseif ($to) {
    $orderDateWhere = " AND DATE(o.order_date) <= ?";
    $orderParams = [$to];
}

$sqlExport = "SELECT
    p.id AS product_id, p.name AS product_name, pi.color, pv.size,
    SUM(od.quantity) AS total_exported,
    SUM(od.quantity * od.price_at_purchase) AS total_export_value
FROM orderdetails od
JOIN orders o ON o.id = od.order_id
JOIN productvariants pv ON pv.id = od.variant_id
JOIN product_images pi ON pi.id = pv.image_id
JOIN products p ON p.id = pi.product_id
WHERE o.status = 'completed' $orderDateWhere
GROUP BY p.id, pi.color, pv.size
ORDER BY p.name ASC";

$stmtExp = $db->prepare($sqlExport);
$stmtExp->execute($orderParams);
$exportData = $stmtExp->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status" => true,
    "from"   => $from,
    "to"     => $to,
    "import" => $importData,
    "export" => $exportData,
]);
