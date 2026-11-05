<?php
/**
 * ============================================================================
 * SupplyLink - Log Page Visit Navigation API
 * ফাইল: server/apis/audit/log_page_visit.php
 * ============================================================================
 */

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/activity_logger.php';

date_default_timezone_set('Asia/Dhaka');

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true) ?? $_POST;

$path = trim($data['path'] ?? ($_GET['path'] ?? ''));
$pageTitle = trim($data['page_title'] ?? ($_GET['page_title'] ?? $path));

if (empty($path)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Path is required"]);
    exit;
}

$userId = !empty($data['user_id']) ? (int)$data['user_id'] : null;
$userName = !empty($data['user_name']) ? trim($data['user_name']) : null;
$userRole = !empty($data['user_role']) ? trim($data['user_role']) : null;

// Throttling: avoid duplicate page view log if same user visited the same path within last 15 seconds
if ($userId) {
    $stmtCheck = $mysqli->prepare("
        SELECT id FROM `system_activity_logs`
        WHERE user_id = ? AND entity_id = ? AND action_type = 'PAGE_VIEW'
          AND created_at >= (NOW() - INTERVAL 15 SECOND)
        LIMIT 1
    ");
    if ($stmtCheck) {
        $stmtCheck->bind_param("is", $userId, $path);
        $stmtCheck->execute();
        $recentHit = $stmtCheck->get_result()->fetch_assoc();
        $stmtCheck->close();

        if ($recentHit) {
            echo json_encode(["success" => true, "throttled" => true]);
            exit;
        }
    }
}

$description = !empty($pageTitle) 
    ? "ভিজিট করেছেন: {$pageTitle} ({$path})"
    : "পেজ ভিজিট: {$path}";

$logId = logSystemActivity([
    'user_id' => $userId,
    'user_name' => $userName,
    'user_role' => $userRole,
    'action_type' => 'PAGE_VIEW',
    'category' => 'navigation',
    'entity_type' => 'route',
    'entity_id' => $path,
    'description' => $description,
    'details' => [
        'path' => $path,
        'title' => $pageTitle,
    ]
]);

echo json_encode([
    "success" => (bool)$logId,
    "log_id" => $logId
]);

