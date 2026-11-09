<?php
// server/api/security_deposit/get_all_deposits.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/SecurityDepositHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $detailed = !empty($_GET['detailed']);

    if ($detailed) {
        $list = SecurityDepositHelper::getAllDepositsDetailed($pdo);

        $totalTarget = 0.0;
        $totalCollected = 0.0;
        $totalRemaining = 0.0;
        $activeCount = 0;
        $fulfilledCount = 0;
        $exemptCount = 0;

        foreach ($list as $item) {
            if ($item['has_deposit']) {
                $totalTarget += $item['target_amount'];
                $totalCollected += $item['collected_amount'];
                $totalRemaining += $item['remaining_amount'];
                if ($item['is_fulfilled']) {
                    $fulfilledCount++;
                } else {
                    $activeCount++;
                }
            } else {
                $exemptCount++;
            }
        }

        echo json_encode([
            'status' => 'success',
            'data' => [
                'staff_list' => $list,
                'metrics' => [
                    'total_target' => $totalTarget,
                    'total_collected' => $totalCollected,
                    'total_remaining' => $totalRemaining,
                    'active_count' => $activeCount,
                    'fulfilled_count' => $fulfilledCount,
                    'exempt_count' => $exemptCount,
                    'total_staff' => count($list),
                ]
            ]
        ]);
    } else {
        $map = SecurityDepositHelper::getAllDepositsMap($pdo);

        echo json_encode([
            'status' => 'success',
            'data' => $map
        ]);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>

