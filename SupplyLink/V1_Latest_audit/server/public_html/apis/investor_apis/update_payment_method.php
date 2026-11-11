<?php
require_once __DIR__ . '/../cors.php';
requireAuth();
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

function fail($msg, $debug = null) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $msg,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = getAuthenticatedUser();
$user_id = intval($_POST['user_id'] ?? ($user['id'] ?? 0));
if (!$user_id) fail("ইউজার আইডি পাওয়া যায়নি (Invalid user ID)");

$review = $_POST['review'] ?? 'pending';

$check = $mysqli->prepare("SELECT id FROM payment_methods WHERE user_id=?");
$check->bind_param("i", $user_id);
$check->execute();
$res = $check->get_result();
$exists = $res->num_rows > 0;
$check->close();

$fields = [];
$params = [];
$types  = "";

if (!empty($_POST['bank_name'])) {
    $fields[] = "bank_name=?";
    $params[] = trim($_POST['bank_name']);
    $types .= "s";
}
if (!empty($_POST['bank_account_name'])) {
    $fields[] = "bank_account_name=?";
    $params[] = trim($_POST['bank_account_name']);
    $types .= "s";
}
if (!empty($_POST['bank_account_number'])) {
    $fields[] = "bank_account_number=?";
    $params[] = trim($_POST['bank_account_number']);
    $types .= "s";
}
if (!empty($_POST['bank_branch'])) {
    $fields[] = "bank_branch=?";
    $params[] = trim($_POST['bank_branch']);
    $types .= "s";
}
if (!empty($_POST['bkash_number'])) {
    $fields[] = "bkash_number=?";
    $params[] = trim($_POST['bkash_number']);
    $types .= "s";
}
if (!empty($_POST['nagad_number'])) {
    $fields[] = "nagad_number=?";
    $params[] = trim($_POST['nagad_number']);
    $types .= "s";
}
if (!empty($_POST['rocket_number'])) {
    $fields[] = "rocket_number=?";
    $params[] = trim($_POST['rocket_number']);
    $types .= "s";
}

$fields[] = "review=?";
$params[] = $review;
$types .= "s";

$fields[] = "updated_date=?";
$params[] = date("Y-m-d");
$types .= "s";

$fields[] = "updated_time=?";
$params[] = date("H:i:s");
$types .= "s";

if ($exists) {
    $sql = "UPDATE payment_methods SET " . implode(", ", $fields) . " WHERE user_id=?";
    $params[] = $user_id;
    $types .= "i";
} else {
    $fields[] = "user_id=?";
    $params[] = $user_id;
    $types .= "i";
    $colNames = array_map(function($f) { return str_replace("=?", "", $f); }, $fields);
    $placeholders = array_fill(0, count($fields), "?");
    $sql = "INSERT INTO payment_methods (" . implode(", ", $colNames) . ") VALUES (" . implode(", ", $placeholders) . ")";
}

$stmt = $mysqli->prepare($sql);
if (!$stmt) fail("Prepare failed", $mysqli->error);
$stmt->bind_param($types, ...$params);

if (!$stmt->execute()) fail("Update failed", $stmt->error);
$stmt->close();

echo json_encode([
    "success" => true,
    "message" => "পেমেন্ট মেথড সফলভাবে আপডেট হয়েছে"
], JSON_UNESCAPED_UNICODE);

