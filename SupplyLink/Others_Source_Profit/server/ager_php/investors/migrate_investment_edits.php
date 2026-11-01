<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$sql = "CREATE TABLE IF NOT EXISTS investment_installment_edits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    installment_id INT NOT NULL,
    card_id INT NOT NULL,
    investor_id INT NOT NULL,
    old_amount DECIMAL(10,2) NOT NULL,
    new_amount DECIMAL(10,2) NOT NULL,
    old_date DATE NOT NULL,
    new_date DATE NOT NULL,
    request_reason TEXT NOT NULL,
    requested_by INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX (installment_id),
    INDEX (card_id),
    INDEX (status),
    INDEX (requested_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

if ($mysqli->query($sql)) {
    echo json_encode([
        "success" => true,
        "message" => "Table investment_installment_edits created or already exists"
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "error" => $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
}
