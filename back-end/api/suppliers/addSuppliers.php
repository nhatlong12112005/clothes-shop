<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/SupplierModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$phone = isset($_POST['contact']) ? trim($_POST['contact']) : ''; // supplier.js uses "contact" in the form but model uses "phone"
if(empty($phone) && isset($_POST['phone'])) $phone = trim($_POST['phone']); // fallback

$email = isset($_POST['email']) ? trim($_POST['email']) : ''; // Note: SupplierModel createSupplier only takes name, phone, address but form has email. We pass what model accepts.
$address = isset($_POST['address']) ? trim($_POST['address']) : '';

if($name === ""){
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Tên nhà cung cấp không được để trống"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$supplier = new SupplierModel($db);

$result = $supplier->createSupplier($name, $phone, $address);

if ($result === "created") {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "message" => "Thêm nhà cung cấp thành công"
    ]);
} 
elseif ($result === "restored") {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "message" => "Nhà cung cấp đã tồn tại trước đó, đã khôi phục lại"
    ]);
} 
elseif ($result === "exists") {
    http_response_code(409);
    echo json_encode([
        "status" => false,
        "message" => "Nhà cung cấp đã tồn tại"
    ]);
} 
else {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Thêm nhà cung cấp thất bại"
    ]);
}
?>
