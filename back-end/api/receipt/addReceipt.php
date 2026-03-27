<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");


require_once "../../config/database.php";
require_once "../../models/ImportReceiptModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);

$data = json_decode(file_get_contents("php://input"), true);

if (
    empty($data['supplier_id']) ||
    empty($data['items']) ||
    !is_array($data['items'])
) {
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiếu dữ liệu bắt buộc"
    ]);
    exit;
}

$result = $model->createImportReceipt($data);

echo json_encode($result);
