<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/OrderModel.php";

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['user_id']) || empty($data['shipping']) || empty($data['payment_method'])) {
    echo json_encode(["status" => false, "message" => "Thiếu dữ liệu đặt hàng"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new OrderModel($db);

$result = $model->createOrder(
    $data['user_id'],
    $data['shipping'],
    $data['payment_method']
);

// createOrder returns string "Order created" on success or error message
if ($result === "Order created") {
    // Get the last inserted order_id for this user
    $stmt = $db->prepare("SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$data['user_id']]);
    $orderId = $stmt->fetchColumn();
    echo json_encode([
        "status" => true,
        "message" => $result,
        "order_id" => (int)$orderId
    ]);
} else {
    echo json_encode([
        "status" => false,
        "message" => $result
    ]);
}
