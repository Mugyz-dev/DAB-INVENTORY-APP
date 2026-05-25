-- Didier's Choice Butcher Management System
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
-- Meat products and cuts
-- ---------------------------------------------------------------------------
CREATE TABLE products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  sku              VARCHAR(50) NOT NULL UNIQUE,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  category_id      INT,
  supplier_id      INT,
  unit             ENUM('kg','g','piece','pack') NOT NULL DEFAULT 'kg',
  animal_type      VARCHAR(80),
  cut_type         VARCHAR(100),
  storage_type     ENUM('fresh','frozen','chilled','dry') NOT NULL DEFAULT 'fresh',
  storage_location VARCHAR(120),
  batch_number     VARCHAR(80),
  slaughter_date   DATE,
  expiry_date      DATE,
  barcode          VARCHAR(80),
  cost_price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price    DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity         DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_level    DECIMAL(12,3) NOT NULL DEFAULT 5,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Inventory movements
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_movements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  movement_type ENUM('IN','OUT','ADJUST') NOT NULL,
  quantity      DECIMAL(12,3) NOT NULL,
  note          VARCHAR(255),
  user_id       INT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------------------
CREATE TABLE sales (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number  VARCHAR(30) NOT NULL UNIQUE,
  user_id         INT NOT NULL,
  customer_name   VARCHAR(150),
  customer_phone  VARCHAR(30),
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax             DECIMAL(12,2) NOT NULL DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid     DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_due     DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status  ENUM('paid','partial','unpaid') NOT NULL DEFAULT 'paid',
  payment_method  ENUM('cash','card','mobile','bank_transfer','credit') NOT NULL DEFAULT 'cash',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Sale items
-- ---------------------------------------------------------------------------
CREATE TABLE sale_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sale_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    DECIMAL(12,3) NOT NULL,
  unit_price  DECIMAL(12,2) NOT NULL,
  line_total  DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_expiry ON products(expiry_date);
CREATE INDEX idx_products_batch ON products(batch_number);
CREATE INDEX idx_sales_created ON sales(created_at);

-- ---------------------------------------------------------------------------
-- Seed data
-- The first account created from the app becomes the administrator.
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, description) VALUES
  ('Beef','Fresh and frozen beef cuts'),
  ('Goat','Goat meat cuts and organs'),
  ('Chicken','Whole chicken and chicken pieces'),
  ('Pork','Pork cuts and processed pork'),
  ('Fish','Fresh and frozen fish'),
  ('Processed Meat','Sausages, minced meat, burgers and packed meat'),
  ('Offal and Bones','Liver, kidney, tripe, bones and soup cuts');

INSERT INTO suppliers (name, contact, phone, email, address) VALUES
  ('Kigali Livestock Cooperative','Jean Bosco','+250788000001','supply@kigalilivestock.rw','Nyabugogo, Kigali'),
  ('Fresh Farm Meats','Alice U.','+250788000002','orders@freshfarm.rw','Kicukiro, Kigali');

INSERT INTO products
  (sku, name, description, category_id, supplier_id, unit, animal_type, cut_type, storage_type,
   storage_location, batch_number, slaughter_date, expiry_date, barcode, cost_price, selling_price,
   quantity, reorder_level)
VALUES
  ('BEEF-RIB-001','Beef Ribs','Fresh beef ribs sold per kilogram',
   (SELECT id FROM categories WHERE name='Beef'), (SELECT id FROM suppliers WHERE name='Kigali Livestock Cooperative'),
   'kg','Beef','Ribs','chilled','Cold Room A','BEEF-20260525-A','2026-05-25','2026-05-30','DC-BEEF-RIB-001',5200,7000,45.500,8.000),
  ('BEEF-MIN-001','Minced Beef','Fresh minced beef prepared daily',
   (SELECT id FROM categories WHERE name='Processed Meat'), (SELECT id FROM suppliers WHERE name='Kigali Livestock Cooperative'),
   'kg','Beef','Minced','fresh','Display Fridge','BEEF-20260525-M','2026-05-25','2026-05-27','DC-BEEF-MIN-001',4800,6500,18.250,5.000),
  ('GOAT-LEG-001','Goat Leg','Goat leg cuts sold by weight',
   (SELECT id FROM categories WHERE name='Goat'), (SELECT id FROM suppliers WHERE name='Kigali Livestock Cooperative'),
   'kg','Goat','Leg','chilled','Cold Room B','GOAT-20260525-A','2026-05-25','2026-05-30','DC-GOAT-LEG-001',5000,6800,26.750,6.000),
  ('CHK-WHOLE-001','Whole Chicken','Whole broiler chicken sold per piece',
   (SELECT id FROM categories WHERE name='Chicken'), (SELECT id FROM suppliers WHERE name='Fresh Farm Meats'),
   'piece','Chicken','Whole','fresh','Display Fridge','CHK-20260525-A','2026-05-25','2026-05-28','DC-CHK-WHOLE-001',4200,5500,35.000,10.000),
  ('PORK-CHOP-001','Pork Chops','Fresh pork chops sold per kilogram',
   (SELECT id FROM categories WHERE name='Pork'), (SELECT id FROM suppliers WHERE name='Fresh Farm Meats'),
   'kg','Pork','Chops','chilled','Cold Room A','PORK-20260525-A','2026-05-25','2026-05-30','DC-PORK-CHOP-001',4300,6200,22.000,5.000),
  ('FISH-TIL-001','Tilapia','Fresh tilapia sold per kilogram',
   (SELECT id FROM categories WHERE name='Fish'), (SELECT id FROM suppliers WHERE name='Fresh Farm Meats'),
   'kg','Fish','Whole fish','fresh','Ice Display','FISH-20260525-A','2026-05-25','2026-05-27','DC-FISH-TIL-001',3000,4500,30.000,6.000),
  ('OFF-LIV-001','Beef Liver','Fresh beef liver sold per kilogram',
   (SELECT id FROM categories WHERE name='Offal and Bones'), (SELECT id FROM suppliers WHERE name='Kigali Livestock Cooperative'),
   'kg','Beef','Liver','fresh','Display Fridge','OFF-20260525-A','2026-05-25','2026-05-27','DC-OFF-LIV-001',2500,4000,12.500,3.000);
