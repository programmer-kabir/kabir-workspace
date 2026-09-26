<?php
require_once '../../config/cors.php';
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

// Pagination params
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(200, intval($_GET['limit']))) : 50;
$offset = ($page - 1) * $limit;

// Filter params
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$staff_name = isset($_GET['staff_name']) ? trim($_GET['staff_name']) : '';
$selected_date = isset($_GET['date']) ? trim($_GET['date']) : '';
$sort_order = (isset($_GET['sort']) && strtolower($_GET['sort']) === 'oldest') ? 'ASC' : 'DESC';

try {
    // 1. Fetch all assigned staff under this reviewer for filter dropdown
    $staff_list = [];
    try {
        $staff_stmt = $db->prepare("
            SELECT DISTINCT u.name 
            FROM employees e 
            JOIN users u ON e.user_id = u.id 
            WHERE e.reporting_manager_id = :reviewer_user_id 
            ORDER BY u.name ASC
        ");
        $staff_stmt->execute([':reviewer_user_id' => $reviewer_user_id]);
        $staff_list = $staff_stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {}

    // 2. Build WHERE clauses
    $where_clauses = [
        "e.reporting_manager_id = :reviewer_user_id",
        "t.status = 'Rejected'"
    ];
    $params = [
        ':reviewer_user_id' => $reviewer_user_id
    ];

    if (!empty($search)) {
        $where_clauses[] = "(t.title LIKE :search OR t.description LIKE :search OR t.priority LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    if (!empty($staff_name)) {
        $where_clauses[] = "u.name = :staff_name";
        $params[':staff_name'] = $staff_name;
    }

    if (!empty($selected_date)) {
        $where_clauses[] = "(DATE(t.updated_at) = :selected_date OR DATE(t.reviewed_at) = :selected_date)";
        $params[':selected_date'] = $selected_date;
    }

    $where_sql = implode(' AND ', $where_clauses);

    // 3. Count total matching records for pagination
    $count_sql = "
        SELECT COUNT(DISTINCT t.id) AS total
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        WHERE {$where_sql}
    ";
    $count_stmt = $db->prepare($count_sql);
    foreach ($params as $k => $v) {
        $count_stmt->bindValue($k, $v);
    }
    $count_stmt->execute();
    $total_records = (int)$count_stmt->fetchColumn();
    $total_pages = ceil($total_records / $limit);

    // 4. Query paginated tasks
    $query = "
        SELECT 
            t.id AS task_id,
            t.title,
            t.description,
            COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') AS category,
            t.is_self_created,
            t.priority,
            t.deadline,
            t.checklists,
            t.ref_image,
            t.visual_image,
            t.ref_links,
            t.submission_link,
            t.submitted_at,
            t.total_time_spent,
            t.created_at,
            t.assign_date,
            t.updated_at AS rejected_at,
            t.reviewed_by,
            t.reviewed_at,
            t.rejection_reason,
            t.custom_credit,
            tc_child.credit AS child_credit,
            tc_sub.credit AS sub_credit,
            tc_main.credit AS main_credit,
            (SELECT name FROM users WHERE id = t.reviewed_by) AS reviewed_by_name,
            u.id AS user_id,
            u.name AS staff_name,
            u.profile_picture AS staff_avatar,
            d.name AS department_name
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
        LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
        LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
        WHERE {$where_sql}
        ORDER BY t.updated_at {$sort_order}
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $db->prepare($query);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    $stmt->execute();

    $rejected_tasks = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Calculate effective reward credit
        if (isset($row['custom_credit']) && $row['custom_credit'] !== null && intval($row['custom_credit']) > 0) {
            $row['category_credit'] = intval($row['custom_credit']);
            $row['is_custom_credit'] = true;
        } elseif (!empty($row['child_credit']) && intval($row['child_credit']) > 0) {
            $row['category_credit'] = intval($row['child_credit']);
            $row['is_custom_credit'] = false;
        } elseif (!empty($row['sub_credit']) && intval($row['sub_credit']) > 0) {
            $row['category_credit'] = intval($row['sub_credit']);
            $row['is_custom_credit'] = false;
        } elseif (!empty($row['main_credit']) && intval($row['main_credit']) > 0) {
            $row['category_credit'] = intval($row['main_credit']);
            $row['is_custom_credit'] = false;
        } else {
            $row['category_credit'] = 5;
            $row['is_custom_credit'] = false;
        }
        $row['credit'] = $row['category_credit'];

        if (!empty($row['checklists']) && is_string($row['checklists'])) {
            $row['checklists'] = json_decode($row['checklists'], true);
        } else {
            $row['checklists'] = [];
        }

        // Fetch blueprint variants from task_blueprint_variants
        try {
            $bv_stmt = $db->prepare("SELECT id, variant_name, ai_model_used, is_active, blueprint_json, created_at FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY is_active DESC, id ASC");
            $bv_stmt->execute([':task_id' => $row['task_id']]);
            $b_variants = $bv_stmt->fetchAll(PDO::FETCH_ASSOC);
            $row['blueprint_variants'] = array_map(function($bv) {
                $bv['blueprint_data'] = !empty($bv['blueprint_json']) ? json_decode($bv['blueprint_json'], true) : null;
                $bv['is_active'] = (int)$bv['is_active'] === 1;
                return $bv;
            }, $b_variants);
        } catch (Exception $ex) {
            $row['blueprint_variants'] = [];
        }

        $rejected_tasks[] = $row;
    }

    if (!empty($rejected_tasks)) {
        $task_ids = array_column($rejected_tasks, 'task_id');
        $submissions_by_task = [];
        try {
            $in_ids = implode(',', array_map('intval', $task_ids));
            $sub_stmt = $db->query("SELECT * FROM task_submissions WHERE task_id IN ($in_ids) ORDER BY id ASC");
            if ($sub_stmt) {
                while ($sub = $sub_stmt->fetch(PDO::FETCH_ASSOC)) {
                    $submissions_by_task[$sub['task_id']][] = $sub;
                }
            }
        } catch (Exception $ex) {}

        foreach ($rejected_tasks as &$pt) {
            $pt['submissions'] = $submissions_by_task[$pt['task_id']] ?? [];
        }
    }

    $from_record = $total_records > 0 ? $offset + 1 : 0;
    $to_record = min($offset + $limit, $total_records);

    echo json_encode([
        "status" => "success",
        "pagination" => [
            "total" => $total_records,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => (int)$total_pages,
            "from" => $from_record,
            "to" => $to_record
        ],
        "staff_list" => $staff_list,
        "count"  => count($rejected_tasks),
        "data"   => $rejected_tasks
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
