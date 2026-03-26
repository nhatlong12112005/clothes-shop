<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/BrandModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode([
        'status' => false,
        "message" => "Thiếu ID Thương hiệu"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$br = new BrandModel($db);

// kiểm tra tồn tại
$brand = $br->findByBrandId($id);

if (!$brand) {
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Thương hiệu không tồn tại"
    ]);
    exit;
}

// nếu đã bị xóa rồi
if ($brand['is_active'] == 0) {
    echo json_encode([
        "status" => false,
        "message" => "Thương hiệu đã bị xóa trước đó"
    ]);
    exit;
}

// ✔ xóa mềm (gọi từ model)
$deleted = $br->Delete($id);

http_response_code($deleted ? 200 : 500);
echo json_encode([
    "status" => $deleted,
    "message" => $deleted ? "Xóa thương hiệu thành công" : "Xóa thất bại"
]);
?>
