<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

echo json_encode([
    "server_timezone" => date_default_timezone_get(),
    "server_local_time" => date('Y-m-d H:i:s'),
    "utc_time" => gmdate('Y-m-d H:i:s')
]);
?>
