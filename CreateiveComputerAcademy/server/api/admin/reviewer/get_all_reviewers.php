<?php
require_once '../../../config/database.php';
require_once '../../../config/cors.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "
        SELECT 
            u.id, u.name, u.email, u.phone, u.status, u.profile_picture, u.cover_picture,
            ur.role,
            COALESCE(r.reviewer_code, e.employee_code, CONCAT('REV-', u.id)) AS reviewer_code,
            COALESCE(r.designation, e.designation, 'QA Reviewer') AS designation,
            COALESCE(r.employment_status, e.employment_status, 'Active') AS employment_status,
            COALESCE(r.employment_type, e.employment_type, 'Full-time') AS employment_type,
            COALESCE(r.joining_date, e.joining_date) AS joining_date,
            COALESCE(r.shift_start, e.shift_start, '09:00:00') AS shift_start,
            COALESCE(r.shift_end, e.shift_end, '17:00:00') AS shift_end,
            (SELECT COUNT(*) FROM employees emp WHERE emp.reporting_manager_id = u.id) AS assigned_staff_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.reviewed_by = u.id AND t.status = 'Completed') AS completed_reviews_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.reviewed_by = u.id AND t.status = 'Rejected') AS rejected_reviews_count
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN reviewers r ON u.id = r.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE ur.role = 'reviewer'
        ORDER BY u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $reviewer_list = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $reviewer_list[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data"   => $reviewer_list
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
