<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ImportReceiptModel.php";

$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);

$id = $_GET['id'] ?? null;

if (empty($id)) {
    echo json_encode([
        "status" => false,
        "message" => "Thiáº¿u id phiáº¿u nháº­p"
    ]);
    exit;
}

$data = $model->getReceiptDetail($id);

echo json_encode([
    "status" => true,
    "data" => $data
]);

