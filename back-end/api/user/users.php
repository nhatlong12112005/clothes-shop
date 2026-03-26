<?php
ob_start();
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/UserModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$db = (new Database())->getConnection();
$userModel = new UserModel($db);

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : "";
$is_active = isset($_GET['is_active']) ? trim($_GET['is_active']) : "";
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

if ($page < 1) $page = 1;
if ($limit < 1) $limit = 10;
$offset = ($page - 1) * $limit;

try {
    $users = $userModel->getAll($keyword, $is_active, $limit, $offset);
    $totalRecords = $userModel->countUsers($keyword, $is_active);
    
    // Đảm bảo không có rác
    if (ob_get_length()) ob_clean();
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "data" => $users,
        "pagination" => [
            "current_page" => $page,
            "limit" => $limit,
            "total_records" => (int)$totalRecords,
            "total_pages" => ceil($totalRecords / $limit)
        ]
    ]);
} catch (Exception $e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => "Lỗi truy xuất cơ sở dữ liệu: " . $e->getMessage()
    ]);
}
?>
