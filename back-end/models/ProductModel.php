<?php

class ProductModel
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /* ===============================
     1. CREATE PRODUCT
     =============================== */
    public function createProduct($data)
    {
        try {
            $this->conn->beginTransaction();

            // Insert product
            $stmt = $this->conn->prepare("
                INSERT INTO products 
                (category_id, brand_id, name, description, profit_rate, proposed_price, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['category_id'],
                $data['brand_id'],
                $data['name'],
                $data['description'],
                $data['profit_rate'],
                $data['proposed_price'],
                $data['status']
            ]);

            $productId = $this->conn->lastInsertId();

            if (!empty($data['colors'])) {
                foreach ($data['colors'] as $colorData) {
                    $stmtImg = $this->conn->prepare("
                        INSERT INTO product_images (product_id, image_url, is_main, color)
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmtImg->execute([
                        $productId,
                        $colorData['image_url'],
                        isset($colorData['is_main']) ? $colorData['is_main'] : 0,
                        $colorData['color']
                    ]);
                    $imageId = $this->conn->lastInsertId();

                    if (!empty($colorData['sizes'])) {
                        foreach ($colorData['sizes'] as $sizeData) {
                            $stmtVariant = $this->conn->prepare("
                                INSERT INTO productvariants
                                (image_id, size, status)
                                VALUES (?, ?, 1)
                            ");
                            $stmtVariant->execute([
                                $imageId,
                                $sizeData['size']
                            ]);
                        }
                    }
                }
            }

            $this->conn->commit();
            return "created";

        }
        catch (Exception $e) {
            $this->conn->rollBack();
            return $e->getMessage();
        }
    }

    /* ===============================
     2. UPDATE PRODUCT
     =============================== */
    public function updateProduct($id, $data)
    {
        try {
            $this->conn->beginTransaction();

            // Update product
            $stmt = $this->conn->prepare("
                UPDATE products SET
                    category_id = ?,
                    brand_id = ?,
                    name = ?,
                    description = ?,
                    profit_rate = ?,
                    proposed_price = ?,
                    status = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['category_id'],
                $data['brand_id'],
                $data['name'],
                $data['description'],
                $data['profit_rate'],
                $data['proposed_price'],
                $data['status'],
                $id
            ]);

            // Update / Insert Colors & Sizes
            if (!empty($data['colors'])) {
                $stmtGetVarIds = $this->conn->prepare("
                    SELECT pv.id 
                    FROM productvariants pv
                    JOIN product_images pi ON pi.id = pv.image_id
                    WHERE pi.product_id = ?
                ");
                $stmtGetVarIds->execute([$id]);
                $existingVarIds = $stmtGetVarIds->fetchAll(PDO::FETCH_COLUMN);

                $keptVarIds = [];

                foreach ($data['colors'] as $colorData) {
                    $imageId = null;

                    if (!empty($colorData['existing_image_id'])) {
                        // Cập nhật existing image
                        $stmtImgUpdate = $this->conn->prepare("
                            UPDATE product_images 
                            SET image_url = ?, is_main = ?, color = ?
                            WHERE id = ? AND product_id = ?
                        ");
                        $stmtImgUpdate->execute([
                            $colorData['image_url'],
                            isset($colorData['is_main']) ? $colorData['is_main'] : 0,
                            $colorData['color'],
                            $colorData['existing_image_id'],
                            $id
                        ]);
                        $imageId = $colorData['existing_image_id'];
                    }
                    else {
                        // Insert new image
                        $stmtImgInsert = $this->conn->prepare("
                            INSERT INTO product_images (product_id, image_url, is_main, color)
                            VALUES (?, ?, ?, ?)
                        ");
                        $stmtImgInsert->execute([
                            $id,
                            $colorData['image_url'],
                            isset($colorData['is_main']) ? $colorData['is_main'] : 0,
                            $colorData['color']
                        ]);
                        $imageId = $this->conn->lastInsertId();
                    }

                    if (!empty($colorData['sizes'])) {
                        foreach ($colorData['sizes'] as $sizeData) {
                            if (!empty($sizeData['id'])) {
                                // Cập nhật existing size
                                $stmtVarUpdate = $this->conn->prepare("
                                    UPDATE productvariants 
                                    SET size = ?, status = 1, image_id = ?
                                    WHERE id = ?
                                ");
                                $stmtVarUpdate->execute([
                                    $sizeData['size'],
                                    $imageId,
                                    $sizeData['id']
                                ]);
                                $keptVarIds[] = $sizeData['id'];
                            }
                            else {
                                // Insert new size
                                $stmtVarInsert = $this->conn->prepare("
                                    INSERT INTO productvariants (image_id, size, status)
                                    VALUES (?, ?, 1)
                                ");
                                $stmtVarInsert->execute([
                                    $imageId,
                                    $sizeData['size']
                                ]);
                            }
                        }
                    }
                }

                // Xóa mềm các size bị loại bỏ
                $deletedVarIds = array_diff($existingVarIds, $keptVarIds);
                if (!empty($deletedVarIds)) {
                    $placeholders = implode(',', array_fill(0, count($deletedVarIds), '?'));
                    $stmtDelVar = $this->conn->prepare("
                        UPDATE productvariants SET status = 0 WHERE id IN ($placeholders)
                    ");
                    $stmtDelVar->execute(array_values($deletedVarIds));
                }
            }

            $this->conn->commit();
            return "updated";

        }
        catch (Exception $e) {
            $this->conn->rollBack();
            return $e->getMessage();
        }
    }

    /* ===============================
     3. DELETE PRODUCT
     =============================== */
    public function deleteProduct($id)
    {
        try {
            $this->conn->beginTransaction();

            // Kiểm tra xem sản phẩm đã từng được nhập hàng (có lô hàng nào chưa)
            $checkStmt = $this->conn->prepare("
                SELECT COUNT(bd.id) 
                FROM batchdetails bd
                JOIN productvariants pv ON pv.id = bd.variant_id
                JOIN product_images pi ON pi.id = pv.image_id
                WHERE pi.product_id = ?
            ");
            $checkStmt->execute([$id]);
            $importCount = (int)$checkStmt->fetchColumn();

            if ($importCount > 0) {
                // Đã có lịch sử nhập hàng => XÓA MỀM (Ẩn đi)
                $stmt = $this->conn->prepare("UPDATE products SET status = 0 WHERE id = ?");
                $stmt->execute([$id]);
                $this->conn->commit();
                return "hidden";
            } else {
                // Chưa nhập hàng => XÓA CỨNG
                // 1. Lấy danh sách image_id để xóa variant
                $imgStmt = $this->conn->prepare("SELECT id FROM product_images WHERE product_id = ?");
                $imgStmt->execute([$id]);
                $imageIds = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

                if (!empty($imageIds)) {
                    $placeholders = implode(',', array_fill(0, count($imageIds), '?'));
                    $delVariantsStmt = $this->conn->prepare("DELETE FROM productvariants WHERE image_id IN ($placeholders)");
                    $delVariantsStmt->execute($imageIds);
                }

                // 2. Xóa Images
                $delImagesStmt = $this->conn->prepare("DELETE FROM product_images WHERE product_id = ?");
                $delImagesStmt->execute([$id]);

                // 3. Xóa Product
                $delProductStmt = $this->conn->prepare("DELETE FROM products WHERE id = ?");
                $delProductStmt->execute([$id]);

                $this->conn->commit();
                return "deleted";
            }
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return "error";
        }
    }

    /* ===============================
     4. GET LIST + PAGINATION (ĐÃ FIX LỖI ẨN DANH MỤC & LỖI ĐẾM TỔNG)
     =============================== */
    public function getProducts($filters = [])
    {
        // Thêm điều kiện bắt buộc: Sản phẩm phải đang active, loại bỏ điều kiện c.is_active và b.is_active để admin thấy cả sp thuộc danh mục/thương hiệu đã xóa mềm
        $where = [
            "p.status = 1"
        ];
        $params = [];

        if (!empty($filters['brand_id'])) {
            $where[] = "p.brand_id = ?";
            $params[] = $filters['brand_id'];
        }

        if (!empty($filters['category_id'])) {
            $where[] = "p.category_id = ?";
            $params[] = $filters['category_id'];
        }

        if (!empty($filters['keyword'])) {
            $where[] = "p.name LIKE ?";
            $params[] = "%" . $filters['keyword'] . "%";
        }

        // Giá Bán = Giá Vốn Bình Quân * (1 + Tỷ Lệ Lợi Nhuận / 100)
        $minPriceSubQuery = "(
            SELECT MIN(pv.current_import_price * (1 + COALESCE(p.profit_rate, 0) / 100))
            FROM productvariants pv 
            JOIN product_images pin ON pin.id = pv.image_id 
            WHERE pin.product_id = p.id AND pv.status = 1
        )";

        if (!empty($filters['min_price'])) {
            $where[] = "$minPriceSubQuery >= ?";
            $params[] = (float)$filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $where[] = "$minPriceSubQuery <= ?";
            $params[] = (float)$filters['max_price'];
        }

        $whereSql = "WHERE " . implode(" AND ", $where);

        $page = !empty($filters['page']) ? (int)$filters['page'] : 1;
        $limit = !empty($filters['limit']) ? (int)$filters['limit'] : 10;
        $offset = ($page - 1) * $limit;

            $sortSql = "ORDER BY p.id DESC";
            if (!empty($filters['sort']) && $filters['sort'] === 'sold_count') {
                $sortSql = "ORDER BY sold_count DESC, p.id DESC";
            }

            // Truy vấn lấy danh sách sản phẩm
            $sql = "
                SELECT p.id, p.name, p.description, p.profit_rate, p.proposed_price, p.status, p.category_id, p.brand_id,
                       c.name AS category_name,
                       b.name AS brand_name,
                       pi.image_url AS image,
                       COALESCE(
                           (
                               SELECT MIN(pv.current_import_price * (1 + COALESCE(p.profit_rate, 0) / 100))
                               FROM productvariants pv
                               JOIN product_images pin ON pin.id = pv.image_id
                               WHERE pin.product_id = p.id AND pv.status = 1
                           ),
                           0
                       ) AS min_price,
                       (
                           SELECT COALESCE(SUM(od.quantity), 0)
                           FROM orderdetails od
                           JOIN productvariants pv ON pv.id = od.variant_id
                           JOIN product_images pin ON pin.id = pv.image_id
                           JOIN orders o ON o.id = od.order_id
                           WHERE pin.product_id = p.id AND o.status = 'completed'
                       ) AS sold_count
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = 1
                $whereSql
                $sortSql
                LIMIT $limit OFFSET $offset
            ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Truy vấn đếm tổng số lượng
        $countSql = "
            SELECT COUNT(*)
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN brands b ON p.brand_id = b.id
            $whereSql
        ";

        $stmtCount = $this->conn->prepare($countSql);
        $stmtCount->execute($params);
        $total = $stmtCount->fetchColumn();

        return [
            "data" => $data,
            "pagination" => [
                "current_page" => $page,
                "limit" => $limit,
                "total_records" => (int)$total,
                "total_pages" => ceil($total / $limit)
            ]
        ];
    }

    /* ===============================
     5. GET DETAIL
     =============================== */
    public function getProductDetail($id)
    {
        // 1. Lấy thông tin cơ bản của sản phẩm
        $stmt = $this->conn->prepare("
            SELECT p.*, 
                   c.name AS category_name,
                   b.name AS brand_name,
                   COALESCE(
                       (
                           SELECT MIN(pv.current_import_price * (1 + COALESCE(p.profit_rate, 0) / 100))
                           FROM productvariants pv
                           JOIN product_images pin ON pin.id = pv.image_id
                           WHERE pin.product_id = p.id AND pv.status = 1
                       ),
                       0
                   ) AS min_price,
                   (
                       SELECT COALESCE(SUM(od.quantity), 0)
                       FROM orderdetails od
                       JOIN productvariants pv ON pv.id = od.variant_id
                       JOIN product_images pin ON pin.id = pv.image_id
                       JOIN orders o ON o.id = od.order_id
                       WHERE pin.product_id = p.id AND o.status = 'completed'
                   ) AS sold_count,
                   (
                       SELECT COALESCE(SUM(bd.quantity_remaining), 0)
                       FROM batchdetails bd
                       JOIN productvariants pv ON pv.id = bd.variant_id
                       JOIN product_images pin ON pin.id = pv.image_id
                       WHERE pin.product_id = p.id
                   ) AS stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            return null;
        }

        // 2. Lấy nhóm màu (hình ảnh và màu sắc)
        $stmtImg = $this->conn->prepare("
            SELECT DISTINCT pi.id as image_id, pi.image_url, pi.is_main, pi.color 
            FROM product_images pi
            JOIN productvariants pv ON pv.image_id = pi.id
            WHERE pi.product_id = ? AND pv.status = 1
            ORDER BY pi.is_main DESC, pi.id ASC
        ");
        $stmtImg->execute([$id]);
        $colors = $stmtImg->fetchAll(PDO::FETCH_ASSOC);

        // 3. Lấy biến thể (Size) theo từng nhóm màu
        foreach ($colors as &$colorRow) {
            $stmtVar = $this->conn->prepare("
                SELECT pv.id, pv.size, pv.status, pv.current_import_price,
                       (pv.current_import_price * (1 + COALESCE(?, 0) / 100)) AS price,
                       (
                           SELECT COALESCE(SUM(bd.quantity_remaining), 0)
                           FROM batchdetails bd
                           WHERE bd.variant_id = pv.id
                       ) AS stock
                FROM productvariants pv
                WHERE pv.image_id = ? AND pv.status = 1 
                ORDER BY pv.id ASC
            ");
            $stmtVar->execute([$product['profit_rate'], $colorRow['image_id']]);
            $colorRow['sizes'] = $stmtVar->fetchAll(PDO::FETCH_ASSOC);
        }

        // Return structured data
        $product['colors'] = $colors;

        return $product;
    }
}
?>