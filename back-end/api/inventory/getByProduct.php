<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/InventoryModel.php";

if (!isset($_GET['product_id'])) {
    echo json_encode([
        "status" => false,
        "message" => "Missing product_id"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$model = new InventoryModel($db);

$result = $model->getStockByProduct($_GET['product_id']);

echo json_encode([
    "status" => true,
    "data" => $result
]);

