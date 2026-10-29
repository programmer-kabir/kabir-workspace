<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Dhaka');

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(["success" => false, "message" => "Method not allowed"], 405);
}

$raw = file_get_contents("php://input");
$body = json_decode($raw, true) ?? [];
if (!$body) {
    $body = $_POST;
}

$id      = intval($body['id'] ?? 0);
$userId  = intval($body['user_id'] ?? 0);

// 1. VALIDATION: Cash ID is required
if ($id <= 0) {
    sendJson([
        "success" => false,
        "message" => "ক্যাশ আইডি (Cash ID) প্রদান করা আবশ্যক!"
    ], 400);
}

// 2. VALIDATION: User ID is required
if ($userId <= 0) {
    sendJson([
        "success" => false,
        "message" => "অননুমোদিত অনুরোধ! ইউজার আইডি (user_id) প্রদান করা আবশ্যক।"
    ], 401);
}

// 3. ROLE AUTHORIZATION: Admin or Developer only
$stmtRole = $mysqli->prepare("SELECT role FROM user_roles WHERE user_id = ?");
if (!$stmtRole) {
    sendJson([
        "success" => false,
        "message" => "ডাটাবেজ ত্রুটি: " . $mysqli->error
    ], 500);
}
$stmtRole->bind_param("i", $userId);
$stmtRole->execute();
$resRoles = $stmtRole->get_result();
$roles = [];
while ($r = $resRoles->fetch_assoc()) {
    $roles[] = strtolower(trim((string)$r['role']));
}
$stmtRole->close();

$isDevOrAdmin = in_array('admin', $roles, true) || in_array('developer', $roles, true);
if (!$isDevOrAdmin) {
    sendJson([
        "success" => false,
        "message" => "অননুমোদিত অ্যাকশন! শুধুমাত্র অ্যাডমিন এবং ডেভেলপার ক্যাশ রেকর্ড মুছতে পারেন ❌"
    ], 403);
}

// 4. Check if record exists
$stmtCheck = $mysqli->prepare("SELECT id, type, amount, category, refId, remarks, date FROM cash WHERE id = ? LIMIT 1");
if (!$stmtCheck) {
    sendJson(["success" => false, "message" => "ডাটাবেজ ত্রুটি: " . $mysqli->error], 500);
}
$stmtCheck->bind_param("i", $id);
$stmtCheck->execute();
$cashRow = $stmtCheck->get_result()->fetch_assoc();
$stmtCheck->close();

if (!$cashRow) {
    sendJson([
        "success" => false,
        "message" => "ক্যাশ রেকর্ড পাওয়া যায়নি"
    ], 404);
}

// 5. Delete query
$stmt = $mysqli->prepare("DELETE FROM cash WHERE id = ?");
if (!$stmt) {
    sendJson([
        "success" => false,
        "message" => "ডাটাবেজ ত্রুটি: " . $mysqli->error
    ], 500);
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    sendJson([
        "success" => false,
        "message" => "মুছে ফেলা ব্যর্থ হয়েছে: " . $err
    ], 500);
}
$stmt->close();

sendJson([
    "success" => true,
    "message" => "ক্যাশ রেকর্ড সফলভাবে মুছে ফেলা হয়েছে ✅",
    "deleted_id" => $id,
    "deleted_record" => [
        "id" => $id,
        "type" => $cashRow['type'],
        "amount" => $cashRow['amount'],
        "category" => $cashRow['category'],
        "date" => $cashRow['date']
    ]
], 200);
