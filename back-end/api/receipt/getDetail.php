<?php
ob_start();
require_once __DIR__ . "/../../config/cors.php";
header("Content-Type: application/json");

require_once __DIR__ . "/../../config/database.php";
require_once __DIR__ . "/../../models/ImportReceiptModel.php";
require_once __DIR__ . "/../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Thiếu mã phiếu nhập"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);

$detail = $model->getReceiptDetail($id);

if ($detail) {
    if (ob_get_length()) ob_clean();
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data" => $detail
    ]);
} else {
    if (ob_get_length()) ob_clean();
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "Không tìm thấy thông tin phiếu nhập"
    ]);
}
?>
