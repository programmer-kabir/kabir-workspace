<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));
$user_id = isset($data->user_id) ? (int)$data->user_id : (isset($_GET['user_id']) ? (int)$_GET['user_id'] : null);
$filter_date = isset($data->date) ? trim($data->date) : (isset($_GET['date']) ? trim($_GET['date']) : null);
$filter_month = isset($data->month) ? trim($data->month) : (isset($_GET['month']) ? trim($_GET['month']) : null);
$filter_type = isset($data->break_type) ? trim($data->break_type) : (isset($_GET['break_type']) ? trim($_GET['break_type']) : null);
$filter_status = isset($data->status) ? trim($data->status) : (isset($_GET['status']) ? trim($_GET['status']) : null);

try {
    $where = ["1=1"];
    $params = [];

    if ($user_id) {
        $where[] = "eb.user_id = :user_id";
        $params[':user_id'] = $user_id;
    }

    if ($filter_date) {
        $where[] = "eb.date = :date";
        $params[':date'] = $filter_date;
    }

    if ($filter_month) {
        // e.g. "2026-09"
        $where[] = "DATE_FORMAT(eb.date, '%Y-%m') = :month";
        $params[':month'] = $filter_month;
    }

    if ($filter_type && $filter_type !== 'all') {
        $where[] = "eb.break_type = :break_type";
        $params[':break_type'] = $filter_type;
    }

    if ($filter_status && $filter_status !== 'all') {
        $where[] = "eb.status = :status";
        $params[':status'] = $filter_status;
    }

    $whereSql = implode(" AND ", $where);

    $query = "SELECT eb.*, 
                     u.name as user_name, 
                     u.profile_picture as user_avatar,
                     e.employee_code,
                     u_adm.name as approved_by_name
              FROM employee_breaks eb
              LEFT JOIN users u ON eb.user_id = u.id
              LEFT JOIN employees e ON u.id = e.user_id
              LEFT JOIN users u_adm ON eb.approved_by = u_adm.id
              WHERE {$whereSql}
              ORDER BY eb.date DESC, eb.id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $breaks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Summary calculations
    $total_breaks = count($breaks);
    $total_minutes = 0;
    $today_minutes = 0;
    $today_date = date('Y-m-d');

    foreach ($breaks as $b) {
        $mins = (int)($b['duration_minutes'] ?? 0);
        if ($b['status'] === 'Completed') {
            $total_minutes += $mins;
            if ($b['date'] === $today_date) {
                $today_minutes += $mins;
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "breaks" => $breaks,
            "summary" => [
                "total_breaks" => $total_breaks,
                "total_minutes" => $total_minutes,
                "today_minutes" => $today_minutes,
                "server_date" => $today_date
            ]
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
