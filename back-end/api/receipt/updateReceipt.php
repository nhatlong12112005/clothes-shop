<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
require_once "../../config/database.php";
require_once "../../models/ImportReceiptModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();
$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['receipt_id']) || empty($data['items']) || !is_array($data['items'])) {
    echo json_encode(["status" => false, "message" => "Thiếu dữ liệu bắt buộc"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);
$result = $model->updateReceipt($data['receipt_id'], $data);
echo json_encode($result);
