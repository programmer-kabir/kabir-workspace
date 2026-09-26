<?php
require_once __DIR__ . '/../config/db.php';

$query = "SELECT COUNT(*) as cnt FROM payment_transactions";
$result = $mysqli->query($query);
$row = $result->fetch_assoc();

echo "Rows in payment_transactions: " . $row['cnt'] . "\n";

$query2 = "SELECT * FROM payment_transactions LIMIT 2";
$result2 = $mysqli->query($query2);
while ($r = $result2->fetch_assoc()) {
    print_r($r);
}
?>
