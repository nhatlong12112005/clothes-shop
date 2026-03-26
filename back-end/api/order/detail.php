<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../models/OrderModel.php";

$orderId = $_GET['order_id'] ?? null;

$db = (new Database())->getConnection();
$model = new OrderModel($db);

$order = $model->getOrderDetail($orderId);

echo json_encode([
    "status" => true,
    "data" => $order
]);

