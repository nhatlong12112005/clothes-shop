<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../models/OrderModel.php";

$filters = [
    "page"   => $_GET['page'] ?? 1,
    "limit"  => $_GET['limit'] ?? 10,
    "status" => $_GET['status'] ?? null,
    "from"   => $_GET['from'] ?? null,
    "to"     => $_GET['to'] ?? null,
    "user_id"=> $_GET['user_id'] ?? null
];

$db = (new Database())->getConnection();
$model = new OrderModel($db);

$result = $model->getOrders($filters);

echo json_encode([
    "status" => true,
    "data" => isset($result['data']) ? $result['data'] : $result,
    "pagination" => $result['pagination'] ?? null
]);
