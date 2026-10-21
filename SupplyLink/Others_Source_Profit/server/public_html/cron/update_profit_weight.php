<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Dhaka');

echo "cron script running...<br>";

$mysqli = new mysqli('localhost', 'u647959341_sl_user', '122333$upplyL', 'u647959341_sl_db');

if ($mysqli->connect_errno) {
    die('DB connect error: ' . $mysqli->connect_error);
}

$mysqli->query("SET time_zone = '+06:00'");
$mysqli->set_charset("utf8mb4");

/*
|--------------------------------------------------------------------------
| 1️⃣ Installment weight update
|--------------------------------------------------------------------------
*/
$sql1 = "
UPDATE investment_profit_installments
SET 
    active_days = DATEDIFF(CURDATE(), investment_date),
    time_weighted_value = amount * DATEDIFF(CURDATE(), investment_date)
";

if(!$mysqli->query($sql1)){
    die('Installment update error: '.$mysqli->error);
}

echo "Installment weights updated<br>";

$sql2 = "
UPDATE investment_profit_cards pc
LEFT JOIN (
    SELECT 
        profit_card_id,
        SUM(time_weighted_value) AS total_weight
    FROM investment_profit_installments
    GROUP BY profit_card_id
) t ON pc.id = t.profit_card_id
SET pc.total_time_weighted_value = IFNULL(t.total_weight,0)
";

if(!$mysqli->query($sql2)){
    die('Card total update error: '.$mysqli->error);
}

echo "Card total weights updated<br>";

$mysqli->close();

echo "DONE";
