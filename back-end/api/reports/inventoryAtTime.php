<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ReportModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

if (empty($_GET['time'])) {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Thiếu tham số time (YYYY-MM-DD HH:MM:SS)"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new ReportModel($db);
$data = $model->getInventoryAtTime($_GET['time']);

echo json_encode([
    "status" => true,
    "data" => $data
]);
