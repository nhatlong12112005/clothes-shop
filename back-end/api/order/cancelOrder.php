<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/OrderModel.php";

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (empty($data['order_id']) || empty($data['user_id'])) {
    echo json_encode(["status" => false, "message" => "Thiếu thông tin đơn hàng."]);
    exit;
}

$orderId = (int)$data['order_id'];
$userId  = (int)$data['user_id'];

$db = (new Database())->getConnection();

// Security check: make sure the order belongs to this user AND is cancellable
$stmt = $db->prepare("SELECT id, status, user_id FROM orders WHERE id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    echo json_encode(["status" => false, "message" => "Không tìm thấy đơn hàng."]);
    exit;
}

// Ensure the order belongs to the requesting user
if ((int)$order['user_id'] !== $userId) {
    echo json_encode(["status" => false, "message" => "Bạn không có quyền hủy đơn hàng này."]);
    exit;
}

// Only allow cancellation when status is pending or processing
$cancellableStatuses = ['pending', 'processing'];
if (!in_array($order['status'], $cancellableStatuses)) {
    echo json_encode(["status" => false, "message" => "Đơn hàng không thể hủy ở trạng thái hiện tại."]);
    exit;
}

$model = new OrderModel($db);
$result = $model->updateStatus($orderId, 'cancelled');

if ($result === "Cập nhật thành công") {
    echo json_encode(["status" => true, "message" => "Đơn hàng đã được hủy thành công."]);
} else {
    echo json_encode(["status" => false, "message" => $result]);
}
