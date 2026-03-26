<?php
class Database {
    // Thông tin cấu hình database của bạn
    private $host = "localhost";
    private $db_name = "shopquanao"; // Tên database đã tạo ở bước trước
    private $username = "root";      // Mặc định của XAMPP thường là root
    private $password = "";          // Mặc định của XAMPP thường để trống
    public $conn;

    // Hàm thực hiện kết nối
    public function getConnection() {
        $this->conn = null;
        try {
            // Sử dụng PDO để kết nối
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name, 
                $this->username, 
                $this->password
            );
            // Thiết lập font chữ UTF-8 để không bị lỗi tiếng Việt
            $this->conn->exec("set names utf8");
            
            // Thiết lập chế độ báo lỗi để dễ debug khi code
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
        } catch(PDOException $exception) {
            echo "Lỗi kết nối database: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>