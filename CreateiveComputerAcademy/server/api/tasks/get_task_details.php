<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$taskId = isset($_GET['task_id']) ? intval($_GET['task_id']) : (isset($_GET['id']) ? intval($_GET['id']) : null);

if (!$taskId) {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!empty($input['task_id'])) $taskId = intval($input['task_id']);
    else if (!empty($input['id'])) $taskId = intval($input['id']);
}

if (!$taskId) {
    echo json_encode(["status" => "error", "message" => "task_id is required."]);
    exit;
}

try {
    $query = "
        SELECT 
            t.id AS task_id,
            t.id,
            t.title,
            t.description,
            t.status,
            COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') AS category,
            t.category_id,
            t.subcategory_id,
            t.child_category_id,
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
            t.updated_at,
            t.assign_date,
            (SELECT created_at FROM task_logs WHERE task_id = t.id AND status_to = 'In Progress' ORDER BY id DESC LIMIT 1) AS in_progress_at,
            NOW() AS server_now,
            t.reviewed_by,
            t.reviewed_at,
            t.custom_credit,
            tc_child.credit AS child_credit,
            tc_sub.credit AS sub_credit,
            tc_main.credit AS main_credit,
            (SELECT name FROM users WHERE id = t.reviewed_by) AS reviewed_by_name,
            tfd.final_file_url,
            tfd.final_image_url,
            tfd.fix_notes,
            tfd.is_stock_ready,
            tfd.source_type AS delivery_source_type,
            u.id AS user_id,
            u.name AS staff_name,
            u.email AS staff_email,
            u.profile_picture AS staff_avatar,
            d.name AS department_name,
            tr.rating,
            tr.feedback_notes,
            tr.feedback_notes AS review_feedback,
            tr.tags,
            tr.tags AS review_tags,
            tr.rating_quality,
            tr.rating_speed,
            tr.rating_creativity
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to = e.id
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
        LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
        LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
        LEFT JOIN task_final_deliveries tfd ON t.id = tfd.task_id
        LEFT JOIN task_reviews tr ON t.id = tr.task_id
        WHERE t.id = :task_id
        LIMIT 1
    ";

    $stmt = $db->prepare($query);
    $stmt->execute([':task_id' => $taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo json_encode(["status" => "error", "message" => "Task not found."]);
        exit;
    }

    // Calculate effective reward credit
    if (isset($task['custom_credit']) && $task['custom_credit'] !== null && intval($task['custom_credit']) > 0) {
        $task['category_credit'] = intval($task['custom_credit']);
        $task['is_custom_credit'] = true;
    } elseif (!empty($task['child_credit']) && intval($task['child_credit']) > 0) {
        $task['category_credit'] = intval($task['child_credit']);
        $task['is_custom_credit'] = false;
    } elseif (!empty($task['sub_credit']) && intval($task['sub_credit']) > 0) {
        $task['category_credit'] = intval($task['sub_credit']);
        $task['is_custom_credit'] = false;
    } elseif (!empty($task['main_credit']) && intval($task['main_credit']) > 0) {
        $task['category_credit'] = intval($task['main_credit']);
        $task['is_custom_credit'] = false;
    } else {
        $task['category_credit'] = 5;
        $task['is_custom_credit'] = false;
    }
    $task['credit'] = $task['category_credit'];

    if (!empty($task['checklists']) && is_string($task['checklists'])) {
        $task['checklists'] = json_decode($task['checklists'], true);
    } else {
        $task['checklists'] = [];
    }

    $raw_tags = $task['tags'] ?? $task['review_tags'] ?? null;
    if (!empty($raw_tags) && is_string($raw_tags)) {
        $task['tags'] = json_decode($raw_tags, true);
        $task['review_tags'] = $task['tags'];
    } else {
        $task['tags'] = is_array($raw_tags) ? $raw_tags : [];
        $task['review_tags'] = $task['tags'];
    }

    // Fetch blueprint variants
    try {
        $bv_stmt = $db->prepare("SELECT id, variant_name, ai_model_used, is_active, blueprint_json, created_at FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY is_active DESC, id ASC");
        $bv_stmt->execute([':task_id' => $taskId]);
        $b_variants = $bv_stmt->fetchAll(PDO::FETCH_ASSOC);
        $task['blueprint_variants'] = array_map(function($bv) {
            if (!empty($bv['blueprint_json']) && is_string($bv['blueprint_json'])) {
                $bv['blueprint_json'] = json_decode($bv['blueprint_json'], true);
            }
            return $bv;
        }, $b_variants);
    } catch (Exception $e) {
        $task['blueprint_variants'] = [];
    }

    // Fetch submissions / file attachments
    try {
        $sub_stmt = $db->prepare("
            SELECT id, file_name, file_url, file_size, file_type, mime_type, is_image, is_video, created_at 
            FROM task_submissions 
            WHERE task_id = :task_id 
            ORDER BY id ASC
        ");
        $sub_stmt->execute([':task_id' => $taskId]);
        $task['submissions'] = $sub_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $task['submissions'] = [];
    }

    // Fetch task logs / history
    try {
        $logs_stmt = $db->prepare("
            SELECT tl.id, tl.task_id, tl.status_from, tl.status_to, tl.changed_by, tl.created_at, u.name AS changed_by_name
            FROM task_logs tl
            LEFT JOIN users u ON tl.changed_by = u.id
            WHERE tl.task_id = :task_id
            ORDER BY tl.id DESC
        ");
        $logs_stmt->execute([':task_id' => $taskId]);
        $task['logs'] = $logs_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $task['logs'] = [];
    }

    // Fetch rejection comments / history if any
    try {
        $rejc_stmt = $db->prepare("
            SELECT tc.id, tc.comment, tc.created_at, u.name as reviewer_name 
            FROM task_comments tc 
            LEFT JOIN users u ON tc.user_id = u.id 
            WHERE tc.task_id = :task_id 
            ORDER BY tc.id DESC
        ");
        $rejc_stmt->execute([':task_id' => $taskId]);
        $task['comments'] = $rejc_stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $task['comments'] = [];
    }

    echo json_encode([
        "status" => "success",
        "task" => $task,
        "data" => $task
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
