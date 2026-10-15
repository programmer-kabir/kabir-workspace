<?php
@set_time_limit(180);
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$database = new Database();
$db = $database->getConnection();

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

$cronName = isset($data['cron_name']) ? trim($data['cron_name']) : '';

try {
    $output = "";
    $logContent = "";

    $startTime = microtime(true);

    switch ($cronName) {
        case 'absent_manager':
            $_GET['force'] = '1';
            $_GET['action'] = !empty($data['action']) ? $data['action'] : 'warning';
            if (!empty($data['date'])) {
                $_GET['date'] = $data['date'];
            }
            ob_start();
            include __DIR__ . '/../crons/cron_absent_manager.php';
            $output = ob_get_clean();
            if (file_exists(__DIR__ . '/../crons/cron_absent_log.txt')) {
                $logContent = substr(file_get_contents(__DIR__ . '/../crons/cron_absent_log.txt'), -1200);
            }
            break;

        case 'auto_checkout':
            $_GET['force'] = '1'; // Allow manual force run from dev console
            ob_start();
            include __DIR__ . '/../crons/auto_checkout.php';
            $output = ob_get_clean();
            if (file_exists(__DIR__ . '/../crons/auto_checkout_log.txt')) {
                $logContent = substr(file_get_contents(__DIR__ . '/../crons/auto_checkout_log.txt'), -1000);
            }
            break;

        case 'auto_tiffin':
            if (!empty($data['action'])) {
                $_GET['action'] = $data['action'];
            }
            ob_start();
            include __DIR__ . '/../crons/auto_tiffin.php';
            $output = ob_get_clean();
            if (file_exists(__DIR__ . '/../crons/auto_tiffin_log.txt')) {
                $logContent = substr(file_get_contents(__DIR__ . '/../crons/auto_tiffin_log.txt'), -1000);
            }
            break;

        case 'backfill_absents':
            ob_start();
            include __DIR__ . '/../crons/backfill_past_absents.php';
            $output = ob_get_clean();
            break;

        case 'migrate_categories':
            ob_start();
            include __DIR__ . '/../crons/migrate_categories.php';
            $output = ob_get_clean();
            break;

        default:
            throw new Exception("Unknown cron target: " . htmlspecialchars($cronName));
    }

    $durationMs = round((microtime(true) - $startTime) * 1000, 2);

    $cleanOutput = trim($output);
    if (empty($cleanOutput) && !empty($logContent)) {
        $cleanOutput = $logContent;
    }
    if (empty($cleanOutput)) {
        $cleanOutput = "Job completed successfully with exit code 0. No stdout was returned by the script.";
    }

    echo json_encode([
        'status' => 'success',
        'cron_name' => $cronName,
        'duration_ms' => $durationMs,
        'executed_at' => date('Y-m-d H:i:s'),
        'executed_by' => $devUser['name'],
        'output' => $cleanOutput
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Cron execution error: ' . $e->getMessage()
    ]);
}
?>
