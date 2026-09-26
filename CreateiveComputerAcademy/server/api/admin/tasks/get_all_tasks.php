<?php
// Enable output buffering with compression if available
if (!ob_start("ob_gzhandler")) {
    ob_start();
}

require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Fetch main task list with assigned user details and category names
    $query = "
        SELECT 
            t.*,
            COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') as category_name,
            tc_main.name as main_category_name,
            tc_sub.name as sub_category_name,
            tc_child.name as child_category_name,
            tc_child.credit as child_credit,
            tc_sub.credit as sub_credit,
            tc_main.credit as main_credit,
            u.name as assigned_to_name,
            u.profile_picture as assigned_to_avatar
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to = e.id
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
        LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
        LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
        ORDER BY FIELD(t.status, 'In Review', 'In Progress', 'To-Do', 'Completed'), COALESCE(t.assign_date, t.created_at) DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($tasks)) {
        // Collect all task IDs for batch fetching
        $task_ids = array_column($tasks, 'id');
        $in_placeholders = implode(',', array_fill(0, count($task_ids), '?'));

        // 2. Batch fetch all submissions in 1 single query
        $subs_by_task = [];
        try {
            $sub_stmt = $db->prepare("SELECT * FROM task_submissions WHERE task_id IN ($in_placeholders) ORDER BY id ASC");
            $sub_stmt->execute($task_ids);
            while ($sub = $sub_stmt->fetch(PDO::FETCH_ASSOC)) {
                $subs_by_task[$sub['task_id']][] = $sub;
            }
        } catch (Exception $ex) {}

        // 3. Batch fetch all final deliveries in 1 single query
        $del_by_task = [];
        try {
            $del_stmt = $db->prepare("
                SELECT tfd.*, u.name as reviewer_name 
                FROM task_final_deliveries tfd 
                LEFT JOIN users u ON tfd.reviewer_id = u.id 
                WHERE tfd.task_id IN ($in_placeholders)
            ");
            $del_stmt->execute($task_ids);
            while ($del = $del_stmt->fetch(PDO::FETCH_ASSOC)) {
                $del_by_task[$del['task_id']] = $del;
            }
        } catch (Exception $ex) {}

        // 4. Batch fetch all blueprint variants in 1 single query
        $bv_by_task = [];
        try {
            $bv_stmt = $db->prepare("
                SELECT id, task_id, variant_name, ai_model_used, is_active, blueprint_json, created_at 
                FROM task_blueprint_variants 
                WHERE task_id IN ($in_placeholders) 
                ORDER BY is_active DESC, id ASC
            ");
            $bv_stmt->execute($task_ids);
            while ($bv = $bv_stmt->fetch(PDO::FETCH_ASSOC)) {
                $bv['blueprint_data'] = !empty($bv['blueprint_json']) ? json_decode($bv['blueprint_json'], true) : null;
                $bv['is_active'] = (int)$bv['is_active'] === 1;
                $bv_by_task[$bv['task_id']][] = $bv;
            }
        } catch (Exception $ex) {}

        // 5. Batch fetch all reviews/ratings in 1 single query
        $rev_by_task = [];
        try {
            $tr_stmt = $db->prepare("
                SELECT tr.task_id, tr.rating, tr.feedback_notes, tr.tags, tr.created_at as reviewed_at, u.name as reviewer_name 
                FROM task_reviews tr 
                LEFT JOIN users u ON tr.reviewer_id = u.id 
                WHERE tr.task_id IN ($in_placeholders)
            ");
            $tr_stmt->execute($task_ids);
            while ($rev = $tr_stmt->fetch(PDO::FETCH_ASSOC)) {
                $rev['tags'] = !empty($rev['tags']) && is_string($rev['tags']) ? json_decode($rev['tags'], true) : [];
                $rev_by_task[$rev['task_id']] = $rev;
            }
        } catch (Exception $ex) {}

        // 6. Fast O(1) in-memory stitching
        foreach ($tasks as &$row) {
            $t_id = $row['id'];
            $row['submissions'] = $subs_by_task[$t_id] ?? [];
            $row['final_delivery'] = $del_by_task[$t_id] ?? null;
            $row['blueprint_variants'] = $bv_by_task[$t_id] ?? [];
            $row['review'] = $rev_by_task[$t_id] ?? null;

            // Calculate effective reward credit
            if (isset($row['custom_credit']) && $row['custom_credit'] !== null && intval($row['custom_credit']) > 0) {
                $row['reward_credit'] = intval($row['custom_credit']);
                $row['is_custom_credit'] = true;
            } elseif (!empty($row['child_credit']) && intval($row['child_credit']) > 0) {
                $row['reward_credit'] = intval($row['child_credit']);
                $row['is_custom_credit'] = false;
            } elseif (!empty($row['sub_credit']) && intval($row['sub_credit']) > 0) {
                $row['reward_credit'] = intval($row['sub_credit']);
                $row['is_custom_credit'] = false;
            } elseif (!empty($row['main_credit']) && intval($row['main_credit']) > 0) {
                $row['reward_credit'] = intval($row['main_credit']);
                $row['is_custom_credit'] = false;
            } else {
                $row['reward_credit'] = 5;
                $row['is_custom_credit'] = false;
            }

            if (empty($row['category'])) {
                $row['category'] = $row['category_name'] ?? '';
            }

            // Decode Checklists
            if (!empty($row['checklists']) && is_string($row['checklists'])) {
                $row['checklists'] = json_decode($row['checklists'], true);
            } else {
                $row['checklists'] = is_array($row['checklists']) ? $row['checklists'] : [];
            }

            // Decode blueprint_data
            if (!empty($row['blueprint_data'])) {
                $row['blueprint_data'] = is_string($row['blueprint_data']) ? json_decode($row['blueprint_data'], true) : $row['blueprint_data'];
            } else {
                $row['blueprint_data'] = null;
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $tasks
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
