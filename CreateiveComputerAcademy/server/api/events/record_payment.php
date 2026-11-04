<?php
// server/api/events/record_payment.php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'EventDbHelper.php';
require_once 'EventAuthHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
EventDbHelper::ensureSchema($db);

$user = EventAuthHelper::getAuthenticatedUser($db);
if (!$user) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Authentication required."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$eventId       = (int)($input['event_id'] ?? 0);
$targetUserId  = !empty($input['user_id']) ? (int)$input['user_id'] : $user['id'];
$amount        = (float)($input['amount'] ?? 0);
$paymentMethod = trim($input['payment_method'] ?? 'cash');
$senderNumber  = trim($input['sender_number'] ?? '');
$trxId         = trim($input['transaction_id'] ?? '');
$receiptUrl    = trim($input['receipt_url'] ?? '');
$notes         = trim($input['notes'] ?? '');

if (!$eventId || $amount <= 0) {
    echo json_encode(["status" => "error", "message" => "Event ID and valid amount are required."]);
    exit;
}

try {
    $canManage = EventAuthHelper::canManage($user);

    // If regular staff, they can only submit for themselves, and status starts as pending
    if (!$canManage) {
        $targetUserId = $user['id'];
        $status       = ($paymentMethod === 'cash') ? 'pending' : 'pending';
        $verifiedBy   = null;
        $verifiedAt   = null;
    } else {
        // Manager can record verified cash or direct payment
        $isInstantVerify = isset($input['is_verified']) ? (bool)$input['is_verified'] : true;
        $status          = $isInstantVerify ? 'verified' : 'pending';
        $verifiedBy      = $isInstantVerify ? $user['id'] : null;
        $verifiedAt      = $isInstantVerify ? date('Y-m-d H:i:s') : null;
    }

    $stmt = $db->prepare("INSERT INTO event_contributions (
        event_id, user_id, amount, payment_method, 
        sender_number, transaction_id, receipt_url, 
        status, verified_by, verified_at, notes
    ) VALUES (
        :eid, :uid, :amount, :method,
        :sender, :trx, :receipt,
        :status, :vby, :vat, :notes
    )");

    $stmt->execute([
        ':eid'     => $eventId,
        ':uid'     => $targetUserId,
        ':amount'  => $amount,
        ':method'  => $paymentMethod,
        ':sender'  => $senderNumber,
        ':trx'     => $trxId,
        ':receipt' => $receiptUrl,
        ':status'  => $status,
        ':vby'     => $verifiedBy,
        ':vat'     => $verifiedAt,
        ':notes'   => $notes
    ]);

    // Update total_paid in event_participants if verified
    if ($status === 'verified') {
        $upd = $db->prepare("UPDATE event_participants 
            SET total_paid = (SELECT COALESCE(SUM(amount), 0) FROM event_contributions WHERE event_id = :eid AND user_id = :uid AND status = 'verified')
            WHERE event_id = :eid AND user_id = :uid");
        $upd->execute([':eid' => $eventId, ':uid' => $targetUserId]);
    }

    echo json_encode([
        "status"  => "success",
        "message" => ($status === 'verified') ? "Payment recorded and verified successfully!" : "Payment submitted! Awaiting Admin/Developer verification."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

