<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

echo "=== Investment Installments Update Started ===<br>";

// ======================
// Database Connection
// ======================
$mysqli = new mysqli(
    'localhost',
    'u647959341_sl_user',
    '122333$upplyL',
    'u647959341_sl_db'
);

if ($mysqli->connect_errno) {
    die("Database Connection Failed: " . $mysqli->connect_error);
}

$mysqli->query("SET time_zone = '+06:00'");
$mysqli->set_charset("utf8mb4");

// ======================
// Update Active Days & Time Weighted Value
// ======================
$sql = "
UPDATE investment_installments
SET
    active_days = GREATEST(DATEDIFF(CURDATE(), investment_date), 0),
    time_wighted_value = amount * GREATEST(DATEDIFF(CURDATE(), investment_date), 0)
WHERE investment_date <= CURDATE();
";

if (!$mysqli->query($sql)) {
    die("Update Failed: " . $mysqli->error);
}

echo "Updated Rows: " . $mysqli->affected_rows . "<br>";
echo "Update Completed Successfully.";

$mysqli->close();
?>