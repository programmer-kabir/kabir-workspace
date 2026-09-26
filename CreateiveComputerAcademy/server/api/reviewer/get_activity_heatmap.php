<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required"]);
    exit;
}

try {
    // Get activity for the past 6 months (approx 180 days)
    $start_date = date('Y-m-d', strtotime('-6 months'));
    
    // We count how many tasks this reviewer has changed the status of (e.g. Approved/Rejected) per day.
    // Assuming task_logs table tracks this with 'changed_by' matching user_id.
    $query = "
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM task_logs 
        WHERE changed_by = :uid 
          AND created_at >= :start_date 
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute([':uid' => $user_id, ':start_date' => $start_date . ' 00:00:00']);
    
    $activity = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $activity[$row['date']] = intval($row['count']);
    }
    
    // Generate full list of days for the last 6 months to ensure no gaps
    $data = [];
    $current = strtotime($start_date);
    $end = time();
    
    while ($current <= $end) {
        $d = date('Y-m-d', $current);
        $count = isset($activity[$d]) ? $activity[$d] : 0;
        
        // Calculate a 'level' from 0 to 4 similar to GitHub
        $level = 0;
        if ($count > 0) $level = 1;
        if ($count >= 5) $level = 2;
        if ($count >= 10) $level = 3;
        if ($count >= 20) $level = 4;
        
        $data[] = [
            "date" => $d,
            "count" => $count,
            "level" => $level
        ];
        
        $current = strtotime('+1 day', $current);
    }

    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
