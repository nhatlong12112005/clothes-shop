<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ImportReceiptModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();


$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);

// Láº¥y dá»¯ liá»‡u JSON tá»« body
$data = json_decode(file_get_contents("php://input"), true);

// Kiá»ƒm tra dá»¯ liá»‡u cÆ¡ báº£n
if (
    empty($data['supplier_id']) ||
    empty($data['items']) ||
    !is_array($data['items'])
) {
    echo json_encode([
        "status" => false,
        "message" => "Thiáº¿u dá»¯ liá»‡u báº¯t buá»™c"
    ]);
    exit;
}

$result = $model->createImportReceipt($data);

echo json_encode($result);

