<?php
require_once __DIR__ . '/backend/api_v1 (1)/config/db.php';

$sql1 = "
CREATE TABLE IF NOT EXISTS author_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(255) NOT NULL UNIQUE,
    author_id INT NOT NULL,
    earning_month VARCHAR(10) NOT NULL,
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    sub_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    buyout_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_downloads INT NOT NULL DEFAULT 0,
    status ENUM('unpaid', 'pending', 'withdrawn') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (author_id)
);
";

$sql2 = "
ALTER TABLE withdraw_requests ADD COLUMN invoice_id VARCHAR(255) DEFAULT NULL;
";

if ($mysqli->query($sql1) === TRUE) {
    echo "Table author_invoices created successfully.\n";
} else {
    echo "Error creating table: " . $mysqli->error . "\n";
}

if ($mysqli->query($sql2) === TRUE) {
    echo "Column invoice_id added to withdraw_requests successfully.\n";
} else {
    echo "Error adding column: " . $mysqli->error . "\n";
}
?>
