<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

$sql = "CREATE TABLE IF NOT EXISTS customer_khata_audit_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    customer_id INT DEFAULT NULL,
    installment_no INT NOT NULL,
    installment_payment_id INT DEFAULT NULL,
    expected_amount DECIMAL(12, 2) DEFAULT 0.00,
    khata_amount DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM('matched', 'in_khata_not_app', 'in_app_not_khata', 'amount_mismatch', 'unverified') DEFAULT 'unverified',
    note TEXT NULL,
    audited_by INT DEFAULT NULL,
    audited_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_card_installment (card_id, installment_no),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($mysqli->query($sql)) {
    echo json_encode(["success" => true, "message" => "customer_khata_audit_records table created/verified."]);
} else {
    echo json_encode(["success" => false, "error" => $mysqli->error]);
}

