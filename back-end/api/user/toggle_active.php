<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

$auth = requireAdmin(); // chá»‰ admin

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'], $data['is_active'])) {
    echo json_encode(["status" => false, "message" => "Thiáº¿u dá»¯ liá»‡u"]);
    exit;
}

$db = (new Database())->getConnection();
$userModel = new UserModel($db);

$userModel->setActive($data['id'], $data['is_active']);

echo json_encode([
    "status" => true,
    "message" => $data['is_active'] ? "Má»Ÿ khÃ³a thÃ nh cÃ´ng" : "ÄÃ£ khÃ³a tÃ i khoáº£n"
]);
?>

