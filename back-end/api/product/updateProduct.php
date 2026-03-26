<?php
ob_start();
require_once "../../config/cors.php";
header("Content-Type: application/json");

require_once "../../config/database.php";
require_once "../../models/ProductModel.php";
require_once "../../utils/AuthMiddleware.php";

$admin = requireAdmin();

$id = isset($_POST['id']) ? $_POST['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode([
        "status" => false,
        "message" => "Thiếu ID sản phẩm"
    ]);
    exit;
}

$db = (new Database())->getConnection();
$productModel = new ProductModel($db);

$data = [
    'category_id' => isset($_POST['category_id']) ? $_POST['category_id'] : null,
    'brand_id' => isset($_POST['brand_id']) ? $_POST['brand_id'] : null,
    'name' => isset($_POST['name']) ? trim($_POST['name']) : '',
    'description' => isset($_POST['description']) ? trim($_POST['description']) : '',
    'profit_rate' => isset($_POST['profit_rate']) ? $_POST['profit_rate'] : 20, 
    'proposed_price' => isset($_POST['proposed_price']) ? $_POST['proposed_price'] : 0, 
    'status' => isset($_POST['status']) ? $_POST['status'] : 1,
    'colors' => []
];

// parse colors JSON string from FormData
if (isset($_POST['colors']) && !empty($_POST['colors'])) {
    $decodedColors = json_decode($_POST['colors'], true);
    if (is_array($decodedColors)) {
        $data['colors'] = $decodedColors;
    }
}

// create upload dir if not exists
$uploadDir = "../../uploads/products/";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$mainIndex = isset($_POST['main_image_index']) ? (int)$_POST['main_image_index'] : 0;
$currentIndex = 0;

// Xử lý upload file ảnh mới và attach vào tung color trong $data['colors']
if(isset($_FILES['image_files']) && is_array($_FILES['image_files']['name'])) {
    $fileCount = count($_FILES['image_files']['name']);
    for($i = 0; $i < $fileCount; $i++) {
        // Cần đảm bảo color index tồn tại
        if(isset($data['colors'][$currentIndex])) {
            
            // Nếu có file thật sự được upload (size > 0)
            if($_FILES['image_files']['error'][$i] === UPLOAD_ERR_OK && $_FILES['image_files']['size'][$i] > 0) {
                $tmpName = $_FILES['image_files']['tmp_name'][$i];
                $fileName = time() . '_' . basename($_FILES['image_files']['name'][$i]);
                $targetPath = $uploadDir . $fileName;
                
                if(move_uploaded_file($tmpName, $targetPath)) {
                    $fileUrl = "http://localhost/projectPhp/clothes-shop/back-end/uploads/products/" . $fileName;
                    $data['colors'][$currentIndex]['image_url'] = $fileUrl;
                }
            } else {
                // Nếu không upload file mới, sử dụng the existing url
                $data['colors'][$currentIndex]['image_url'] = isset($data['colors'][$currentIndex]['existing_url']) ? $data['colors'][$currentIndex]['existing_url'] : '';
            }
            
            // Xử lý is_main
            $data['colors'][$currentIndex]['is_main'] = ($currentIndex == $mainIndex) ? 1 : 0;
        }
        $currentIndex++;
    }
}

// Update product in DB
$result = $productModel->updateProduct($id, $data);

if ($result === "updated") {
    http_response_code(200);
    echo json_encode([
        "status" => true,
        "message" => "Cập nhật sản phẩm thành công"
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "status" => false,
        "message" => $result
    ]);
}
?>
