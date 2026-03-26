<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ProductModel.php";

if (!isset($_GET['id'])) {
    echo json_encode([
        "status" => false,
        "message" => "Missing product id"
    ]);
    exit;
}

$id = $_GET['id'];

$db = (new Database())->getConnection();
$productModel = new ProductModel($db);

$result = $productModel->getProductDetail($id);

if (!$result) {
    echo json_encode([
        "status" => false,
        "message" => "Product not found"
    ]);
    exit;
}

echo json_encode([
    "status" => true,
    "data" => $result
]);

