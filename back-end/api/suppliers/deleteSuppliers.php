<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/SupplierModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode([
        'status' => false,
        "message" => "Thiếu ID nhà cung cấp"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$sp = new SupplierModel($db);

// kiểm tra tồn tại
$supplier = $sp->findBySupplierId($id);

if (!$supplier) {
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Nhà cung cấp không tồn tại"
    ]);
    exit;
}

// nếu đã bị xóa rồi
if ($supplier['is_active'] == 0) {
    http_response_code(409);
    echo json_encode([
        "status" => false,
        "message" => "Nhà cung cấp đã bị xóa trước đó"
    ]);
    exit;
}

// ✔ xóa mềm (gọi từ model)
$deleted = $sp->Delete($id);

http_response_code($deleted ? 200 : 500);
echo json_encode([
    "status" => $deleted,
    "message" => $deleted ? "Xóa nhà cung cấp thành công" : "Xóa thất bại"
]);
?>
