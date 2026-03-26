<?php
ob_start();
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id']) || !isset($data['status'])) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Thiếu ID hoặc Trạng thái"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new UserModel($db);

$id = (int)$data['id'];
$status = (int)$data['status']; // 1 (Active) or 0 (Locked)

// Prevent admin from locking themselves (optional, but good practice)
if ($admin->id == $id && $status == 0) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Bạn không thể tự khóa tài khoản của chính mình"]);
    exit;
}

try {
    $result = $model->setActive($id, $status);
    if ($result) {
        if (ob_get_length()) ob_clean();
        http_response_code(200);
        $msg = $status == 1 ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản";
        echo json_encode(["status" => true, "message" => $msg]);
    } else {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        echo json_encode(["status" => false, "message" => "Lỗi khi cập nhật trạng thái"]);
    }
} catch (Exception $e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode(["status" => false, "message" => "Lỗi CSDL: " . $e->getMessage()]);
}
?>
