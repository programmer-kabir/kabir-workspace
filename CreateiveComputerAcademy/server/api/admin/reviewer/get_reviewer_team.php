<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$reviewer_user_id = isset($_GET['reviewer_user_id']) ? intval($_GET['reviewer_user_id']) : 0;

if (!$reviewer_user_id) {
    echo json_encode(["status" => "error", "message" => "reviewer_user_id is required."]);
    exit;
}

try {
    // 1. Fetch Reviewer Details
    $rev_stmt = $db->prepare("
        SELECT u.id, u.name, u.email, COALESCE(r.reviewer_code, CONCAT('REV-', u.id)) AS reviewer_code
        FROM users u
        LEFT JOIN reviewers r ON u.id = r.user_id
        WHERE u.id = :reviewer_id LIMIT 1
    ");
    $rev_stmt->execute([':reviewer_id' => $reviewer_user_id]);
    $reviewer = $rev_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reviewer) {
        echo json_encode(["status" => "error", "message" => "Reviewer not found."]);
        exit;
    }

    // 2. Fetch all active staff with assignment status
    $query = "
        SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_picture,
            e.employee_code,
            e.designation,
            e.reporting_manager_id,
            d.name AS department_name,
            CASE WHEN e.reporting_manager_id = :reviewer_id THEN 1 ELSE 0 END AS is_assigned,
            mgr.name AS current_manager_name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN users mgr ON e.reporting_manager_id = mgr.id
        WHERE ur.role IN ('staff', 'instructor')
          AND u.status = 'active'
        ORDER BY is_assigned DESC, u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute([':reviewer_id' => $reviewer_user_id]);
    $staff_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $assigned_count = 0;
    foreach ($staff_list as $s) {
        if ($s['is_assigned'] == 1) $assigned_count++;
    }

    echo json_encode([
        "status"         => "success",
        "reviewer"       => $reviewer,
        "assigned_count" => $assigned_count,
        "data"           => $staff_list
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
