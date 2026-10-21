<?php
// db.php - DB connection (edit credentials)
define('DEBUG', true); // ডেবাগিং: লোকাল/টেস্ট এ true রাখো। প্রোডাকশনে false করে দিবো.
date_default_timezone_set('Asia/Dhaka');

$DB_HOST = "localhost";       
$DB_USER = 'u647959341_sl_user';
$DB_PASS = '122333$upplyL';
$DB_NAME = 'u647959341_sl_db';

$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
$mysqli->query("SET time_zone = '+06:00'");
if ($mysqli->connect_errno) {
    if (DEBUG) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success'=>false, 'error'=>"DB connect failed: ({$mysqli->connect_errno}) {$mysqli->connect_error}"]);
    }
    exit;
}

$mysqli->set_charset("utf8mb4");

if (DEBUG) {
    // show nothing by default, only used by tests
}
