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

// Accept reviewer_user_id from GET or POST
$reviewer_user_id = isset($_GET['reviewer_user_id']) ? intval($_GET['reviewer_user_id']) : null;

if (!$reviewer_user_id) {
    $data = json_decode(file_get_contents("php://input"));
    if (isset($data->reviewer_user_id)) {
        $reviewer_user_id = intval($data->reviewer_user_id);
    }
}

if (!$reviewer_user_id) {
    echo json_encode(["status" => "error", "message" => "reviewer_user_id is required."]);
    exit;
}

try {
    // Get all staff assigned to this reviewer
    $query = "
        SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_picture,
            u.status AS account_status,
            e.id AS employee_id,
            e.employee_code,
            e.designation,
            e.employment_type,
            e.employment_status,
            e.joining_date,
            e.shift_start,
            e.shift_end,
            e.shift_hours,
            d.id AS department_id,
            d.name AS department_name
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.reporting_manager_id = :reviewer_user_id
          AND u.status = 'active'
        ORDER BY u.name ASC
    ";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':reviewer_user_id', $reviewer_user_id, PDO::PARAM_INT);
    $stmt->execute();

    $team = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $team[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "reviewer_user_id" => $reviewer_user_id,
        "team_count" => count($team),
        "data" => $team
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
