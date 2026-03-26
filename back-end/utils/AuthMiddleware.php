<?php
require_once __DIR__ . "/../helpers/jwt_helper.php";

function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    } else {
        $rawHeaders = getallheaders();
        foreach($rawHeaders as $key => $val) {
            if (strtolower($key) == 'authorization') {
                $headers = trim($val);
                break;
            }
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }

    return null;
}

// Bắt buộc đăng nhập
function requireAuth() {
    $token = getBearerToken();

    if (!$token) {
        if (ob_get_length()) ob_clean();
        http_response_code(401);
        echo json_encode([
            "status" => false,
            "message" => "Thiếu token truy cập. Vui lòng đăng nhập lại."
        ]);
        exit;
    }

    try {
        return verifyJWT($token);
    } catch (Exception $e) {
        if (ob_get_length()) ob_clean();
        http_response_code(401);
        echo json_encode([
            "status" => false,
            "message" => "Hết phiên đăng nhập. Vui lòng đăng nhập lại."
        ]);
        exit;
    }
}

// Chỉ admin
function requireAdmin() {
    $decoded = requireAuth();

    if ($decoded->data->role !== 'admin') {
        if (ob_get_length()) ob_clean();
        http_response_code(403);
        echo json_encode([
            "status" => false,
            "message" => "Không có quyền truy cập"
        ]);
        exit;
    }

    return $decoded;
}
