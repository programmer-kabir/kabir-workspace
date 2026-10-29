<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true) ?? [];

$id     = (int)($data['id'] ?? 0);
$userId = (int)($data['user_id'] ?? 0); // Performer / requester

// 1. VALIDATION: ID is required
if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "কিস্তি আইডি (Installment ID) প্রদান করা আবশ্যক!"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. VALIDATION: User ID is required
if ($userId <= 0) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "অননুমোদিত অনুরোধ! ইউজার আইডি (User ID) প্রদান করা আবশ্যক।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 3. ROLE AUTHORIZATION: Admin or Developer only
$stmtUser = $mysqli->prepare("SELECT role FROM user_roles WHERE user_id = ?");
if (!$stmtUser) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "ডাটাবেজ ত্রুটি: " . $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmtUser->bind_param("i", $userId);
$stmtUser->execute();
$resRoles = $stmtUser->get_result();
$roles = [];
while ($r = $resRoles->fetch_assoc()) {
    $roles[] = strtolower(trim((string)$r['role']));
}
$stmtUser->close();

$isDevOrAdmin = in_array('admin', $roles, true) || in_array('developer', $roles, true);
if (!$isDevOrAdmin) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "অননুমোদিত অ্যাকশন! শুধুমাত্র অ্যাডমিন এবং ডেভেলপার কিস্তি মুছে ফেলতে পারেন ❌"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. EXIST CHECK & FETCH INSTALLMENT DETAILS
$stmt = $mysqli->prepare("
    SELECT id, amount, cardId, userId, date FROM daily_installments 
    WHERE id = ?
    LIMIT 1
");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$installment = $res->fetch_assoc();
$stmt->close();

if (!$installment) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "message" => "কিস্তি পাওয়া যায়নি বা ইতোমধ্যে মুছে ফেলা হয়েছে ❌"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. ATOMIC TRANSACTION: Delete from daily_installments, cash, and edits
$mysqli->begin_transaction();
try {
    // 5.1 Delete from daily_installments
    $stmtDel = $mysqli->prepare("DELETE FROM daily_installments WHERE id = ?");
    $stmtDel->bind_param("i", $id);
    $stmtDel->execute();
    $stmtDel->close();

    // 5.2 Clean up linked cash record
    $cashRefId = "daily_installment_" . $id;
    $stmtCash = $mysqli->prepare("DELETE FROM cash WHERE refId = ?");
    $stmtCash->bind_param("s", $cashRefId);
    $stmtCash->execute();
    $stmtCash->close();

    // 5.3 Clean up pending edits
    $stmtEdit = $mysqli->prepare("DELETE FROM daily_installment_edits WHERE installment_id = ?");
    $stmtEdit->bind_param("i", $id);
    $stmtEdit->execute();
    $stmtEdit->close();

    // Commit all changes
    $mysqli->commit();

    echo json_encode([
        "success"    => true,
        "message"    => "কিস্তি এবং সংশ্লিষ্ট ক্যাশ ইন রেকর্ড সফলভাবে মুছে ফেলা হয়েছে ✅",
        "deleted_id" => $id,
        "amount"     => (float)$installment['amount'],
        "card_id"    => $installment['cardId']
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "কিস্তি ডিলিট করতে সমস্যা হয়েছে: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
