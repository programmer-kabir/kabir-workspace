<?php
// server/api/admin/payroll/sync_attendance_earnings.php

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$pdo = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true) ?: $_POST;
$userId = !empty($data['user_id']) ? intval($data['user_id']) : null;
$schemeId = !empty($data['scheme_id']) ? intval($data['scheme_id']) : null;

try {
    $result = PayrollHelper::syncAttendanceEarnings($pdo, $userId, $schemeId);
    
    // If specific user, return their updated wallet summary too
    if ($userId) {
        $result['wallet_summary'] = PayrollHelper::getStaffWalletSummary($pdo, $userId, false);
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Successfully synchronized {$result['synced_sessions']} attendance session(s) into work earnings (৳{$result['synced_amount']}).",
        'data' => $result
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
