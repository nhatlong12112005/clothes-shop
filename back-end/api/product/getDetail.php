<?php
ob_start();
require_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../models/ProductModel.php";
require_once __DIR__ . "/../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Thiếu ID sản phẩm"]);
    exit;
}

$db = (new Database())->getConnection();
$productModel = new ProductModel($db);

$detail = $productModel->getProductDetail($id);

if ($detail) {
    if (ob_get_length()) ob_clean();
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data" => $detail
    ]);
} else {
    if (ob_get_length()) ob_clean();
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Không tìm thấy sản phẩm"
    ]);
}
?>
