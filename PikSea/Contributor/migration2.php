<?php
$mysqli = new mysqli("127.0.0.1", "u647959341_dayalusr", "DayalStock122333@", "u647959341_dayaldb", 3306);
if ($mysqli->connect_errno) {
    echo "Failed to connect to MySQL: " . $mysqli->connect_error;
    exit;
}

$sql1 = "ALTER TABLE author_invoices ADD COLUMN rollover_revenue DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER buyout_revenue";
$sql2 = "ALTER TABLE author_invoices MODIFY COLUMN status ENUM('unpaid', 'pending', 'withdrawn', 'rolled_over') DEFAULT 'unpaid'";

if ($mysqli->query($sql1) === TRUE) {
    echo "Added rollover_revenue column successfully.\n";
} else {
    echo "Error adding rollover_revenue column: " . $mysqli->error . "\n";
}

if ($mysqli->query($sql2) === TRUE) {
    echo "Updated status ENUM successfully.\n";
} else {
    echo "Error updating status ENUM: " . $mysqli->error . "\n";
}
