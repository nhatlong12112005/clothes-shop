<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
require_once "../../config/database.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$db = (new Database())->getConnection();

// Lấy danh sách lô hàng kèm thông tin giá bán
$sql = "SELECT 
    p.id AS product_id,
    p.name AS product_name,
    pi.color,
    pv.size,
    bd.id AS batch_id,
    bd.import_price,
    bd.quantity_imported,
    bd.quantity_remaining,
    bd.created_at AS batch_date,
    COALESCE(p.profit_rate, 0) AS profit_rate,
    COALESCE(p.proposed_price, 0) AS proposed_price,
    ROUND(pv.current_import_price * (1 + COALESCE(p.profit_rate, 0) / 100)) AS sell_price
FROM batchdetails bd
JOIN productvariants pv ON pv.id = bd.variant_id
JOIN product_images pi ON pi.id = pv.image_id
JOIN products p ON p.id = pi.product_id
WHERE p.status = 1
ORDER BY p.name ASC, bd.created_at ASC";

$stmt = $db->prepare($sql);
$stmt->execute();
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => true, "data" => $data]);
