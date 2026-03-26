<?php
require_once __DIR__ . "/../vendor/autoload.php"; // <<< QUAN TRỌNG
require_once __DIR__ . "/../config/jwt.php";
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function generateJWT($user) {
    $config = require __DIR__ . "/../config/jwt.php";

    $payload = [
        "iss" => $config['issuer'],
        "aud" => $config['audience'],
        "iat" => time(),
        "exp" => time() + $config['expire'],
        "data" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "email" => $user['email'],
            "role" => $user['role'],
            "phone" => $user['phone'],
            "address" => $user['address']
        ]
    ];

    return JWT::encode($payload, $config['secret_key'], 'HS256');
}

function verifyJWT($token) {
    $config = require __DIR__ . "/../config/jwt.php";
    return JWT::decode($token, new Key($config['secret_key'], 'HS256'));
}
