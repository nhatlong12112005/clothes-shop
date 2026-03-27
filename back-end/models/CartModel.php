<?php

class CartModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /* ===============================
       LẤY HOẶC TẠO CART
    =============================== */
    public function getOrCreateCart($userId)
    {
        $stmt = $this->conn->prepare("SELECT * FROM carts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $cart = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cart) return $cart['id'];

        $stmt = $this->conn->prepare("INSERT INTO carts (user_id) VALUES (?)");
        $stmt->execute([$userId]);

        return $this->conn->lastInsertId();
    }

    /* ===============================
       THÊM VÀO GIỎ (Đã fix logic check kho & active)
    =============================== */
    public function addToCart($userId, $variantId, $quantity)
    {
        // 1. Kiểm tra sản phẩm có đang active không
        $checkActive = $this->conn->prepare("
            SELECT p.status, p.name 
            FROM productvariants pv
            JOIN product_images pi ON pi.id = pv.image_id
            JOIN products p ON p.id = pi.product_id
            WHERE pv.id = ?
        ");
        $checkActive->execute([$variantId]);
        $productStatus = $checkActive->fetch(PDO::FETCH_ASSOC);

        if (!$productStatus || $productStatus['status'] == 0) {
            return "error_inactive"; // Sản phẩm đã bị ẩn hoặc ngừng bán
        }

        // 2. Kiểm tra tồn kho tổng của variant này
        $stockStmt = $this->conn->prepare("
            SELECT COALESCE(SUM(quantity_remaining),0) AS stock
            FROM batchdetails
            WHERE variant_id = ?
        ");
        $stockStmt->execute([$variantId]);
        $currentStock = $stockStmt->fetchColumn();

        $cartId = $this->getOrCreateCart($userId);

        // Lấy số lượng đang có sẵn trong giỏ hàng
        $stmt = $this->conn->prepare("SELECT * FROM cart_items WHERE cart_id = ? AND variant_id = ?");
        $stmt->execute([$cartId, $variantId]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        $existingQty = $item ? $item['quantity'] : 0;
        $newQty = $existingQty + $quantity;

        // Nếu tổng (số trong giỏ + số muốn thêm) > tồn kho thực tế -> chặn lại
        if ($newQty > $currentStock) {
            return "error_out_of_stock"; 
        }

        // 3. Tiến hành thêm/cập nhật giỏ hàng
        if ($item) {
            $update = $this->conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
            $update->execute([$newQty, $item['id']]);
        } else {
            $insert = $this->conn->prepare("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)");
            $insert->execute([$cartId, $variantId, $quantity]);
        }

        return "added";
    }

    /* ===============================
       LẤY GIỎ HÀNG (Đã fix hiển thị giá tiền)
    =============================== */
  public function getCart($userId)
{
    $stmt = $this->conn->prepare("
        SELECT ci.id, ci.variant_id, ci.quantity, pi.product_id,
               pi.color, pv.size, p.name AS product_name, p.profit_rate, p.status AS product_status, pi.image_url as image,
               pv.current_import_price,
               (
                   SELECT COALESCE(SUM(bd.quantity_remaining), 0)
                   FROM batchdetails bd
                   WHERE bd.variant_id = ci.variant_id
               ) AS stock
        FROM cart_items ci
        JOIN carts c ON c.id = ci.cart_id
        JOIN productvariants pv ON pv.id = ci.variant_id
        JOIN product_images pi ON pi.id = pv.image_id
        JOIN products p ON p.id = pi.product_id
        WHERE c.user_id = ?
    ");
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        if ($item['product_status'] == 1 && $item['stock'] > 0) {
            $profitRate = isset($item['profit_rate']) ? (float)$item['profit_rate'] : 0;
            $currentImportPrice = isset($item['current_import_price']) ? (float)$item['current_import_price'] : 0;
            
            $sellPrice = round($currentImportPrice * (1 + $profitRate / 100));

            $item['unit_price'] = $sellPrice;
            $item['total_price'] = $sellPrice * $item['quantity'];
            $item['is_available'] = ($item['quantity'] <= $item['stock']);
        } else {
            $item['total_price'] = 0;
            $item['unit_price'] = 0;
            $item['is_available'] = false;
        }
        unset($item['profit_rate'], $item['current_import_price'], $item['product_status']);
    }
    return $items;
}
}
?>