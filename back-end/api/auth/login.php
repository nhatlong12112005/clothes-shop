<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");


require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../helpers/jwt_helper.php";
require_once "../../vendor/autoload.php";

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(["status" => false, "message" => "Thiáº¿u dá»¯ liá»‡u"]);
    exit;
}

$db = (new Database())->getConnection();
$userModel = new UserModel($db);

$user = $userModel->login($data['email']);

if (!$user || !password_verify($data['password'], $user['password'])) {
    echo json_encode(["status" => false, "message" => "Sai email hoáº·c máº­t kháº©u"]);
    exit;
}
if ($user['is_active'] == 0){
    echo json_encode([
        "status" => false,
        "message" => "TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a"
    ]);
    exit;
}

$token = generateJWT($user);

echo json_encode([
    "status" => true,
    "message" => "ÄÄƒng nháº­p thÃ nh cÃ´ng",
    "token" => $token,
    "user" => [
        "id" => $user['id'],
        "username" => $user['username'],
        "email" => $user['email'],
        "phone" => $user['phone'],
        "address" => $user['address'],
        "role" => $user['role']
    ]
]);
