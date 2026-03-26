<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ImportReceiptModel.php";

$db = (new Database())->getConnection();
$model = new ImportReceiptModel($db);

// Láº¥y filter
$supplier_id = $_GET['supplier_id'] ?? null;
$from_date   = $_GET['from_date'] ?? null;
$to_date     = $_GET['to_date'] ?? null;

// PhÃ¢n trang
$page  = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

$result = $model->getReceipts($supplier_id, $from_date, $to_date, $page, $limit);

echo json_encode([
    "status" => true,
    "data" => $result['data'],
    "pagination" => [
        "total" => $result['total'],
        "page" => $result['page'],
        "limit" => $result['limit'],
        "total_pages" => $result['total_pages']
    ]
]);

