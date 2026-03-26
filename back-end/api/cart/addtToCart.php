<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/CartModel.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'], $data['variant_id'], $data['quantity'])) {
    echo json_encode(["status" => false, "message" => "Missing data"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new CartModel($db);

$result = $model->addToCart(
    $data['user_id'],
    $data['variant_id'],
    $data['quantity']
);

echo json_encode(["status" => true, "message" => $result]);

