<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$reviewer_user_id = isset($_GET['reviewer_user_id']) ? intval($_GET['reviewer_user_id']) : null;
$filter_date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

if (!$reviewer_user_id) {
    echo json_encode(["status" => "error", "message" => "reviewer_user_id is required."]);
    exit;
}

try {
    // 1. Get all tasks that came to "In Review" on the specific date for this reviewer's team
    $query = "
        SELECT 
            t.id AS task_id,
            t.title,
            t.priority,
            t.status AS current_status,
            u.name AS staff_name,
            u.profile_picture AS staff_avatar,
            d.name AS department_name
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.reporting_manager_id = :reviewer_user_id
          AND DATE(t.updated_at) = :filter_date
          AND t.status IN ('In Review', 'Completed', 'Rejected')
        ORDER BY t.updated_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':reviewer_user_id', $reviewer_user_id, PDO::PARAM_INT);
    $stmt->bindParam(':filter_date', $filter_date);
    $stmt->execute();

    $tasks = [];
    $total_received = 0;
    $accepted = 0;
    $rejected = 0;
    $unviewed = 0;

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $total_received++;
        
        $status = $row['current_status'];
        
        // If it's completed, it was accepted
        if ($status === 'Completed') {
            $accepted++;
            $row['report_status'] = 'Accepted';
        } 
        // If it's In Review, reviewer hasn't processed it
        else if ($status === 'In Review') {
            $unviewed++;
            $row['report_status'] = 'Pending';
        }
        // If it's Rejected
        else {
            $rejected++;
            $row['report_status'] = 'Rejected';
        }

        $tasks[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "date" => $filter_date,
        "summary" => [
            "total_received" => $total_received,
            "accepted" => $accepted,
            "rejected" => $rejected,
            "unviewed" => $unviewed
        ],
        "tasks" => $tasks
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
