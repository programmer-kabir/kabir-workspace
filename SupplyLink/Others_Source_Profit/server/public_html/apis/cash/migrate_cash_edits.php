<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$sql = "CREATE TABLE IF NOT EXISTS cash_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cash_id INT NOT NULL,
    type ENUM('in', 'out') NOT NULL,
    old_amount DECIMAL(12,2) NOT NULL,
    new_amount DECIMAL(12,2) NOT NULL,
    old_date DATE NOT NULL,
    new_date DATE NOT NULL,
    old_category VARCHAR(100) DEFAULT NULL,
    new_category VARCHAR(100) DEFAULT NULL,
    old_source VARCHAR(255) DEFAULT NULL,
    new_source VARCHAR(255) DEFAULT NULL,
    old_purpose VARCHAR(255) DEFAULT NULL,
    new_purpose VARCHAR(255) DEFAULT NULL,
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
    INDEX (cash_id),
    INDEX (type),
    INDEX (status),
    INDEX (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

if ($mysqli->query($sql)) {
    echo json_encode([
        "success" => true,
        "message" => "Table cash_edits created or already exists"
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "error" => $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
}
