<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$sql = "CREATE TABLE IF NOT EXISTS other_asset_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    cash_id INT DEFAULT NULL,
    old_asset_name VARCHAR(255) NOT NULL,
    new_asset_name VARCHAR(255) NOT NULL,
    old_category VARCHAR(100) NOT NULL,
    new_category VARCHAR(100) NOT NULL,
    old_purchase_price DECIMAL(12,2) NOT NULL,
    new_purchase_price DECIMAL(12,2) NOT NULL,
    old_purchase_date DATE NOT NULL,
    new_purchase_date DATE NOT NULL,
    old_vendor_info TEXT DEFAULT NULL,
    new_vendor_info TEXT DEFAULT NULL,
    old_reg_no VARCHAR(255) DEFAULT NULL,
    new_reg_no VARCHAR(255) DEFAULT NULL,
    old_contact_person VARCHAR(255) DEFAULT NULL,
    new_contact_person VARCHAR(255) DEFAULT NULL,
    old_business_type VARCHAR(255) DEFAULT NULL,
    new_business_type VARCHAR(255) DEFAULT NULL,
    old_share_percentage DECIMAL(5,2) DEFAULT NULL,
    new_share_percentage DECIMAL(5,2) DEFAULT NULL,
    old_share_units INT DEFAULT NULL,
    new_share_units INT DEFAULT NULL,
    old_dividend_frequency VARCHAR(50) DEFAULT NULL,
    new_dividend_frequency VARCHAR(50) DEFAULT NULL,
    old_remarks TEXT DEFAULT NULL,
    new_remarks TEXT DEFAULT NULL,
    request_reason TEXT NOT NULL,
    requested_by INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    review_note TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX (asset_id),
    INDEX (cash_id),
    INDEX (status),
    INDEX (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

if ($mysqli->query($sql)) {
    echo json_encode([
        "success" => true,
        "message" => "Table other_asset_edits created or already exists"
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "error" => $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
}
