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
if (!$reviewer_user_id) {
    $data = json_decode(file_get_contents("php://input"));
    if (isset($data->reviewer_user_id)) $reviewer_user_id = intval($data->reviewer_user_id);
}
if (!$reviewer_user_id) {
    echo json_encode(["status" => "error", "message" => "reviewer_user_id is required."]);
    exit;
}

try {
    // 1. Get all employee_ids under this reviewer
    $team_query = "
        SELECT e.id AS employee_id, e.user_id
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.reporting_manager_id = :reviewer_user_id AND u.status = 'active'
    ";
    $team_stmt = $db->prepare($team_query);
    $team_stmt->bindParam(':reviewer_user_id', $reviewer_user_id, PDO::PARAM_INT);
    $team_stmt->execute();

    $employee_ids = [];
    $user_ids     = [];
    while ($row = $team_stmt->fetch(PDO::FETCH_ASSOC)) {
        $employee_ids[] = $row['employee_id'];
        $user_ids[]     = $row['user_id'];
    }

    $team_count = count($employee_ids);

    if ($team_count === 0) {
        echo json_encode([
            "status"          => "success",
            "team_count"      => 0,
            "total_tasks"     => 0,
            "completed"       => 0,
            "in_review"       => 0,
            "in_progress"     => 0,
            "todo"            => 0,
            "rejected"        => 0,
            "completion_rate" => 0,
            "top_performer"   => null,
            "per_person"      => []
        ]);
        exit;
    }

    $emp_in = implode(',', $employee_ids);

    // Time filter logic
    $time_filter = isset($_GET['time_filter']) ? $_GET['time_filter'] : 'all_time';
    $time_condition = "";
    if ($time_filter === 'daily') {
        $time_condition = "AND DATE(created_at) = CURDATE()";
    } elseif ($time_filter === 'weekly') {
        $time_condition = "AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)";
    } elseif ($time_filter === 'monthly') {
        $time_condition = "AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
    }

    // 2. Task stats for the team based on time filter
    $task_query = "
        SELECT
            COUNT(*)                            AS total_tasks,
            SUM(status = 'Completed')           AS completed,
            SUM(status = 'In Review')           AS in_review,
            SUM(status = 'In Progress')         AS in_progress,
            SUM(status = 'To-Do')               AS todo
        FROM tasks
        WHERE assigned_to IN ($emp_in) $time_condition
    ";
    $task_stmt = $db->prepare($task_query);
    $task_stmt->execute();
    $totals = $task_stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Per-person task stats (this month)
    $month_start = date('Y-m-01') . ' 00:00:00';
    $month_end   = date('Y-m-t')  . ' 23:59:59';

    $per_person_query = "
        SELECT
            e.user_id,
            COUNT(t.id)                         AS total,
            SUM(t.status = 'Completed')         AS completed,
            SUM(t.status = 'In Review')         AS in_review,
            SUM(t.status = 'In Progress')       AS in_progress,
            SUM(t.status = 'To-Do')             AS todo
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        WHERE e.id IN ($emp_in)
          AND t.created_at BETWEEN :month_start AND :month_end
        GROUP BY e.user_id
    ";
    $pp_stmt = $db->prepare($per_person_query);
    $pp_stmt->bindParam(':month_start', $month_start);
    $pp_stmt->bindParam(':month_end',   $month_end);
    $pp_stmt->execute();

    $per_person = [];
    $top_performer = null;
    $top_rate = -1;

    while ($row = $pp_stmt->fetch(PDO::FETCH_ASSOC)) {
        $uid       = $row['user_id'];
        $total     = intval($row['total']);
        $done      = intval($row['completed']);
        $rate      = $total > 0 ? round(($done / $total) * 100) : 0;

        // Also get rejection count from task_logs for this period
        $rej_q = "
            SELECT COUNT(*) AS rejected
            FROM task_logs tl
            JOIN tasks t ON tl.task_id = t.id
            JOIN employees e ON t.assigned_to = e.id
            WHERE e.user_id = :uid
              AND tl.status_to = 'Rejected'
              AND tl.created_at BETWEEN :ms AND :me
        ";
        $rej_s = $db->prepare($rej_q);
        $rej_s->execute([':uid' => $uid, ':ms' => $month_start, ':me' => $month_end]);
        $rejected = intval($rej_s->fetch(PDO::FETCH_ASSOC)['rejected']);

        // Resubmitted count
        $res_q = "
            SELECT COUNT(*) AS resubmitted
            FROM task_logs tl
            JOIN tasks t ON tl.task_id = t.id
            JOIN employees e ON t.assigned_to = e.id
            WHERE e.user_id = :uid
              AND tl.status_from = 'Rejected' AND tl.status_to = 'In Progress'
              AND tl.created_at BETWEEN :ms AND :me
        ";
        $res_s = $db->prepare($res_q);
        $res_s->execute([':uid' => $uid, ':ms' => $month_start, ':me' => $month_end]);
        $resubmitted = intval($res_s->fetch(PDO::FETCH_ASSOC)['resubmitted']);

        // Average star rating from task_reviews for this period
        $rat_q = "
            SELECT AVG(tr.rating) AS avg_rating, COUNT(tr.id) AS rated_count
            FROM task_reviews tr
            JOIN tasks t ON tr.task_id = t.id
            JOIN employees e ON t.assigned_to = e.id
            WHERE e.user_id = :uid
              AND tr.created_at BETWEEN :ms AND :me
              AND tr.rating > 0
        ";
        $rat_s = $db->prepare($rat_q);
        $rat_s->execute([':uid' => $uid, ':ms' => $month_start, ':me' => $month_end]);
        $rat_row = $rat_s->fetch(PDO::FETCH_ASSOC);
        $avg_rating = ($rat_row && intval($rat_row['rated_count']) > 0) ? round(floatval($rat_row['avg_rating']), 1) : 5.0;
        $rated_count = ($rat_row) ? intval($rat_row['rated_count']) : 0;

        // Score: 50% Completion Rate + 50% Quality Star Rating (scaled to 100) - Rejection Penalty
        $comp_points = $rate * 0.50;
        $quality_points = ($avg_rating / 5.0) * 100 * 0.50;
        $rej_penalty = $total > 0 ? min(30, round(($rejected / $total) * 30)) : 0;
        $score = $total > 0 ? max(0, min(100, round($comp_points + $quality_points - $rej_penalty))) : 0;

        $per_person[] = [
            'user_id'     => $uid,
            'total'       => $total,
            'completed'   => $done,
            'in_review'   => intval($row['in_review']),
            'in_progress' => intval($row['in_progress']),
            'todo'        => intval($row['todo']),
            'rejected'    => $rejected,
            'resubmitted' => $resubmitted,
            'rate'        => $rate,
            'avg_rating'  => $avg_rating,
            'rated_count' => $rated_count,
            'score'       => $score,
        ];

        if ($score > $top_rate) {
            $top_rate = $score;
            $u_q = $db->prepare("SELECT name, profile_picture FROM users WHERE id = :uid LIMIT 1");
            $u_q->bindParam(':uid', $uid);
            $u_q->execute();
            $udata = $u_q->fetch(PDO::FETCH_ASSOC);
            $top_performer = [
                'user_id'         => $uid,
                'name'            => $udata['name'],
                'profile_picture' => $udata['profile_picture'],
                'score'           => $score,
                'completed'       => $done,
                'total'           => $total,
                'avg_rating'      => $avg_rating,
            ];
        }
    }

    $total_tasks     = intval($totals['total_tasks']);
    $completed_total = intval($totals['completed']);
    $completion_rate = $total_tasks > 0 ? round(($completed_total / $total_tasks) * 100) : 0;

    echo json_encode([
        "status"          => "success",
        "team_count"      => $team_count,
        "total_tasks"     => $total_tasks,
        "completed"       => $completed_total,
        "in_review"       => intval($totals['in_review']),
        "in_progress"     => intval($totals['in_progress']),
        "todo"            => intval($totals['todo']),
        "completion_rate" => $completion_rate,
        "top_performer"   => $top_performer,
        "per_person"      => $per_person,
        "month_start"     => $month_start,
        "month_end"       => $month_end
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
