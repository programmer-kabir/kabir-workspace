<?php
// server/api/payroll/record_timer_session.php
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
    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $minutes = isset($data['minutes']) ? intval($data['minutes']) : 0;
    $seconds = isset($data['seconds']) ? intval($data['seconds']) : 0;

    // Support either minutes or total seconds
    if ($minutes <= 0 && $seconds > 0) {
        $minutes = max(1, round($seconds / 60));
    }

    $sourceType = isset($data['source_type']) ? trim($data['source_type']) : 'timer';
    $referenceId = isset($data['reference_id']) ? trim($data['reference_id']) : null;
    $notes = isset($data['notes']) ? trim($data['notes']) : null;
    $workDate = isset($data['work_date']) ? trim($data['work_date']) : date('Y-m-d');
    $sessionStart = isset($data['session_start']) ? trim($data['session_start']) : null;
    $sessionEnd = isset($data['session_end']) ? trim($data['session_end']) : null;

    if ($userId <= 0 || $minutes <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id and work minutes (> 0) are required.']);
        exit();
    }

    $result = PayrollHelper::recordWorkTimeEarning(
        $pdo,
        $userId,
        $minutes,
        $sourceType,
        $referenceId,
        $notes,
        $workDate,
        $sessionStart,
        $sessionEnd
    );

    echo json_encode([
        'status' => 'success',
        'message' => 'Work time recorded and earnings calculated successfully.',
        'data' => $result
    ]);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
