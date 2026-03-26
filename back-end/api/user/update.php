<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

/**
 * CHá»ˆ ADMIN
 */
$admin = requireAuth();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiáº¿u ID user"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$userModel = new UserModel($db);

/**
 * Kiá»ƒm tra user tá»“n táº¡i
 */
$user = $userModel->findById($data['id']);
if (!$user) {
    http_response_code(404);
    echo json_encode([
        "status" => false,
        "message" => "User khÃ´ng tá»“n táº¡i"
    ]);
    exit;
}

/**
 * Chuáº©n bá»‹ dá»¯ liá»‡u update
 */
$payload = [
    "username"  => $data['username']  ?? $user['username'],
    "email"     => $data['email']     ?? $user['email'],
    "phone"     => $data['phone']     ?? $user['phone'],
    "address"   => $data['address']   ?? $user['address'],
    "role"      => $data['role']      ?? $user['role'],
    "is_active" => isset($data['is_active']) ? (int)$data['is_active'] : $user['is_active']
];

/**
 * Update 
 */
$updated = $userModel->updateUser($data['id'], $payload);

if (!$updated) {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Cáº­p nháº­t tháº¥t báº¡i"
    ]);
    exit;
}

echo json_encode([
    "status" => true,
    "message" => "Cáº­p nháº­t user thÃ nh cÃ´ng"
]);


