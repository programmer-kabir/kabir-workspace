<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../../config/database.php';
require_once '../../../config/cors.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$today = date('Y-m-d');
$month_start = date('Y-m-01 00:00:00');
$month_end   = date('Y-m-t 23:59:59');

try {
    // 1. Fetch all reviewers
    $rev_query = "
        SELECT 
            u.id, u.name, u.email, u.profile_picture,
            e.employee_code, e.designation,
            d.name AS department_name
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE ur.role = 'reviewer' AND u.status = 'active'
        ORDER BY u.name ASC
    ";
    $rev_stmt = $db->query($rev_query);
    $reviewers = $rev_stmt->fetchAll(PDO::FETCH_ASSOC);

    $results = [];

    foreach ($reviewers as $rev) {
        $r_user_id = (int)$rev['id'];

        // Get employees under this reviewer
        $team_stmt = $db->prepare("
            SELECT e.id AS employee_id, e.user_id 
            FROM employees e 
            JOIN users u ON e.user_id = u.id 
            WHERE e.reporting_manager_id = :rid AND u.status = 'active'
        ");
        $team_stmt->execute([':rid' => $r_user_id]);
        $team_rows = $team_stmt->fetchAll(PDO::FETCH_ASSOC);

        $team_emp_ids = [];
        $team_user_ids = [];
        foreach ($team_rows as $tr) {
            $team_emp_ids[] = (int)$tr['employee_id'];
            $team_user_ids[] = (int)$tr['user_id'];
        }

        $team_count = count($team_emp_ids);

        // Stats initialization
        $stats = [
            'total_received' => 0,
            'completed' => 0,
            'in_review' => 0,
            'rejected' => 0,
            'today_received' => 0,
            'today_reviewed' => 0,
            'market_uploads' => 0,
        ];

        if (!empty($team_emp_ids)) {
            $emp_in = implode(',', $team_emp_ids);

            // Total Task counts for team
            $t_stmt = $db->query("
                SELECT 
                    SUM(status = 'In Review') as in_review_count,
                    SUM(status = 'Completed') as completed_count,
                    SUM(status = 'Rejected') as rejected_count
                FROM tasks
                WHERE assigned_to IN ($emp_in)
            ");
            $t_row = $t_stmt->fetch(PDO::FETCH_ASSOC);

            $stats['in_review'] = (int)($t_row['in_review_count'] ?? 0);
            $stats['completed'] = (int)($t_row['completed_count'] ?? 0);
            $stats['rejected']  = (int)($t_row['rejected_count'] ?? 0);
            $stats['total_received'] = $stats['completed'] + $stats['rejected'] + $stats['in_review'];

            // Today's Received & Reviewed
            $today_stmt = $db->prepare("
                SELECT 
                    SUM(IF(DATE(tl.created_at) = :today AND tl.status_to = 'In Review', 1, 0)) as today_rec,
                    SUM(IF(DATE(tl.created_at) = :today2 AND tl.status_to IN ('Completed', 'Rejected'), 1, 0)) as today_rev
                FROM task_logs tl
                JOIN tasks t ON tl.task_id = t.id
                WHERE t.assigned_to IN ($emp_in)
            ");
            $today_stmt->execute([
                ':today'  => $today,
                ':today2' => $today
            ]);
            $today_row = $today_stmt->fetch(PDO::FETCH_ASSOC);
            $stats['today_received'] = (int)($today_row['today_rec'] ?? 0);
            $stats['today_reviewed'] = (int)($today_row['today_rev'] ?? 0);
        }

        // Marketplace Uploads count added by reviewer or for their team
        try {
            $m_stmt = $db->prepare("
                SELECT COUNT(*) as market_count
                FROM task_marketplace_submissions tms
                LEFT JOIN tasks t ON tms.task_id = t.id
                LEFT JOIN employees e ON t.assigned_to = e.id
                WHERE tms.added_by = :rid1
                   OR tms.user_id = :rid2
                   OR (e.reporting_manager_id = :rid3)
            ");
            $m_stmt->execute([
                ':rid1' => $r_user_id,
                ':rid2' => $r_user_id,
                ':rid3' => $r_user_id
            ]);
            $stats['market_uploads'] = (int)($m_stmt->fetch(PDO::FETCH_ASSOC)['market_count'] ?? 0);
        } catch (Throwable $e) {
            $stats['market_uploads'] = 0;
        }

        $results[] = [
            'id'              => $r_user_id,
            'name'            => $rev['name'],
            'profile_picture' => $rev['profile_picture'],
            'designation'     => $rev['designation'] ?: 'Senior Reviewer',
            'department_name' => $rev['department_name'] ?: 'QA & Review',
            'team_size'       => $team_count,
            'stats'           => $stats
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data'   => $results
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
