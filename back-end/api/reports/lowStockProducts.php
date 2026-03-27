<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ReportModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$threshold = isset($_GET['threshold']) ? (int)$_GET['threshold'] : 10;

$db = (new Database())->getConnection();
$model = new ReportModel($db);
$data = $model->getLowStockProducts($threshold);

echo json_encode([
    "status" => true,
    "data" => $data
]);
