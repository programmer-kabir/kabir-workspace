<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));
$user_id = null;

if (isset($data->user_id)) {
    $user_id = (int)$data->user_id;
} else if (isset($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
}

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$today = date('Y-m-d');

try {
    // 1. Get active break
    $activeQuery = "SELECT id, break_type, start_time, reason, estimated_minutes 
                    FROM user_breaks 
                    WHERE user_id = :user_id AND status = 'Active' 
                    ORDER BY id DESC LIMIT 1";
    $activeStmt = $db->prepare($activeQuery);
    $activeStmt->execute([':user_id' => $user_id]);
    $active_break = $activeStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    // Auto-close stale active breaks older than 12 hours
    if ($active_break && !empty($active_break['start_time'])) {
        $startTs = strtotime($active_break['start_time']);
        if ((time() - $startTs) > (12 * 3600)) {
            $closeStmt = $db->prepare("UPDATE user_breaks SET status = 'Completed', end_time = DATE_ADD(start_time, INTERVAL 30 MINUTE), duration_minutes = 30 WHERE id = :id");
            $closeStmt->execute([':id' => $active_break['id']]);
            $active_break = null;
        }
    }

    // 2. Get pending break request (if no active break)
    $pending_request = null;
    if (!$active_break) {
        $pendQuery = "SELECT id, break_type, reason, estimated_minutes, created_at 
                      FROM user_breaks 
                      WHERE user_id = :user_id AND date = :today AND status = 'Pending' 
                      ORDER BY id DESC LIMIT 1";
        $pendStmt = $db->prepare($pendQuery);
        $pendStmt->execute([':user_id' => $user_id, ':today' => $today]);
        $pending_request = $pendStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // 3. Get allocated_break_minutes for this user (from employees or students)
    $limit_query = "SELECT allocated_break_minutes FROM employees WHERE user_id = :user_id 
                    UNION 
                    SELECT allocated_break_minutes FROM students WHERE user_id = :user_id LIMIT 1";
    $limit_stmt = $db->prepare($limit_query);
    $limit_stmt->execute([':user_id' => $user_id]);
    $allocated_minutes = 60; // Default 60 mins
    
    if ($limit_stmt->rowCount() > 0) {
        $emp = $limit_stmt->fetch(PDO::FETCH_ASSOC);
        if (isset($emp['allocated_break_minutes']) && (int)$emp['allocated_break_minutes'] > 0) {
            $allocated_minutes = (int)$emp['allocated_break_minutes'];
        }
    }

    // 4. Get total Tiffin break minutes today (counted against company quota)
    $tiffin_stmt = $db->prepare("SELECT SUM(duration_minutes) as total_mins 
                                 FROM user_breaks 
                                 WHERE user_id = :user_id AND date = :today AND status = 'Completed' 
                                 AND break_type = 'Tiffin'");
    $tiffin_stmt->execute([':user_id' => $user_id, ':today' => $today]);
    $total_tiffin_minutes_today = (int)($tiffin_stmt->fetch(PDO::FETCH_ASSOC)['total_mins'] ?? 0);

    // 5. Get total Mango Overtime break minutes today (paid from overtime bank)
    $mango_stmt = $db->prepare("SELECT SUM(duration_minutes) as total_mins 
                                FROM user_breaks 
                                WHERE user_id = :user_id AND date = :today AND status = 'Completed' 
                                AND break_type IN ('Mango Break', 'Mango Overtime')");
    $mango_stmt->execute([':user_id' => $user_id, ':today' => $today]);
    $total_mango_minutes_today = (int)($mango_stmt->fetch(PDO::FETCH_ASSOC)['total_mins'] ?? 0);

    echo json_encode([
        "status" => "success", 
        "data" => [
            "active_break" => $active_break,
            "pending_request" => $pending_request,
            "allocated_break_minutes" => $allocated_minutes,
            "total_break_minutes_today" => $total_tiffin_minutes_today,
            "total_tiffin_minutes_today" => $total_tiffin_minutes_today,
            "total_mango_minutes_today" => $total_mango_minutes_today,
            "server_time" => date('Y-m-d H:i:s')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
