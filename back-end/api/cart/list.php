<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../models/CartModel.php";

$userId = $_GET['user_id'] ?? null;

$db = (new Database())->getConnection();
$model = new CartModel($db);

$data = $model->getCart($userId);

echo json_encode([
    "status" => true,
    "data" => $data
]);

