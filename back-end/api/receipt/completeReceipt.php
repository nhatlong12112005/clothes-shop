<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
require_once "../../config/database.php";
require_once "../../models/ImportReceiptModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();
$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['receipt_id'])) {
    echo json_encode(["status" => false, "message" => "Thiếu receipt_id"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);
$result = $model->completeReceipt((int)$data['receipt_id']);
echo json_encode($result);
