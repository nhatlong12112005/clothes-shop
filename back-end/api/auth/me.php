<?php
require_once "../../config/cors.php";
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

error_reporting(E_ALL);
ini_set('display_errors', 1);

// gá»i middleware xÃ¡c thá»±c
require_once "../../utils/AuthMiddleware.php";

// báº¯t buá»™c pháº£i Ä‘Äƒng nháº­p
$user = requireAuth();

// tráº£ thÃ´ng tin user tá»« token
echo json_encode([
    "status" => true,
    "user" => [
        "id" => $user->data->id,
        "username" => $user->data->username,
        "role" => $user->data->role
    ]
]);


