<?php


ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../cors.php';
session_start(); // 🔴
require_once __DIR__ . '/../db.php';
// JSON ইনপুট নেই

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if ($input === null) {
    echo json_encode([
        'success' => false,
        'valid'   => false,
        'message' => 'Invalid JSON',
    ]);
    exit;
}

$id       = isset($input['id']) ? trim((string)$input['id']) : null;
$password = isset($input['password']) ? (string)$input['password'] : null;

if (!$id || !$password) {
    echo json_encode([
        'success' => false,
        'valid'   => false,
        'message' => 'ID/মোবাইল এবং পাসওয়ার্ড প্রদান করুন'
    ]);
    exit;
}

// DB: Find user by id, mobile or id_number
$sql  = "SELECT id, name, mobile, password FROM users WHERE id = ? OR mobile = ? OR id_number = ? LIMIT 1";
$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'valid'   => false,
        'message' => 'Prepare failed',
        'error'   => $mysqli->error,
    ]);
    exit;
}

$stmt->bind_param("sss", $id, $id, $id);

if (!$stmt->execute()) {
    echo json_encode([
        'success' => false,
        'valid'   => false,
        'message' => 'Execute failed',
        'error'   => $stmt->error,
    ]);
    exit;
}

$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode([
        'success' => true,
        'valid'   => false,
        'message' => 'User পাওয়া যায়নি',
    ]);
    $stmt->close();
    exit;
}

$stmt->bind_result($db_id, $name, $mobile, $db_password);
$stmt->fetch();
$stmt->close();

// Password check
if ($password !== $db_password) {
    echo json_encode([
        'success' => true,
        'valid'   => false,
        'message' => 'Password ভুল',
    ]);
    exit;
}

// Session
$_SESSION['investor_id']   = $db_id;
$_SESSION['investor_name'] = $name;

echo json_encode([
    'success' => true,
    'valid'   => true,
    'message' => 'Login successful',
    'user' => [
        'id'     => (int)$db_id,
        'name'   => $name,
        'mobile' => $mobile,
    ]
]);
