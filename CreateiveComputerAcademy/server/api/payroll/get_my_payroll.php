<?php
// server/api/payroll/get_my_payroll.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/PayrollHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    if ($userId <= 0) {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    }

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id is required.']);
        exit();
    }

    $summary = PayrollHelper::getStaffWalletSummary($pdo, $userId);

    if (!$summary['has_scheme']) {
        echo json_encode([
            'status' => 'success',
            'has_scheme' => false,
            'message' => $summary['message'],
            'summary' => $summary,
            'recent_earnings' => [],
            'recent_withdrawals' => []
        ]);
        exit();
    }

    $schemeId = $summary['scheme']['id'];

    // Recent work earnings
    $stmtEarn = $pdo->prepare("
        SELECT id, work_date, session_start, session_end, approved_minutes, applied_rate, earned_amount, is_surplus, source_type, reference_id, notes, created_at
        FROM staff_work_earnings
        WHERE scheme_id = :scheme_id
        ORDER BY id DESC LIMIT 200
    ");
    $stmtEarn->execute([':scheme_id' => $schemeId]);
    $recentEarnings = $stmtEarn->fetchAll(PDO::FETCH_ASSOC);

    // Recent withdrawals
    $stmtWd = $pdo->prepare("
        SELECT id, amount, withdrawal_type, status, payment_method, account_details, transaction_reference, admin_notes, requested_at, processed_at
        FROM staff_withdrawals
        WHERE scheme_id = :scheme_id
        ORDER BY id DESC LIMIT 50
    ");
    $stmtWd->execute([':scheme_id' => $schemeId]);
    $recentWithdrawals = $stmtWd->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'has_scheme' => true,
        'summary' => $summary,
        'recent_earnings' => $recentEarnings,
        'recent_withdrawals' => $recentWithdrawals
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
