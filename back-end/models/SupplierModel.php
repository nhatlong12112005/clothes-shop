<?php 
    class SupplierModel{
        private $conn;
        private $table = "suppliers";

        public function __construct($db)
        {
           $this->conn = $db;
        }

        public function createSupplier($name,$phone,$address)
{
    // Chuẩn hóa name (tránh trùng do khoảng trắng)
    $name = trim($name);

    // Kiểm tra tồn tại theo name
    $existing = $this->findByName($name);

    if ($existing) {
        // Nếu đã tồn tại và đang active → báo trùng
        if ($existing['is_active'] == 1) {
            return "exists";
        }

        // Nếu tồn tại nhưng đã bị xóa → restore
        $sql = "UPDATE {$this->table} SET is_active = 1 WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$existing['id']]);

        return "restored";
    }

    // Nếu chưa tồn tại → thêm mới
    $sql = "INSERT INTO {$this->table} (name, phone, address, is_active) VALUES (?, ?, ?, 1)";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute([$name,$phone,$address]);

    return "created";
}
          public function findByName($name){
            $query = "SELECT * from {$this->table} WHERE name = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$name]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }


         public function findBySupplierId($id){
            $query = "SELECT * from {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        public function updateSupplier($id, $data){
            $sql = "UPDATE {$this->table} SET name = ?, phone = ?, address = ?, is_active = ? WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute([
                $data['name'],
                $data['phone'],
                $data['address'],
                $data['is_active'],
                $id
            ]);
        }
        public function Delete($id){
        $sql = "UPDATE {$this->table} SET is_active = 0 WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id]);
       }
    //    khối phục brand
        public function restore($id){
            $sql = "UPDATE {$this->table} SET is_active = 1 WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute([$id]);
        }
        // lấy tất cả danh mục đang hoạt động

  public function getSupplier($keyword = "", $page = 1, $limit = 10)
{
    $page = (int)$page;
    $limit = (int)$limit;
    $offset = ($page - 1) * $limit;

    $where = "WHERE is_active = 1";
    $params = [];

    if (!empty($keyword)) {
        $where .= " AND name LIKE ?";
        $params[] = "%$keyword%";
    }

    $sql = "SELECT * 
            FROM {$this->table}
            $where
            ORDER BY id DESC LIMIT $limit OFFSET $offset";

    $stmt = $this->conn->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countSql = "SELECT COUNT(*) FROM {$this->table} $where";
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


    }







?>