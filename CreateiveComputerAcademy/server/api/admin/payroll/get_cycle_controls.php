<?php
// server/api/admin/payroll/get_cycle_controls.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

PayrollHelper::ensureSchema($pdo);

try {
    // 1. Fetch all distinct billing months from staff_work_earnings
    $stmtMonths = $pdo->query("
        SELECT DISTINCT DATE_FORMAT(work_date, '%Y-%m') AS month_key
        FROM staff_work_earnings
        ORDER BY month_key DESC
    ");
    $allWorkMonths = $stmtMonths->fetchAll(PDO::FETCH_COLUMN) ?: [];

    // Always include current month and previous month even if no earnings yet
    $currentM = date('Y-m');
    $prevM = date('Y-m', strtotime('-1 month'));
    if (!in_array($currentM, $allWorkMonths)) array_unshift($allWorkMonths, $currentM);
    if (!in_array($prevM, $allWorkMonths)) $allWorkMonths[] = $prevM;
    $allWorkMonths = array_unique($allWorkMonths);
    rsort($allWorkMonths);

    // 2. Fetch overrides from payroll_cycle_controls
    $stmtControls = $pdo->query("
        SELECT c.*, u.name AS unlocked_by_name
        FROM payroll_cycle_controls c
        LEFT JOIN users u ON c.unlocked_by = u.id
    ");
    $controlsMap = [];
    while ($row = $stmtControls->fetch(PDO::FETCH_ASSOC)) {
        $controlsMap[$row['month_key']] = $row;
    }

    // 3. Merge into unified cycle status list
    $cycles = [];
    foreach ($allWorkMonths as $mKey) {
        $label = date('F Y', strtotime($mKey . '-01'));
        $ctrl = $controlsMap[$mKey] ?? null;

        if ($ctrl) {
            $isUnlocked = !empty($ctrl['is_unlocked']);
            $unlockType = 'manual_admin';
            $unlockedAt = $ctrl['unlocked_at'];
            $unlockedByName = $ctrl['unlocked_by_name'];
        } else {
            $isUnlocked = ($mKey < $currentM);
            $unlockType = 'auto_cycle';
            $unlockedAt = $isUnlocked ? date('Y-m-15 00:00:00', strtotime($mKey . '-01 +1 month')) : null;
            $unlockedByName = 'System Auto';
        }

        // Fetch high-level month stats across all staff
        $stmtStats = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT user_id) AS active_staff_count,
                COALESCE(SUM(earned_amount), 0) AS total_payroll_earned,
                COALESCE(SUM(approved_minutes), 0) AS total_minutes
            FROM staff_work_earnings
            WHERE DATE_FORMAT(work_date, '%Y-%m') = :mk
        ");
        $stmtStats->execute([':mk' => $mKey]);
        $mStats = $stmtStats->fetch(PDO::FETCH_ASSOC);

        $cycles[] = [
            'month_key' => $mKey,
            'month_label' => $label,
            'is_unlocked' => $isUnlocked,
            'unlock_type' => $unlockType,
            'unlocked_at' => $unlockedAt,
            'unlocked_by_name' => $unlockedByName,
            'active_staff_count' => intval($mStats['active_staff_count'] ?? 0),
            'total_payroll_earned' => floatval($mStats['total_payroll_earned'] ?? 0),
            'total_hours' => round(intval($mStats['total_minutes'] ?? 0) / 60, 2),
            'has_admin_control' => ($ctrl !== null)
        ];
    }

    echo json_encode([
        'status' => 'success',
        'cycles' => $cycles,
        'current_month' => $currentM
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

