<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$db = (new Database())->getConnection();

$stmt = $db->prepare("DELETE FROM cart_items WHERE id = ?");
$stmt->execute([$data['cart_id']]);

echo json_encode(["status" => true]);

