<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/SupplierModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;

if(!$id){
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiếu ID nhà cung cấp"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$supplierModel = new SupplierModel($db);

$supplier = $supplierModel->findBySupplierId($id);
if(!$supplier){
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Nhà cung cấp này không tồn tại"
    ]);
    exit;
}

$name = isset($_POST['name']) ? trim($_POST['name']) : null;
$phone = isset($_POST['contact']) ? trim($_POST['contact']) : (isset($_POST['phone']) ? trim($_POST['phone']) : null);
$address = isset($_POST['address']) ? trim($_POST['address']) : null;

// chuẩn bị dữ liệu update
$payload = [
    "name" => $name ?? $supplier['name'],
    "phone" => $phone ?? $supplier['phone'],
    "address" => $address ?? $supplier['address'],
    "is_active" => isset($_POST['is_active']) ? (int)$_POST['is_active'] : $supplier['is_active']
];

// update
$updated = $supplierModel->updateSupplier($id, $payload);

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
    "message" => "Cập nhật nhà cung cấp thành công"
]);
?>
