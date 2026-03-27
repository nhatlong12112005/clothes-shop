<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";

$data = json_decode(file_get_contents("php://input"), true);

// Validate dá»¯ liá»‡u
if (
    empty($data['username']) ||
    empty($data['email']) ||
    empty($data['password']) ||
    empty(trim($data['address'])) ||
    empty(trim($data['phone']))
) {
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiáº¿u dá»¯ liá»‡u báº¯t buá»™c"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$userModel = new UserModel($db);

// Check email tá»“n táº¡i
$existUser = $userModel->login($data['email']);
if ($existUser) {
    http_response_code(409);
    echo json_encode([
        "status" => false,
        "message" => "Email Ä‘Ã£ tá»“n táº¡i"
    ]);
    exit;
}

// Register
$success = $userModel->register(
    $data['username'],
    $data['password'],
    $data['email'],
    $data['phone'] ?? "",
    $data['address'] ?? ""
);

if ($success) {
    http_response_code(201);
    echo json_encode([
        "status" => true,
        "message" => "ÄÄƒng kÃ½ thÃ nh cÃ´ng"
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "ÄÄƒng kÃ½ tháº¥t báº¡i"
    ]);
}

