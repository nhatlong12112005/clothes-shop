<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/CategoryModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;
$name = isset($_POST['name']) ? $_POST['name'] : null;

if(!$id){
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiếu ID Category"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$cateryModel = new CategoryModel($db);

$cate = $cateryModel->findByCateId($id);
if(!$cate){
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Danh mục này không tồn tại"
    ]);
    exit;
}

// chuẩn bị dữ liệu update
$payload = [
    "name" => $name ?? $cate['name'],
    "is_active" => isset($_POST['is_active']) ? (int)$_POST['is_active'] : $cate['is_active']
];

// update
$updated = $cateryModel->updateCate($id, $payload);

if (!$updated){
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Cập nhật thất bại"
    ]);
    exit;
}

http_response_code(200);
echo json_encode([
    "status" => true,
    "message" => "Cập nhật danh mục thành công"
]);
