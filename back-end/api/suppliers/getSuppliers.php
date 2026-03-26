<?php
require_once "../../config/cors.php"; 
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/SupplierModel.php";

$db = (new Database())->getConnection();
$supplierModel = new SupplierModel($db);

$keyword = $_GET['q'] ?? "";
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

$data = $supplierModel->getSupplier($keyword,$page,$limit);

echo json_encode([
    "status" => true,
    "data" => $data["data"],
    "pagination" => $data["pagination"]
]);
?>
