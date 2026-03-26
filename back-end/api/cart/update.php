<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$db = (new Database())->getConnection();

$stmt = $db->prepare("
    UPDATE cart_items SET quantity = ? WHERE id = ?
");
$stmt->execute([$data['quantity'], $data['cart_id']]);

echo json_encode(["status" => true]);

