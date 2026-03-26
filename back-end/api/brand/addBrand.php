<?php
ob_start();
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/BrandModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$name = isset($_POST['name']) ? trim($_POST['name']) : '';

if($name === ""){
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Tên thương hiệu không được để trống"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$brandModel = new BrandModel($db);

$result = $brandModel->createBrand($name);

if ($result === "created") {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "message" => "Thêm thương hiệu thành công"
    ]);
} 
elseif ($result === "restored") {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "message" => "Thương hiệu đã tồn tại trước đó, đã khôi phục lại"
    ]);
} 
elseif ($result === "exists") {
    http_response_code(409);
    echo json_encode([
        "status" => false,
        "message" => "Thương hiệu đã tồn tại"
    ]);
} 
else {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Thêm thương hiệu thất bại"
    ]);
}
?>
