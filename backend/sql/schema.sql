-- DAB Enterprise Ltd — Inventory & Sales Management System
-- MySQL 8 schema + seed data

DROP DATABASE IF EXISTS dab_inventory;
CREATE DATABASE dab_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dab_inventory;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','sales') NOT NULL DEFAULT 'sales',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE suppliers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL UNIQUE,
  contact    VARCHAR(100),
  phone      VARCHAR(30),
  email      VARCHAR(150),
  address    VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  sku           VARCHAR(50) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  category_id   INT,
  supplier_id   INT,
  cost_price    DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity      INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Inventory movements (stock in / out adjustments)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_movements (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  movement_type ENUM('IN','OUT','ADJUST') NOT NULL,
  quantity     INT NOT NULL,
  note         VARCHAR(255),
  user_id      INT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Sales (invoice header)
-- ---------------------------------------------------------------------------
CREATE TABLE sales (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  user_id        INT NOT NULL,
  customer_name  VARCHAR(150),
  customer_phone VARCHAR(30),
  subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax            DECIMAL(12,2) NOT NULL DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cash','card','mobile') NOT NULL DEFAULT 'cash',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Sale items (invoice lines)
-- ---------------------------------------------------------------------------
CREATE TABLE sale_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sale_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(12,2) NOT NULL,
  line_total  DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_sales_created ON sales(created_at);

-- ---------------------------------------------------------------------------
-- Seed data
-- Default admin password = Admin@123 (bcrypt hash, 10 rounds)
-- ---------------------------------------------------------------------------
-- Passwords: admin = Admin@123 ; sales = Sales@123
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('System Administrator','admin@dab.local','$2a$10$9fCTGzQltvL0c3odL04B0u9odZ/pDEbPXtTQNusrH8ym10NGfmAZC','admin'),
  ('Sales Officer','sales@dab.local','$2a$10$lNz99pNPWs9xCrSotsLJuuofZ2j/0xm0sTfysE9zPoNABydXZLMHG','sales');

INSERT INTO categories (name, description) VALUES
  ('Laptops','Portable computers'),
  ('Smartphones','Mobile phones'),
  ('Printers','Printing devices'),
  ('Networking','Routers, switches, cables'),
  ('Accessories','Cables, chargers, peripherals');

INSERT INTO suppliers (name, contact, phone, email, address) VALUES
  ('TechWorld Distributors','Jean Bosco','+250788000001','sales@techworld.rw','KG 11 Ave, Kigali'),
  ('NetGear Africa','Alice U.','+250788000002','info@netgear.africa','KN 3 Rd, Kigali');

INSERT INTO products (sku, name, description, category_id, supplier_id, cost_price, selling_price, quantity, reorder_level) VALUES
  ('LAP-001','HP EliteBook 840','14" i7 16GB 512GB SSD',1,1,750000,950000,12,3),
  ('PHN-001','Samsung Galaxy A55','6.6" 128GB',2,1,280000,360000,25,5),
  ('PRN-001','HP LaserJet M111w','Wireless mono laser printer',3,1,180000,235000,8,2),
  ('NET-001','TP-Link Archer C6','AC1200 dual-band router',4,2,38000,55000,30,5),
  ('ACC-001','Anker USB-C 65W Charger','GaN fast charger',5,2,18000,29000,50,10);
