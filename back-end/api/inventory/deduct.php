<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/InventoryModel.php";

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['variant_id']) || empty($data['quantity'])) {
    echo json_encode([
        "status" => false,
        "message" => "Missing variant_id or quantity"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$model = new InventoryModel($db);

$result = $model->deductStock(
    $data['variant_id'],
    $data['quantity']
);

echo json_encode([
    "status" => $result === "deducted",
    "message" => $result
]);

