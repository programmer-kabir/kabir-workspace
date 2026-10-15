<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

try {
    if (!isset($_GET['user_id'])) {
        echo json_encode(["status" => "error", "message" => "user_id is required."]);
        exit;
    }
    
    $user_id = $_GET['user_id'];
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Fetch user's tiffin config from employees or students table
    $query = "SELECT has_tiffin_break, tiffin_start_time, tiffin_end_time, tiffin_duration_minutes, allocated_break_minutes 
              FROM employees WHERE user_id = :user_id
              UNION
              SELECT has_tiffin_break, tiffin_start_time, tiffin_end_time, tiffin_duration_minutes, allocated_break_minutes 
              FROM students WHERE user_id = :user_id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $has_tiffin = isset($row['has_tiffin_break']) ? (int)$row['has_tiffin_break'] : 1;
        $alloc_mins = isset($row['allocated_break_minutes']) && $row['allocated_break_minutes'] !== null ? (int)$row['allocated_break_minutes'] : 0;
        $is_manual_break = ($has_tiffin === 0 || ($alloc_mins > 0 && $has_tiffin === 0));

        echo json_encode([
            "status" => "success",
            "has_tiffin" => (bool)$has_tiffin,
            "is_manual_break" => (bool)$is_manual_break,
            "allocated_break_minutes" => $alloc_mins,
            "tiffin_start_time" => $row['tiffin_start_time'],
            "tiffin_end_time" => $row['tiffin_end_time'],
            "duration_minutes" => (int)$row['tiffin_duration_minutes']
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
