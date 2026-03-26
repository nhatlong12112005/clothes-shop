<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/CategoryModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode([
        'status' => false,
        "message" => "Thiếu ID Category"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$cate = new CategoryModel($db);

// kiểm tra tồn tại
$category = $cate->findByCateId($id);

if (!$category) {
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Danh mục không tồn tại"
    ]);
    exit;
}

// nếu đã bị xóa rồi
if ($category['is_active'] == 0) {
    echo json_encode([
        "status" => false,
        "message" => "Danh mục đã bị xóa trước đó"
    ]);
    exit;
}

// ✔ xóa mềm (gọi từ model)
$deleted = $cate->Delete($id);

http_response_code($deleted ? 200 : 500);
echo json_encode([
    "status" => $deleted,
    "message" => $deleted ? "Xóa danh mục thành công" : "Xóa thất bại"
]);
?>
