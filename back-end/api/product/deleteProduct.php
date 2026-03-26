<?php
ob_start();
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ProductModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiếu ID sản phẩm"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$productModel = new ProductModel($db);

$result = $productModel->deleteProduct($id);

http_response_code(200);
echo json_encode([
    "status" => true,
    "message" => "Xóa phần mềm thành công"
]);
?>
