<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

try {
    if (!isset($_GET['user_id'])) {
        echo json_encode(["status" => "error", "message" => "user_id is required."]);
        exit;
    }
    
    $user_id = $_GET['user_id'];
    
    $database = new Database();
    $db = $database->getConnection();
    BreakDbHelper::ensureSchema($db);
    
    // Fetch user's tiffin config from employees table
    $query = "SELECT has_tiffin_break, tiffin_start_time, tiffin_end_time, tiffin_duration_minutes, allocated_break_minutes 
              FROM employees WHERE user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $has_tiffin = isset($row['has_tiffin_break']) ? (int)$row['has_tiffin_break'] : 1;
        $alloc_mins = isset($row['allocated_break_minutes']) && $row['allocated_break_minutes'] !== null ? (int)$row['allocated_break_minutes'] : 0;
        $is_manual_break = ($has_tiffin === 0 || ($alloc_mins > 0 && $has_tiffin === 0));

        // Center prayer schedule from dedicated table (NO bloating on employees table)
        $prayer_schedule = BreakDbHelper::getActivePrayerSchedule($db);

        // Check if user has taken Tiffin or Namaz today
        $today = date('Y-m-d');
        $takenStmt = $db->prepare("SELECT break_type FROM user_breaks WHERE user_id = :user_id AND date = :today AND status = 'Completed' AND break_type IN ('Tiffin', 'Namaz')");
        $takenStmt->execute([':user_id' => $user_id, ':today' => $today]);
        $takenTypes = $takenStmt->fetchAll(PDO::FETCH_COLUMN);

        echo json_encode([
            "status" => "success",
            "has_tiffin" => (bool)$has_tiffin,
            "is_manual_break" => (bool)$is_manual_break,
            "allocated_break_minutes" => 60, // 40m noon tiffin + 20m afternoon namaz
            "tiffin_start_time" => $row['tiffin_start_time'] ?: '13:20:00',
            "tiffin_end_time" => $row['tiffin_end_time'] ?: '14:00:00',
            "duration_minutes" => (int)($row['tiffin_duration_minutes'] ?: 40),
            "tiffin_taken_today" => in_array('Tiffin', $takenTypes),
            "namaz_taken_today" => in_array('Namaz', $takenTypes),
            "prayer_schedule" => $prayer_schedule
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "User record not found"
        ]);
    }

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
