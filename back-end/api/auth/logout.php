<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../middlewares/authMiddleware.php";

// kiá»ƒm tra token
$user = requireAuth();

echo json_encode([
    "status" => true,
    "message" => "ÄÄƒng xuáº¥t thÃ nh cÃ´ng"
]);
