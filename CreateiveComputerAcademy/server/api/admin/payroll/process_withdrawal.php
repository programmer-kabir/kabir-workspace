<?php
// server/api/admin/payroll/process_withdrawal.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../notifications/notification_helper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $withdrawalId = isset($data['withdrawal_id']) ? intval($data['withdrawal_id']) : 0;
    $adminId = isset($data['admin_id']) ? intval($data['admin_id']) : null;
    $status = isset($data['status']) ? trim($data['status']) : '';
    $transactionRef = isset($data['transaction_reference']) ? trim($data['transaction_reference']) : null;
    $adminNotes = isset($data['admin_notes']) ? trim($data['admin_notes']) : null;

    if ($withdrawalId <= 0 || !in_array($status, ['approved', 'paid', 'rejected'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid withdrawal_id and status (approved, paid, rejected) are required.']);
        exit();
    }

    $stmtCheck = $pdo->prepare("SELECT * FROM staff_withdrawals WHERE id = :id");
    $stmtCheck->execute([':id' => $withdrawalId]);
    $withdrawal = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if (!$withdrawal) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Withdrawal record not found.']);
        exit();
    }

    $stmtUpdate = $pdo->prepare("
        UPDATE staff_withdrawals SET
            status = :status,
            transaction_reference = COALESCE(:transaction_reference, transaction_reference),
            admin_notes = :admin_notes,
            processed_at = NOW(),
            processed_by = :admin_id
        WHERE id = :id
    ");

    $stmtUpdate->execute([
        ':status' => $status,
        ':transaction_reference' => $transactionRef,
        ':admin_notes' => $adminNotes,
        ':admin_id' => $adminId,
        ':id' => $withdrawalId
    ]);

    // Send notification to staff
    $statusEmoji = ($status === 'paid' || $status === 'approved') ? '✅' : '❌';
    $statusTitle = ($status === 'paid') ? 'Withdrawal Disbursed!' : (($status === 'approved') ? 'Withdrawal Approved' : 'Withdrawal Rejected');
    $statusMsg = ($status === 'paid') 
        ? "Your withdrawal of ৳" . number_format($withdrawal['amount'], 2) . " has been sent via {$withdrawal['payment_method']}." . ($transactionRef ? " (Trx: {$transactionRef})" : "")
        : (($status === 'approved')
            ? "Your withdrawal of ৳" . number_format($withdrawal['amount'], 2) . " has been approved and is being processed."
            : "Your withdrawal request of ৳" . number_format($withdrawal['amount'], 2) . " was rejected. " . ($adminNotes ? "Reason: {$adminNotes}" : ""));

    try {
        NotificationHelper::sendToUser(
            $pdo,
            $withdrawal['user_id'],
            $adminId,
            "{$statusEmoji} {$statusTitle}",
            $statusMsg,
            ($status === 'rejected' ? 'error' : 'success'),
            'staff'
        );
    } catch (Exception $e) {
        // Non-blocking
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Withdrawal marked as {$status} successfully.",
        'data' => [
            'withdrawal_id' => $withdrawalId,
            'status' => $status,
            'processed_at' => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
