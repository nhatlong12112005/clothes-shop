<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/InventoryModel.php";

$db = (new Database())->getConnection();
$model = new InventoryModel($db);

$filters = [
    "page" => $_GET['page'] ?? 1,
    "limit" => $_GET['limit'] ?? 10
];

$result = $model->getInventoryList($filters);

echo json_encode([
    "status" => true,
    "data" => isset($result['data']) ? $result['data'] : $result,
    "pagination" => $result['pagination'] ?? null
]);
