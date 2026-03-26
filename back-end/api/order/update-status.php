<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../models/OrderModel.php";

$data = json_decode(file_get_contents("php://input"), true);

$db = (new Database())->getConnection();
$model = new OrderModel($db);

$result = $model->updateStatus(
    $data['order_id'],
    $data['status']
);

echo json_encode([
    "status" => true,
    "message" => $result
]);

