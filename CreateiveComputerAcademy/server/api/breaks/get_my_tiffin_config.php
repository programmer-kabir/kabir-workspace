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
    
    // Fetch user's tiffin config from employees table
    $query = "SELECT has_tiffin_break, tiffin_start_time, tiffin_end_time, tiffin_duration_minutes 
              FROM employees WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode([
            "status" => "success",
            "has_tiffin" => (bool)$row['has_tiffin_break'],
            "tiffin_start_time" => $row['tiffin_start_time'],
            "tiffin_end_time" => $row['tiffin_end_time'],
            "duration_minutes" => (int)$row['tiffin_duration_minutes']
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Employee record not found"
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
