<?php
ob_start();
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['username']) || empty($data['password']) || empty($data['email'])) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Vui lòng nhập Username, Password và Email"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new UserModel($db);

$username = $data['username'];
$password = $data['password'];
$email = $data['email'];
$phone = isset($data['phone']) ? $data['phone'] : null;
$address = isset($data['address']) ? $data['address'] : null;

// Kiểm tra email tồn tại (sử dụng hàm login tạm để check)
$existingUser = $model->login($email);
if ($existingUser) {
    if (ob_get_length()) ob_clean();
    http_response_code(409);
    echo json_encode(["status" => false, "message" => "Email đã được sử dụng"]);
    exit;
}

try {
    $result = $model->register($username, $password, $email, $phone, $address);
    if ($result) {
        // Cập nhật lại role nếu cần, mặc định register set là 'customer'
        if (isset($data['role']) && $data['role'] === 'admin') {
           // Nếu muốn tạo Admin từ Admin Panel thì cần lệnh UPDATE riêng hoặc sửa lại hàm register.
           // Tạm thời Admin có thể sửa quyền tài khoản sau khi tạo.
        }
        
        if (ob_get_length()) ob_clean();
        http_response_code(201);
        echo json_encode(["status" => true, "message" => "Thêm tài khoản thành công"]);
    } else {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Lỗi khi lưu tài khoản"]);
    }
} catch (Exception $e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Lỗi CSDL: " . $e->getMessage()]);
}
?>
