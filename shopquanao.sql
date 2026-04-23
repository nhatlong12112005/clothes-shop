-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: shopquanao
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `batchdetails`
--

DROP TABLE IF EXISTS `batchdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `batchdetails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `import_receipt_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `import_price` decimal(15,2) NOT NULL,
  `quantity_imported` int(11) NOT NULL,
  `quantity_remaining` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `import_receipt_id` (`import_receipt_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `batchdetails_ibfk_1` FOREIGN KEY (`import_receipt_id`) REFERENCES `importreceipts` (`id`),
  CONSTRAINT `batchdetails_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batchdetails`
--

LOCK TABLES `batchdetails` WRITE;
/*!40000 ALTER TABLE `batchdetails` DISABLE KEYS */;
INSERT INTO `batchdetails` VALUES (1,1,1,200000.00,50,48,'2026-03-27 08:22:38'),(2,1,2,200000.00,50,49,'2026-03-27 08:22:38'),(3,1,3,300000.00,50,50,'2026-03-27 08:22:38'),(4,1,4,300000.00,50,47,'2026-03-27 08:22:38');
/*!40000 ALTER TABLE `batchdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Chanel',1),(2,'Adidas',1);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cart_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cart_items_cart` (`cart_id`),
  KEY `fk_cart_items_variant` (`variant_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_cart` (`user_id`),
  CONSTRAINT `fk_carts_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,1,'2026-03-27 16:08:33','2026-03-27 16:08:33'),(2,2,'2026-04-09 10:41:34','2026-04-09 10:41:34');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Áo Thun',1),(2,'Quần Jeans',1);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `importreceipts`
--

DROP TABLE IF EXISTS `importreceipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `importreceipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) DEFAULT NULL,
  `import_date` datetime DEFAULT current_timestamp(),
  `total_amount` decimal(15,2) DEFAULT NULL,
  `status` enum('draft','completed') NOT NULL DEFAULT 'completed',
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `importreceipts_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `importreceipts`
--

LOCK TABLES `importreceipts` WRITE;
/*!40000 ALTER TABLE `importreceipts` DISABLE KEYS */;
INSERT INTO `importreceipts` VALUES (1,1,'2026-03-27 15:22:38',10000000.00,'completed');
/*!40000 ALTER TABLE `importreceipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `variant_id` int(11) NOT NULL,
  `change_qty` int(11) NOT NULL,
  `type` enum('import','export','adjustment') NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
INSERT INTO `inventory_logs` VALUES (1,1,50,'import',1,'2026-03-27 08:22:38'),(2,2,50,'import',1,'2026-03-27 08:22:38'),(3,3,50,'import',1,'2026-03-27 08:22:38'),(4,4,50,'import',1,'2026-03-27 08:22:38'),(5,1,-2,'export',1,'2026-03-27 09:12:49'),(6,4,-2,'export',2,'2026-04-09 04:05:23'),(7,2,-1,'export',3,'2026-04-09 05:31:45'),(8,4,-1,'export',3,'2026-04-09 05:31:45');
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderdetails`
--

DROP TABLE IF EXISTS `orderdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orderdetails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `price_at_purchase` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `variant_id` (`variant_id`),
  KEY `batch_id` (`batch_id`),
  CONSTRAINT `orderdetails_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `orderdetails_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`id`),
  CONSTRAINT `orderdetails_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `batchdetails` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderdetails`
--

LOCK TABLES `orderdetails` WRITE;
/*!40000 ALTER TABLE `orderdetails` DISABLE KEYS */;
INSERT INTO `orderdetails` VALUES (1,1,1,1,2,240000.00),(2,2,4,4,2,375000.00),(3,3,2,2,1,240000.00),(4,3,4,4,1,375000.00);
/*!40000 ALTER TABLE `orderdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `order_date` datetime DEFAULT current_timestamp(),
  `total_price` decimal(15,2) DEFAULT NULL,
  `status` enum('pending','processing','shipped','completed','cancelled') DEFAULT 'pending',
  `shipping_name` varchar(255) DEFAULT NULL,
  `shipping_phone` varchar(20) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `payment_method` enum('cash','transfer','online') DEFAULT NULL,
  `shipping_ward` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'2026-03-27 16:12:49',480000.00,'completed','admin','0123456789','Hồ Chí Minh','cash',''),(2,2,'2026-04-09 11:05:23',750000.00,'completed','user','0987654321','Quận 5, Hồ Chí Minh','cash',''),(3,2,'2026-04-09 12:31:45',615000.00,'pending','user','0987654321','Quận 5, Hồ Chí Minh','cash','');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `is_main` tinyint(1) DEFAULT 0,
  `color` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,1,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',1,'trắng'),(2,2,'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',1,'đen');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `profit_rate` decimal(5,2) DEFAULT 0.20,
  `proposed_price` decimal(10,0) NOT NULL DEFAULT current_timestamp(),
  `status` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `brand_id` (`brand_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,'Áo Thun Chanel Classic','Áo thun chính hãng chất liệu cotton cao cấp.',20.00,500000,1),(2,2,2,'Quần Jeans Adidas Slimfit','Quần jeans form ôm dáng thể thao cực đẹp.',25.00,600000,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productvariants`
--

DROP TABLE IF EXISTS `productvariants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productvariants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `size` varchar(10) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `image_id` int(11) DEFAULT NULL,
  `current_import_price` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `fk_variant_image` (`image_id`),
  CONSTRAINT `fk_variant_image` FOREIGN KEY (`image_id`) REFERENCES `product_images` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productvariants`
--

LOCK TABLES `productvariants` WRITE;
/*!40000 ALTER TABLE `productvariants` DISABLE KEYS */;
INSERT INTO `productvariants` VALUES (1,'M',1,1,200000.00),(2,'L',1,1,200000.00),(3,'30',1,2,300000.00),(4,'32',1,2,300000.00);
/*!40000 ALTER TABLE `productvariants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt_items`
--

DROP TABLE IF EXISTS `receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `receipt_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `import_price` decimal(15,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `receipt_id` (`receipt_id`),
  CONSTRAINT `receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `importreceipts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_items`
--

LOCK TABLES `receipt_items` WRITE;
/*!40000 ALTER TABLE `receipt_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipt_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_active` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'Nhà Cung Cấp VCL','098111222','Hà Nội',1);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `role` enum('admin','customer') DEFAULT 'customer',
  `is_active` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2y$10$tGobE6yO6zzzE/7dJiTWB.IIoWglqGICRzawbzizdzbxCXXeqt7Dq','admin@gmail.com','0123456789','Hồ Chí Minh','admin',1),(2,'user','$2y$10$yICBHTg6lSEwvFgutk6MZO0QSHogJYiTphFSjLyvXgOzJGm5UomqO','user@gmail.com','0987654321','Quận 5, Hồ Chí Minh','',1),(3,'admin2','$2y$10$.hOrlaX3srdtzoYm8aQJhefEVF8seTWEsPAZdmu6YzhDdFs2wE1b.','admin2@gmail.com','0987654321','123,abc','admin',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-10 10:34:23
