<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true);

$id      = (int)($data['id'] ?? 0);
$userId  = (int)($data['user_id'] ?? 0); // Requester / performer

// VALIDATION
if (!$id) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Installment ID is required!"
    ]);
    exit;
}

// Check role if user_id is provided
if ($userId > 0) {
    $stmtUser = $mysqli->prepare("SELECT role FROM user_roles WHERE user_id = ?");
    if ($stmtUser) {
        $stmtUser->bind_param("i", $userId);
        $stmtUser->execute();
        $resRoles = $stmtUser->get_result();
        $roles = [];
        while ($r = $resRoles->fetch_assoc()) {
            $roles[] = strtolower($r['role']);
        }
        $stmtUser->close();

        $isDevOrAdmin = in_array('admin', $roles) || in_array('developer', $roles);
        if (!$isDevOrAdmin) {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "শুধুমাত্র অ্যাডমিন এবং ডেভেলপার কিস্তি মুছে ফেলতে পারেন ❌"
            ]);
            exit;
        }
    }
}

// EXIST CHECK & FETCH
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
    echo json_encode([
        "success" => false,
        "message" => "Installment not found ❌"
    ]);
    exit;
}

// DELETE FROM daily_installments
$stmtDel = $mysqli->prepare("DELETE FROM daily_installments WHERE id = ?");
$stmtDel->bind_param("i", $id);
$success = $stmtDel->execute();
$stmtDel->close();

if (!$success) {
    echo json_encode([
        "success" => false,
        "message" => "Delete failed: " . $mysqli->error
    ]);
    exit;
}

// CLEAN UP OR REVERT LINKED CASH ENTRY
$cashRefId = "daily_installment_" . $id;
$mysqli->query("DELETE FROM cash WHERE refId = '$cashRefId'");

// CLEAN UP PENDING EDITS
$mysqli->query("DELETE FROM daily_installment_edits WHERE installment_id = $id");

echo json_encode([
    "success" => true,
    "message" => "Installment and linked cash record deleted successfully ✅",
    "deleted_id" => $id
]);