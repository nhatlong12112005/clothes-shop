<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/DashboardReportModel.php";

$from = $_GET['from'] ?? null;
$to   = $_GET['to']   ?? null;

$db    = (new Database())->getConnection();
$model = new DashboardReportModel($db);

$data = $model->dashboard($from, $to);

http_response_code(200);
echo json_encode([
    "status" => true,
    "data"   => $data
]);
