<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'ContentStudioHelper.php';

$database = new Database();
$db = $database->getConnection();
ContentStudioHelper::ensureSchema($db);

try {
    // 1. Fetch active staff with department info
    $stmt = $db->query("
        SELECT 
            u.id, u.name, u.email, u.profile_picture,
            d.name as department_name, d.code as department_code,
            e.designation,
            (SELECT GROUP_CONCAT(role) FROM user_roles WHERE user_id = u.id) as user_roles
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE u.status = 'active'
        ORDER BY u.name ASC
    ");
    
    $allStaff = [];
    $contentCreators = [];
    $reviewers = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $roles = !empty($row['user_roles']) ? explode(',', $row['user_roles']) : [];
        $dept = $row['department_name'] ?: '';
        $deptLower = strtolower($dept);

        $member = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'profile_picture' => $row['profile_picture'],
            'department_name' => $row['department_name'],
            'department_code' => $row['department_code'],
            'designation' => $row['designation'],
            'roles' => $roles
        ];

        $allStaff[] = $member;

        // Is in Content Creation department?
        $isContent = (
            strpos($deptLower, 'content') !== false ||
            strpos($deptLower, 'video') !== false ||
            ($row['department_code'] && strtoupper($row['department_code']) === 'CONTENT')
        );

        if ($isContent) {
            $contentCreators[] = $member;
            // Content Team members can also be QA Reviewers
            $reviewers[] = $member;
        }

        // Also allow Admin/Manager in reviewers if distinct
        if ((in_array('admin', $roles) || in_array('manager', $roles)) && !$isContent) {
            $reviewers[] = $member;
        }
    }

    // If no one is explicitly assigned to Content Creation department yet, fallback to all active staff
    $finalCreators = !empty($contentCreators) ? $contentCreators : $allStaff;
    $finalReviewers = !empty($reviewers) ? $reviewers : $allStaff;

    echo json_encode([
        'status' => 'success',
        'data' => $finalCreators,
        'creators' => $finalCreators,
        'reviewers' => $finalReviewers,
        'all' => $allStaff,
        'has_content_dept_members' => !empty($contentCreators)
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
