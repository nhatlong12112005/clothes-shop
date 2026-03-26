<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/CategoryModel.php";

$db = (new Database())->getConnection();
$cate = new CategoryModel($db);

$keyword = $_GET['q'] ?? "";
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

$categories = $cate->getAllCate($keyword, $page, $limit);

echo json_encode([
    "status" => true,
    "data" => $categories["data"],
    "pagination" => $categories["pagination"]
]);
