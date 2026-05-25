
-- Didier's Choice migration for an existing DAB inventory database.
-- This keeps existing records and disables old default demo users.

UPDATE users
SET is_active = 0
WHERE email IN ('admin@dab.local','sales@dab.local');

ALTER TABLE products
  ADD COLUMN unit ENUM('kg','g','piece','pack') NOT NULL DEFAULT 'kg',
  ADD COLUMN animal_type VARCHAR(80),
  ADD COLUMN cut_type VARCHAR(100),
  ADD COLUMN storage_type ENUM('fresh','frozen','chilled','dry') NOT NULL DEFAULT 'fresh',
  ADD COLUMN storage_location VARCHAR(120),
  ADD COLUMN batch_number VARCHAR(80),
  ADD COLUMN slaughter_date DATE,
  ADD COLUMN expiry_date DATE,
  ADD COLUMN barcode VARCHAR(80),
  MODIFY COLUMN quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  MODIFY COLUMN reorder_level DECIMAL(12,3) NOT NULL DEFAULT 5;

ALTER TABLE inventory_movements
  MODIFY COLUMN quantity DECIMAL(12,3) NOT NULL;

ALTER TABLE sales
  ADD COLUMN discount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER subtotal,
  ADD COLUMN amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total,
  ADD COLUMN balance_due DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER amount_paid,
  ADD COLUMN payment_status ENUM('paid','partial','unpaid') NOT NULL DEFAULT 'paid' AFTER balance_due,
  MODIFY COLUMN payment_method ENUM('cash','card','mobile','bank_transfer','credit') NOT NULL DEFAULT 'cash';

ALTER TABLE sale_items
  MODIFY COLUMN quantity DECIMAL(12,3) NOT NULL;

CREATE INDEX idx_products_expiry ON products(expiry_date);
CREATE INDEX idx_products_batch ON products(batch_number);

INSERT IGNORE INTO categories (name, description) VALUES
  ('Beef','Fresh and frozen beef cuts'),
  ('Goat','Goat meat cuts and organs'),
  ('Chicken','Whole chicken and chicken pieces'),
  ('Pork','Pork cuts and processed pork'),
  ('Fish','Fresh and frozen fish'),
  ('Processed Meat','Sausages, minced meat, burgers and packed meat'),
  ('Offal and Bones','Liver, kidney, tripe, bones and soup cuts');

INSERT IGNORE INTO suppliers (name, contact, phone, email, address) VALUES
  ('Kigali Livestock Cooperative','Jean ','+250788000001','supply@kigalilivestock.rw',', Kigali'),
  ('Fresh Farm Meats','Alice U.','+250788000002','orders@freshfarm.rw',, Kigali');

INSERT IGNORE INTO products
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
