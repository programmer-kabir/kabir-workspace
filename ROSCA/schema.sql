-- ROSCA Committee Management Database Schema & Seed Data (Halal / Shariah Compliant - No Penalties/Late Fees)
-- 1. Members Table
DROP TABLE IF EXISTS daily_collections;
DROP TABLE IF EXISTS monthly_payouts;
DROP TABLE IF EXISTS members;

CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  nid_number VARCHAR(30) NULL,
  nominee_name VARCHAR(100) NULL,
  nominee_phone VARCHAR(20) NULL,
  avatar VARCHAR(255) NULL,
  is_payout_taken TINYINT(1) DEFAULT 0,
  payout_month VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Daily Collections Table (Halal: Paid or Due status only, No Penalties)
CREATE TABLE daily_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  collection_date DATE NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 1000.00,
  status ENUM('paid', 'due') DEFAULT 'paid',
  collected_by INT NOT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by) REFERENCES members(id),
  UNIQUE KEY unique_daily_entry (member_id, collection_date)
);

-- 3. Monthly Payouts Table
CREATE TABLE monthly_payouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  month_cycle INT NOT NULL UNIQUE,
  month_name VARCHAR(30) NOT NULL,
  recipient_member_id INT NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 300000.00,
  distribution_date DATE NOT NULL,
  selection_type ENUM('selection', 'lottery') DEFAULT 'lottery',
  receipt_doc_url VARCHAR(255) NULL,
  FOREIGN KEY (recipient_member_id) REFERENCES members(id)
);

-- Seed Data: 10 Members (Default Password: 123456)
-- Hash: $2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6
INSERT INTO members (id, name, phone, password_hash, role, nid_number, nominee_name, nominee_phone, is_payout_taken, payout_month) VALUES
(1, 'Shahriar Rubel', '01700000001', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'admin', '1990123456701', 'Tania Sultana', '01711000001', 1, 'September 2026'),
(2, 'Shukur Ali', '01700000002', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456702', 'Rashida Begum', '01711000002', 0, NULL),
(3, 'Ariyan', '01700000003', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456703', 'Kabir Hossain', '01711000003', 0, NULL),
(4, 'Zayan', '01700000004', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456704', 'Nasima Akter', '01711000004', 0, NULL),
(5, 'Aiyan', '01700000005', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456705', 'Rafiqul Islam', '01711000005', 0, NULL),
(6, 'Rayan', '01700000006', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456706', 'Salma Khatun', '01711000006', 0, NULL),
(7, 'Fahad', '01700000007', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456707', 'Monir Hossain', '01711000007', 0, NULL),
(8, 'Imran', '01700000008', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456708', 'Farida Yasmin', '01711000008', 0, NULL),
(9, 'Samin', '01700000009', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456709', 'Abul Kashem', '01711000009', 0, NULL),
(10, 'Nafis', '01700000010', '$2y$10$VJPG2eAkgiZ.nhk9oYOQA.TK7yeU4ukqGSLCeUvK/oiktiOPL4FM6', 'member', '1990123456710', 'Rokeya Begum', '01711000010', 0, NULL);

-- Seed Month 1 Payout (Pre-assigned to Shahriar Rubel, Member ID 1)
INSERT INTO monthly_payouts (month_cycle, month_name, recipient_member_id, amount_paid, distribution_date, selection_type) VALUES
(1, 'September 2026', 1, 300000.00, '2026-09-30', 'selection');
