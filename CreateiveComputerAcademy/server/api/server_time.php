<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

date_default_timezone_set('Asia/Dhaka');

echo json_encode([
    "status" => "success",
    "server_time" => date('Y-m-d H:i:s'),
    "timestamp_ms" => round(microtime(true) * 1000)
]);
?>
