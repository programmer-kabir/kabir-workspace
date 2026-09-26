<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$system_timezone = date_default_timezone_get();
$system_time = date('Y-m-d H:i:s');

// Set to UTC to get UTC time
date_default_timezone_set('UTC');
$utc_time = date('Y-m-d H:i:s');

// Set to Asia/Dhaka to get BD time
date_default_timezone_set('Asia/Dhaka');
$bd_time = date('Y-m-d H:i:s');

echo json_encode([
    "system_timezone" => $system_timezone,
    "system_time" => $system_time,
    "utc_time" => $utc_time,
    "bd_time" => $bd_time
]);
?>
