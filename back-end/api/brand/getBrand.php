<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/BrandModel.php";

$db = (new Database())->getConnection();
$brandModel = new BrandModel($db);

$keyword = $_GET['q'] ?? "";
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

$data = $brandModel->getBrands($keyword, $page, $limit);

echo json_encode([
    "status" => true,
    "data" => $data["data"],
    "pagination" => $data["pagination"]
]);
