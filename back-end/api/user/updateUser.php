<?php
ob_start();
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id']) || empty($data['username']) || empty($data['email'])) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Vui lòng nhập đủ ID, Username và Email"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new UserModel($db);

$id = (int)$data['id'];

$updateData = [
    'username' => trim($data['username']),
    'email' => trim($data['email']),
    'phone' => isset($data['phone']) ? trim($data['phone']) : null,
    'address' => isset($data['address']) ? trim($data['address']) : null,
    'role' => isset($data['role']) ? $data['role'] : 'customer',
    'is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1
];

try {
    $result = $model->updateUser($id, $updateData);
    if ($result) {
        if (ob_get_length()) ob_clean();
        http_response_code(200);
        echo json_encode(["status" => true, "message" => "Cập nhật tài khoản thành công"]);
    } else {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Lỗi khi cập nhật tài khoản"]);
    }
} catch (Exception $e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Lỗi CSDL: " . $e->getMessage()]);
}
?>
