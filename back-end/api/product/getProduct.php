<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ProductModel.php";

$db = (new Database())->getConnection();
$productModel = new ProductModel($db);

$filters = [
    "brand_id"    => $_GET['brand_id'] ?? null,
    "category_id" => $_GET['category_id'] ?? null,
    "keyword"     => $_GET['keyword'] ?? null,
    "min_price"   => $_GET['min_price'] ?? null,
    "max_price"   => $_GET['max_price'] ?? null,
    "page"        => $_GET['page'] ?? 1,
    "limit"       => $_GET['limit'] ?? 10,
    "sort"        => $_GET['sort'] ?? null
];

$result = $productModel->getProducts($filters);

echo json_encode([
    "status" => true,
    "data" => $result["data"],
    "pagination" => $result["pagination"]
]);
