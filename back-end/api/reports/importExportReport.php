<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ReportModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

if (empty($_GET['from']) || empty($_GET['to'])) {
    http_response_code(400);
    echo json_encode(["status" => false, "message" => "Thiếu tham số from và to (YYYY-MM-DD)"]);
    exit;
}

$db = (new Database())->getConnection();
$model = new ReportModel($db);
$data = $model->getImportExportReport($_GET['from'], $_GET['to']);

echo json_encode([
    "status" => true,
    "data" => $data
]);
