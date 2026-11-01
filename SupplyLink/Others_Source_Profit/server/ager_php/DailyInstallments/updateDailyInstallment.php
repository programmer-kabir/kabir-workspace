<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true);

$id            = $data['id'] ?? null;
$amount        = $data['amount'] ?? null;
$date          = $data['date'] ?? null;
$receiver      = $data['receiver'] ?? null;
$cardId        = $data['cardId'] ?? null;
$updatedBy     = intval($data['updated_by'] ?? 0);
$updateReason  = trim($data['update_reason'] ?? '');

// ✅ Validation
if (
    empty($id) ||
    $amount === null ||
    empty($date) ||
    empty($receiver) ||
    empty($cardId)
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "All fields are required!"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!is_numeric($amount)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Amount must be number"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 🛡️ ROLE CHECK: User ID is required
if ($updatedBy <= 0) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "অননুমোদিত অনুরোধ! এডিটর ইউজার আইডি (updated_by) প্রদান করা আবশ্যক।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 🛡️ ROLE CHECK: Only Admin and Developer can directly update installments
$stmtRole = $mysqli->prepare("SELECT role FROM user_roles WHERE user_id = ?");
if (!$stmtRole) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "ডাটাবেজ ত্রুটি: " . $mysqli->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
$stmtRole->bind_param("i", $updatedBy);
$stmtRole->execute();
$resRoles = $stmtRole->get_result();
$roles = [];
while ($r = $resRoles->fetch_assoc()) {
    $roles[] = strtolower(trim((string)$r['role']));
}
$stmtRole->close();

$isDevOrAdmin = in_array('admin', $roles, true) || in_array('developer', $roles, true);
if (!$isDevOrAdmin) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "অননুমোদিত অ্যাকশন! শুধুমাত্র অ্যাডমিন এবং ডেভেলপার সরাসরি কিস্তি এডিট করতে পারেন ❌"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 🔥 Duplicate Check (same card + same date, except current row)
$stmt = $mysqli->prepare("
    SELECT id
    FROM daily_installments
    WHERE cardId = ?
      AND date = ?
      AND id != ?
    LIMIT 1
");

$stmt->bind_param("isi", $cardId, $date, $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
    $stmt->close();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Already added for this date ❌"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
$stmt->close();

$updateAt = date("Y-m-d H:i:s");

// 🔒 DATABASE TRANSACTION
$mysqli->begin_transaction();

try {
    // 1. Update daily_installments
    $stmt = $mysqli->prepare("
        UPDATE daily_installments
        SET
            amount = ?,
            date = ?,
            receiver = ?,
            update_by = ?,
            update_at = ?,
            update_reason = ?
        WHERE id = ?
    ");

    if (!$stmt) {
        throw new Exception("Prepare failed on daily_installments: " . $mysqli->error);
    }

    $stmt->bind_param(
        "dsiissi",
        $amount,
        $date,
        $receiver,
        $updatedBy,
        $updateAt,
        $updateReason,
        $id
    );

    if (!$stmt->execute()) {
        $err = $stmt->error;
        $stmt->close();
        throw new Exception("Update failed on daily_installments: " . $err);
    }
    $stmt->close();

    // 2. AUTOMATIC CASH IN SYNC
    $cashRefId = "daily_installment_" . $id;
    $stmtCheckCash = $mysqli->prepare("SELECT id FROM cash WHERE refId = ? LIMIT 1");
    if (!$stmtCheckCash) {
        throw new Exception("Prepare check cash failed: " . $mysqli->error);
    }
    $stmtCheckCash->bind_param("s", $cashRefId);
    $stmtCheckCash->execute();
    $foundCash = $stmtCheckCash->get_result()->fetch_assoc();
    $stmtCheckCash->close();

    if ($foundCash) {
        $stmtUpCash = $mysqli->prepare("
            UPDATE cash 
            SET amount = ?, date = ?, remarks = CONCAT(COALESCE(remarks, ''), ' [এডিট: ৳', ?, ' - ', ?, ']')
            WHERE id = ?
        ");
        if (!$stmtUpCash) {
            throw new Exception("Prepare update cash failed: " . $mysqli->error);
        }
        $amtStr = number_format($amount, 2);
        $stmtUpCash->bind_param("dsssi", $amount, $date, $amtStr, $updateAt, $foundCash['id']);
        if (!$stmtUpCash->execute()) {
            $err = $stmtUpCash->error;
            $stmtUpCash->close();
            throw new Exception("Update cash failed: " . $err);
        }
        $stmtUpCash->close();
    } else {
        // Fetch customer name for new cash row if not exists
        $stmtCust = $mysqli->prepare("
            SELECT u.name FROM users u 
            JOIN customer_installment_cards c ON c.user_id = u.id 
            WHERE c.id = ? LIMIT 1
        ");
        $custName = "গ্রাহক";
        if ($stmtCust) {
            $stmtCust->bind_param("i", $cardId);
            $stmtCust->execute();
            $rC = $stmtCust->get_result()->fetch_assoc();
            if ($rC && !empty($rC['name'])) $custName = $rC['name'];
            $stmtCust->close();
        }

        $cashType     = "in";
        $cashSource   = "{$custName} - কার্ড #{$cardId} (দৈনিক কিস্তি)";
        $cashPurpose  = "দৈনিক কিস্তি আদায়";
        $cashCategory = "daily-installment";
        $cashRemarks  = "দৈনিক কিস্তি আদায় (এডিটেড): {$custName}, কার্ড #{$cardId}";
        $cashApproval = "approved";

        $stmtInsCash = $mysqli->prepare("
            INSERT INTO cash 
            (type, source, purpose, amount, category, refId, remarks, date, createdAt, approval_status, approved_by, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        if (!$stmtInsCash) {
            throw new Exception("Prepare insert cash failed: " . $mysqli->error);
        }
        $stmtInsCash->bind_param(
            "sssdssssssis",
            $cashType,
            $cashSource,
            $cashPurpose,
            $amount,
            $cashCategory,
            $cashRefId,
            $cashRemarks,
            $date,
            $updateAt,
            $cashApproval,
            $receiver,
            $updateAt
        );
        if (!$stmtInsCash->execute()) {
            $err = $stmtInsCash->error;
            $stmtInsCash->close();
            throw new Exception("Insert cash failed: " . $err);
        }
        $stmtInsCash->close();
    }

    // Commit Transaction
    $mysqli->commit();

    // Fetch Updated Data
    $stmt = $mysqli->prepare("SELECT * FROM daily_installments WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Payment Updated Successfully ✅",
        "data" => $row
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "কিস্তি আপডেট ব্যর্থ হয়েছে: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
