<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

/**
 * CHỈ CHO PHÉP NHỮNG NGƯỜI ĐÃ ĐĂNG NHẬP 
 * (Admin hay User đều được sửa Profile của chính mình)
 */
$currentUser = requireAuth();

$data = json_decode(file_get_contents("php://input"), true);

$db = (new Database())->getConnection();
$userModel = new UserModel($db);

/**
 * Láy thông tin user hiện tại từ Database
 */
$user = $userModel->findById($currentUser->data->id);
if (!$user) {
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Tài khoản không tồn tại."
    ]);
    exit;
}

/**
 * CHỈ CHO PHÉP SỬA THÔNG TIN CÁ NHÂN (LOẠI BỎ QUYỀN VÀ TRẠNG THÁI)
 * Đảm bảo 1 User thường không tự thăng cấp lên Admin hoặc Tự mở khóa tài khoản
 */
$payload = [
    "username"  => trim($data['username'] ?? $user['username']),
    "phone"     => trim($data['phone'] ?? $user['phone']),
    "address"   => trim($data['address'] ?? $user['address']),
    
    // Giữ nguyên các thông số nhạy cảm cũ
    "email"     => $user['email'], 
    "role"      => $user['role'],
    "is_active" => $user['is_active']
];

/**
 * Validate username/phone
 */
if (empty($payload['username'])) {
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Vui lòng nhập Họ tên đầy đủ."
    ]);
    exit;
}

/**
 * Cập nhật User Profile dựa vào ID đang đăng nhập
 */
$updated = $userModel->updateUser($user['id'], $payload);

if (!$updated) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Cập nhật thất bại. Vui lòng thử lại sau."
    ]);
    exit;
}

// Trả về luồng Data mới nhất để Client thay thế LocalStorage
$newProfile = $userModel->findById($user['id']);
unset($newProfile['password']); // Xóa chuỗi băm trước khi leak ra

echo json_encode([
    "status" => true,
    "message" => "Cập nhật Thông tin thành công!",
    "user" => $newProfile
]);
?>
