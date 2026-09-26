<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Join with users table to get staff details
    $query = "SELECT l.*, u.name as staff_name, 'Staff' as staff_role, u.profile_picture as staff_image 
              FROM leave_requests l 
              LEFT JOIN users u ON l.user_id = u.id 
              ORDER BY l.created_at DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $leaves = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $leaves[] = $row;
    }
    
    echo json_encode(["status" => "success", "leaves" => $leaves]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
