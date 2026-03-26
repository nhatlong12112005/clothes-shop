<?php 
    class BrandModel {
        private $conn;
        private $table = "brands";

        public function __construct($db){
            $this->conn = $db;
        }
        
       public function createBrand($name)
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
    $sql = "INSERT INTO {$this->table} (name, is_active) VALUES (?, 1)";
    $stmt = $this->conn->prepare($sql);
    $stmt->execute([$name]);

    return "created";
}
        // lấy 1 brand
        public function findByBrandId($id){
            $query = "SELECT id, name, is_active from {$this->table} WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        // tìm theo name 
        public function findByName($name){
            $query = "SELECT * from {$this->table} WHERE name = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$name]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        // update brand
        public function updateBrand($id, $data){
            $sql = "UPDATE brands SET name = ?, is_active = ? WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute([
                $data['name'],
                $data['is_active'],
                $id
            ]);
        }

        // xóa mềm brand
       public function Delete($id){
        $sql = "UPDATE brands SET is_active = 0 WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id]);
       }
    //    khối phục brand
        public function restore($id){
            $sql = "UPDATE brands SET is_active = 1 WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute([$id]);
        }
        // lấy tất cả danh mục đang hoạt động

  public function getBrands($keyword = "", $page = 1, $limit = 10)
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

    $sql = "SELECT id, name, is_active 
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