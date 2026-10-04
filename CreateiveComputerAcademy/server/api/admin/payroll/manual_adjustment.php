<?php
// server/api/admin/payroll/manual_adjustment.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $minutes = isset($data['minutes']) ? intval($data['minutes']) : 0;
    $notes = isset($data['notes']) ? trim($data['notes']) : 'Admin Manual Adjustment';
    $workDate = isset($data['work_date']) ? trim($data['work_date']) : date('Y-m-d');

    if ($userId <= 0 || $minutes == 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id and minutes are required.']);
        exit();
    }

    $result = PayrollHelper::recordWorkTimeEarning(
        $pdo,
        $userId,
        $minutes,
        'manual_adjustment',
        'ADMIN_ADJ_' . time(),
        $notes,
        $workDate
    );

    echo json_encode([
        'status' => 'success',
        'message' => 'Manual adjustment recorded successfully.',
        'data' => $result
    ]);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
