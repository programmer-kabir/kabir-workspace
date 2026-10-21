<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

// ===== Helpers =====
function fail($msg, $debug = null) {
    echo json_encode([
        "success" => false,
        "message" => $msg,
        "debug" => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = intval($_POST['user_id'] ?? 0);
if (!$user_id) fail("Invalid user");
$review = $_POST['review'] ?? 'pending';

// ===== Check existing row =====
$check = $mysqli->prepare("SELECT id FROM payment_methods WHERE user_id=?");
$check->bind_param("i", $user_id);
$check->execute();
$res = $check->get_result();
$exists = $res->num_rows > 0;


// ===== Dynamic fields =====
$fields = [];
$params = [];
$types  = "";

// ---- BANK ----
if (!empty($_POST['bank_name'])) {
    $fields[] = "bank_name=?";
    $params[] = $_POST['bank_name'];
    $types .= "s";
}

if (!empty($_POST['bank_account_name'])) {
    $fields[] = "bank_account_name=?";
    $params[] = $_POST['bank_account_name'];
    $types .= "s";
}

if (!empty($_POST['bank_account_number'])) {
    $fields[] = "bank_account_number=?";
    $params[] = $_POST['bank_account_number'];
    $types .= "s";
}

if (!empty($_POST['bank_branch'])) {
    $fields[] = "bank_branch=?";
    $params[] = $_POST['bank_branch'];
    $types .= "s";
}

// ---- IMAGE ----
if (!empty($_FILES['bank_statement_image']['name'])) {
       $accountName = $_POST['bank_account_name'] ?? 'account';
    $accountName = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($accountName));
    
    $ext = pathinfo($_FILES['bank_statement_image']['name'], PATHINFO_EXTENSION);
    $filename = "{$accountName}_{$user_id}." . $ext;
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . "/uploads/";
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    move_uploaded_file(
        $_FILES['bank_statement_image']['tmp_name'],
        $uploadDir . $filename
    );

    $fields[] = "bank_statement_image=?";
    $params[] = "uploads/" . $filename;
    $types .= "s";
}

// ---- MOBILE WALLET ----
if (isset($_POST['bkash_number']) && $_POST['bkash_number'] !== "") {
    $fields[] = "bkash_number=?";
    $params[] = $_POST['bkash_number'];
    $types .= "s";
}

if (isset($_POST['nagad_number']) && $_POST['nagad_number'] !== "") {
    $fields[] = "nagad_number=?";
    $params[] = $_POST['nagad_number'];
    $types .= "s";
}

if (isset($_POST['rocket_number']) && $_POST['rocket_number'] !== "") {
    $fields[] = "rocket_number=?";
    $params[] = $_POST['rocket_number'];
    $types .= "s";
}

if (!empty($review)) {
    $fields[] = "review=?";
    $params[] = $review;
    $types .= "s";
}
// ===== Always update date/time =====
$fields[] = "updated_date=CURDATE()";
$fields[] = "updated_time=CURTIME()";


// ===== INSERT or UPDATE =====
if (!$exists) {
    $sql = "INSERT INTO payment_methods (user_id) VALUES (?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
}

if (!empty($fields)) {
    $sql = "UPDATE payment_methods SET " . implode(", ", $fields) . " WHERE user_id=?";
    $params[] = $user_id;
    $types .= "i";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
}

echo json_encode([
    "success" => true,
    "message" => "Payment method updated successfully"
], JSON_UNESCAPED_UNICODE);
