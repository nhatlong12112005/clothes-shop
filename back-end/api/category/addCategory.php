<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/CategoryModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$name = isset($_POST['name']) ? trim($_POST['name']) : '';

if($name === ""){
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Tên danh mục không được trống"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$categoryModel = new CategoryModel($db);

$result = $categoryModel->createCate($name);

if ($result === "created") {
    echo json_encode([
        "status" => true,
        "message" => "Thêm danh mục thành công"
    ]);
} 
elseif ($result === "restored") {
    echo json_encode([
        "status" => true,
        "message" => "Danh mục đã tồn tại trước đó, đã khôi phục lại"
    ]);
} 
elseif ($result === "exists") {
    http_response_code(409);
    echo json_encode([
        "status" => false,
        "message" => "Danh mục đã tồn tại"
    ]);
} 
else {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Thêm danh mục thất bại"
    ]);
}
?>
