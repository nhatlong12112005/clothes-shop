<?php

class OrderModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function createOrder($userId, $shippingInfo = null, $paymentMethod)
    {
        try {
            $this->conn->beginTransaction();

            /* ==============================
               0️⃣ KIỂM TRA TÀI KHOẢN BỊ KHÓA
            ============================== */
            $userCheck = $this->conn->prepare("SELECT is_active FROM users WHERE id = ?");
            $userCheck->execute([$userId]);
            $userRow = $userCheck->fetch(PDO::FETCH_ASSOC);
            if (!$userRow || $userRow['is_active'] == 0) {
                throw new Exception("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ để được giúp đỡ.");
            }

            /* ==============================
               1️⃣ LẤY GIỎ HÀNG VÀ TỶ SUẤT LỢI NHUẬN (PROFIT_RATE)
            ============================== */
            $stmt = $this->conn->prepare("
                SELECT ci.*, pi.product_id, p.profit_rate, pv.current_import_price
                FROM cart_items ci
                JOIN carts c ON c.id = ci.cart_id
                JOIN productvariants pv ON pv.id = ci.variant_id
                JOIN product_images pi ON pi.id = pv.image_id
                JOIN products p ON p.id = pi.product_id
                WHERE c.user_id = ?
            ");
            $stmt->execute([$userId]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($items)) {
                throw new Exception("Cart is empty");
            }

            /* ==============================
               2️⃣ XỬ LÝ SHIPPING (Giữ nguyên logic của bạn)
            ============================== */
            if (!empty($shippingInfo)) {
                $shippingName    = $shippingInfo['name'] ?? '';
                $shippingPhone   = $shippingInfo['phone'] ?? '';
                $shippingAddress = $shippingInfo['address'] ?? '';
                $shippingWard    = $shippingInfo['ward'] ?? '';
            } else {
                $userStmt = $this->conn->prepare("SELECT username, phone, address FROM users WHERE id = ?");
                $userStmt->execute([$userId]);
                $user = $userStmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new Exception("User not found");
                }

                $shippingName    = $user['username'];
                $shippingPhone   = $user['phone'];
                $shippingAddress = $user['address'];
            }

            /* ==============================
               3️⃣ TẠO ORDER
            ============================== */
            $stmt = $this->conn->prepare("
                INSERT INTO orders (user_id, total_price, status, shipping_name, shipping_phone, shipping_address, shipping_ward, payment_method)
                VALUES (?, 0, 'pending', ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$userId, $shippingName, $shippingPhone, $shippingAddress, $shippingWard, $paymentMethod]);
            $orderId = $this->conn->lastInsertId();
            $total = 0;

            /* ==============================
               4️⃣ XỬ LÝ TỪNG ITEM (FIFO + CHẶN RACE CONDITION)
            ============================== */
            $logStmt = $this->conn->prepare("
                INSERT INTO inventory_logs (variant_id, change_qty, type, reference_id)
                VALUES (?, ?, 'export', ?)
            ");

            foreach ($items as $item) {
                $remaining = $item['quantity'];
                $profitRate = isset($item['profit_rate']) ? (float)$item['profit_rate'] : 0; // Lấy tỷ suất lợi nhuận
                $currentImportPrice = isset($item['current_import_price']) ? (float)$item['current_import_price'] : 0;
                $sellPrice = round($currentImportPrice * (1 + $profitRate / 100));

                // THÊM 'FOR UPDATE' ĐỂ KHÓA DÒNG KHI CÓ NGƯỜI ĐANG MUA
                $batchStmt = $this->conn->prepare("
                    SELECT id, import_price, quantity_remaining
                    FROM batchdetails
                    WHERE variant_id = ?
                    AND quantity_remaining > 0
                    ORDER BY created_at ASC
                    FOR UPDATE 
                ");
                $batchStmt->execute([$item['variant_id']]);
                $batches = $batchStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($batches as $batch) {
                    if ($remaining <= 0) break;

                    $take = min($remaining, $batch['quantity_remaining']);

                    // Tạo orderdetail với giá bán
                    $detailStmt = $this->conn->prepare("
                        INSERT INTO orderdetails (order_id, variant_id, batch_id, quantity, price_at_purchase)
                        VALUES (?, ?, ?, ?, ?)
                    ");
                    $detailStmt->execute([$orderId, $item['variant_id'], $batch['id'], $take, $sellPrice]);

                    // Trừ kho
                    $update = $this->conn->prepare("
                        UPDATE batchdetails
                        SET quantity_remaining = quantity_remaining - ?
                        WHERE id = ?
                    ");
                    $update->execute([$take, $batch['id']]);

                    // Ghi log xuất kho
                    $logStmt->execute([$item['variant_id'], -$take, $orderId]);

                    $total += $take * $sellPrice; // Cộng tổng tiền bằng giá bán
                    $remaining -= $take;
                }

                if ($remaining > 0) {
                    throw new Exception("Sản phẩm đã thay đổi số lượng tồn kho. Quý khách vui lòng kiểm tra lại Giỏ hàng.");
                }
            }

            /* ==============================
               5️⃣ UPDATE TOTAL & XÓA CART
            ============================== */
            $updateTotal = $this->conn->prepare("UPDATE orders SET total_price = ? WHERE id = ?");
            $updateTotal->execute([$total, $orderId]);

            $this->conn->prepare("
                DELETE ci FROM cart_items ci
                JOIN carts c ON c.id = ci.cart_id
                WHERE c.user_id = ?
            ")->execute([$userId]);

            $this->conn->commit();
            return "Order created";

        } catch (Exception $e) {
            $this->conn->rollBack();
            return $e->getMessage();
        }
    }
 public function updateStatus($orderId, $newStatus)
{
    try {
        $this->conn->beginTransaction();

        $stmt = $this->conn->prepare("SELECT status FROM orders WHERE id = ? FOR UPDATE");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) throw new Exception("Không tìm thấy đơn hàng");

        $currentStatus = $order['status'];

        // 1. Chặn chuyển đổi nếu đơn hàng đã kết thúc
        if (in_array($currentStatus, ['completed', 'cancelled'])) {
            throw new Exception("Đơn hàng đã đóng (Hủy/Thành công), không thể đổi trạng thái.");
        }

        // 2. Logic hoàn kho nếu hủy
        if ($newStatus === 'cancelled') {
            $this->restoreStock($orderId);
        }

        // 3. Cập nhật
        $update = $this->conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $update->execute([$newStatus, $orderId]);

        $this->conn->commit();
        return "Cập nhật thành công";
    } catch (Exception $e) {
        $this->conn->rollBack();
        return $e->getMessage();
    }
}
private function restoreStock($orderId)
{
    $stmt = $this->conn->prepare("
        SELECT variant_id, batch_id, quantity 
        FROM orderdetails
        WHERE order_id = ?
    ");
    $stmt->execute([$orderId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $logStmt = $this->conn->prepare("
        INSERT INTO inventory_logs (variant_id, change_qty, type, reference_id)
        VALUES (?, ?, 'adjustment', ?)
    ");

    foreach ($items as $item) {
        $update = $this->conn->prepare("
            UPDATE batchdetails
            SET quantity_remaining = quantity_remaining + ?
            WHERE id = ?
        ");
        $update->execute([$item['quantity'], $item['batch_id']]);

        // Ghi log hoàn kho
        $logStmt->execute([$item['variant_id'], $item['quantity'], $orderId]);
    }
}
public function getOrderDetail($orderId)
{
    $stmt = $this->conn->prepare("
        SELECT o.*, u.username
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE o.id = ?
    ");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) return null;

    $detailStmt = $this->conn->prepare("
        SELECT od.*, pi.color, pv.size, p.name AS product_name, pi.image_url as image
        FROM orderdetails od
        JOIN productvariants pv ON pv.id = od.variant_id
        JOIN product_images pi ON pi.id = pv.image_id
        JOIN products p ON p.id = pi.product_id
        WHERE od.order_id = ?
    ");
    $detailStmt->execute([$orderId]);

    $order['items'] = $detailStmt->fetchAll(PDO::FETCH_ASSOC);

    return $order;
}
public function getOrders($filters = [])
{
    $page  = $filters['page'] ?? 1;
    $limit = $filters['limit'] ?? 10;
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];

    if (!empty($filters['status'])) {
        $where[] = "o.status = ?";
        $params[] = $filters['status'];
    }

    if (!empty($filters['user_id'])) {
        $where[] = "o.user_id = ?";
        $params[] = $filters['user_id'];
    }

    if (!empty($filters['from'])) {
        $where[] = "DATE(o.order_date) >= ?";
        $params[] = $filters['from'];
    }

    if (!empty($filters['to'])) {
        $where[] = "DATE(o.order_date) <= ?";
        $params[] = $filters['to'];
    }

    $whereSql = "";
    if (!empty($where)) {
        $whereSql = "WHERE " . implode(" AND ", $where);
    }

    // Count
    $countSql = "SELECT COUNT(*) FROM orders o $whereSql";
    $countStmt = $this->conn->prepare($countSql);
    $countStmt->execute($params);
    $totalRecords = $countStmt->fetchColumn();
    $totalPages = ceil($totalRecords / $limit);

    $sql = "
        SELECT o.*, u.username
        FROM orders o
        JOIN users u ON u.id = o.user_id
        $whereSql
        ORDER BY o.shipping_ward ASC, o.id DESC
        LIMIT $limit OFFSET $offset
    ";

    $stmt = $this->conn->prepare($sql);
    $stmt->execute($params);

    return [
        "data" => $stmt->fetchAll(PDO::FETCH_ASSOC),
        "pagination" => [
            "current_page" => (int)$page,
            "limit" => (int)$limit,
            "total_records" => (int)$totalRecords,
            "total_pages" => (int)$totalPages
        ]
    ];
}
}