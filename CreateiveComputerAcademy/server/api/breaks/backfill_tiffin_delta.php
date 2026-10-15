<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/BreakDbHelper.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = getDB();
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    BreakDbHelper::ensureSchema($db);

    // Update historical rows with exact deltas (40 - duration_minutes)
    $updateStmt = $db->prepare("UPDATE user_breaks 
        SET tiffin_delta_minutes = (40 - duration_minutes) 
        WHERE break_type = 'Tiffin' 
          AND status = 'Completed' 
          AND duration_minutes > 0");
    $updateStmt->execute();
    $rowsAffected = $updateStmt->rowCount();

    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 2;
    $summary = BreakDbHelper::getTiffinSummary($db, $user_id);
    $available_mins = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);

    echo json_encode([
        'status' => 'success',
        'message' => "Historical tiffin records recalculated successfully.",
        'rows_updated' => $rowsAffected,
        'user_id' => $user_id,
        'tiffin_summary' => $summary,
        'available_mango_hours' => round($available_mins / 60, 2)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
