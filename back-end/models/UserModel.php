<?php 
class UserModel {
    private $conn;
    private $table = "users";

    public function __construct($db){
        $this->conn = $db;
    }

    // ĐĂNG KÝ
    public function register($username, $password, $email, $phone, $address){
        $query = "INSERT INTO " . $this->table . " 
                  SET username=:username,
                      password=:password,
                      email=:email,
                      phone=:phone,
                      address=:address,
                      role='customer'";

        $stmt = $this->conn->prepare($query);

        // mã hóa mật khẩu
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":password", $passwordHash); 
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":address", $address);

        return $stmt->execute();
    }

    // ĐĂNG NHẬP (lấy user theo email)
    public function login($email){
        $query = "SELECT * FROM " . $this->table . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }


    public function getAll($keyword, $is_active, $limit, $offset) {
        $where = "WHERE 1=1";
        if (!empty($keyword)){
            $where .= " AND (username LIKE :keyword OR email LIKE :keyword)";
        }
        if ($is_active !== ''){
            $where .= " AND is_active = :is_active";
        }

        $query = "SELECT id, username, email, phone, address, role, is_active
        from {$this->table} $where ORDER BY id DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->conn->prepare($query);
        if (!empty($keyword)) {
        $kw = "%$keyword%";
        $stmt->bindParam(":keyword", $kw);
    }

    if ($is_active !== '') {
        $stmt->bindParam(":is_active", $is_active, PDO::PARAM_INT);
    }

    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function countUsers($keyword, $is_active) {
    $where = "WHERE 1=1";

    if (!empty($keyword)) {
        $where .= " AND (username LIKE :keyword OR email LIKE :keyword)";
    }

    if ($is_active !== '') {
        $where .= " AND is_active = :is_active";
    }

    $query = "SELECT COUNT(*) as total FROM {$this->table} $where";
    $stmt = $this->conn->prepare($query);

    if (!empty($keyword)) {
        $kw = "%$keyword%";
        $stmt->bindParam(":keyword", $kw);
    }

    if ($is_active !== '') {
        $stmt->bindParam(":is_active", $is_active, PDO::PARAM_INT);
    }

    $stmt->execute();
    return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
}

    // lấy 1 user
    public function findByid($id){
        $query = "SELECT id, username, email, phone, address, role, is_active
         from {$this->table} WHERE id = :id
         ";
         $stmt = $this->conn->prepare($query);
         $stmt->bindParam(":id", $id);
         $stmt->execute();
         return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /*KHÓA / MỞ USER  */
public function setActive($id, $status) {
    $query = "UPDATE {$this->table}
              SET is_active = :status
              WHERE id = :id";

    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":status", $status, PDO::PARAM_INT);
    $stmt->bindParam(":id", $id, PDO::PARAM_INT);

    return $stmt->execute();
}

   /*UPDATE USER (CÓ ACTIVE)*/
public function updateUser($id, $data) {
    $sql = "UPDATE users 
            SET username = ?, email = ?, phone = ?, address = ?, role = ?, is_active = ?
            WHERE id = ?";

    $stmt = $this->conn->prepare($sql);
    return $stmt->execute([
        $data['username'],
        $data['email'],
        $data['phone'],
        $data['address'],
        $data['role'],
        $data['is_active'],
        $id
    ]);
}

}
?>
