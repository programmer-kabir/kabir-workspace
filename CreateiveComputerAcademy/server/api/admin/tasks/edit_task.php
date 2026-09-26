<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->task_id) || !isset($data->title)) {
    echo json_encode(["status" => "error", "message" => "Task ID and Title are required."]);
    exit;
}

try {
    $stmt_old = $db->prepare("SELECT assigned_to, creation_mode, department_id FROM tasks WHERE id = :id");
    $stmt_old->execute([':id' => $data->task_id]);
    $old_task = $stmt_old->fetch(PDO::FETCH_ASSOC);
    $old_employee_id = $old_task['assigned_to'] ?? null;
    $old_creation_mode = $old_task['creation_mode'] ?? 'manual';
    $old_dept_id = $old_task['department_id'] ?? null;

    // If assigned_to (user_id) is provided, look up the employee id and department
    $employee_id = null;
    $emp_dept_id = null;
    if (isset($data->assigned_to) && !empty($data->assigned_to) && $data->assigned_to !== 'unassigned') {
        $stmt_emp = $db->prepare("SELECT id, department_id FROM employees WHERE user_id = :user_id LIMIT 1");
        $stmt_emp->execute([':user_id' => $data->assigned_to]);
        $emp_row = $stmt_emp->fetch(PDO::FETCH_ASSOC);

        if (!$emp_row) {
            echo json_encode(["status" => "error", "message" => "The selected staff member does not have an employee profile."]);
            exit;
        }
        $employee_id = (int)$emp_row['id'];
        $emp_dept_id = !empty($emp_row['department_id']) ? (int)$emp_row['department_id'] : null;
    }

    $title       = $data->title;
    $description = isset($data->description) ? $data->description : null;
    $task_id     = (int)$data->task_id;
    $assign_date = !empty($data->assign_date) ? $data->assign_date : null;

    // Category hierarchy fields
    $category_id       = !empty($data->category_id) ? (int)$data->category_id : null;
    $subcategory_id    = !empty($data->subcategory_id) ? (int)$data->subcategory_id : null;
    $child_category_id = !empty($data->child_category_id) ? (int)$data->child_category_id : null;
    $custom_credit     = (isset($data->custom_credit) && trim((string)$data->custom_credit) !== '' && intval($data->custom_credit) > 0) ? intval($data->custom_credit) : null;
    $category_name_log = !empty($data->category) ? trim($data->category) : 'General';

    // Intelligent department_id resolution
    $department_id = (!empty($data->department_id) && $data->department_id !== 'null') ? (int)$data->department_id : null;

    if (!$department_id && $emp_dept_id) {
        $department_id = $emp_dept_id;
    }

    if (!$department_id && !empty($category_id)) {
        try {
            $stmt_cat_dept = $db->prepare("SELECT department_id FROM task_categories WHERE id = :cid LIMIT 1");
            $stmt_cat_dept->execute([':cid' => $category_id]);
            $cat_dept = $stmt_cat_dept->fetchColumn();
            if ($cat_dept) {
                $department_id = (int)$cat_dept;
            }
        } catch (\Throwable $th) {}
    }

    if (!$department_id && $old_dept_id) {
        $department_id = (int)$old_dept_id;
    }

    // ref_links
    $raw_links = isset($data->ref_links) ? $data->ref_links : null;
    if (is_array($raw_links)) {
        $ref_links = json_encode(array_values(array_filter($raw_links)));
    } elseif (is_string($raw_links) && !empty(trim($raw_links))) {
        $ref_links = $raw_links;
    } else {
        $ref_links = json_encode([]);
    }

    // ref_image
    $raw_images = isset($data->ref_image) ? $data->ref_image : null;
    if (is_array($raw_images)) {
        $ref_image = json_encode(array_values(array_filter($raw_images)));
    } elseif (is_string($raw_images) && !empty(trim($raw_images))) {
        $ref_image = $raw_images;
    } else {
        $ref_image = json_encode([]);
    }

    // visual_image
    $raw_visual = isset($data->visual_image) ? $data->visual_image : null;
    if (is_array($raw_visual)) {
        $visual_image = json_encode(array_values(array_filter($raw_visual)));
    } elseif (is_string($raw_visual) && !empty(trim($raw_visual))) {
        $visual_image = $raw_visual;
    } else {
        $visual_image = json_encode([]);
    }

    $deadline      = (!empty($data->deadline) && $data->deadline !== '') ? $data->deadline : null;
    $deadline_time = (!empty($data->deadline_time) && $data->deadline_time !== '') ? $data->deadline_time : null;

    // Extract admin name safely
    $updated_by_name = 'Admin';
    try {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (isset($headers['Authorization']) || isset($headers['authorization'])) {
            $authHeader = $headers['Authorization'] ?? $headers['authorization'];
            $token = str_replace('Bearer ', '', $authHeader);
            $token_parts = explode('.', $token);
            if (count($token_parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $token_parts[1])), true);
                if (!empty($payload['data']['name'])) {
                    $updated_by_name = $payload['data']['name'];
                }
            }
        }
    } catch (\Throwable $e) {}

    // Auto-ensure columns exist in tasks table
    try {
        if (file_exists(__DIR__ . '/../../categories/category_helper.php')) {
            require_once __DIR__ . '/../../categories/category_helper.php';
            ensureCategoryTableExists($db);
        }
        
        $needed_columns = [
            'category_id'       => "ALTER TABLE `tasks` ADD COLUMN `category_id` INT NULL",
            'subcategory_id'    => "ALTER TABLE `tasks` ADD COLUMN `subcategory_id` INT NULL",
            'child_category_id' => "ALTER TABLE `tasks` ADD COLUMN `child_category_id` INT NULL",
            'custom_credit'     => "ALTER TABLE `tasks` ADD COLUMN `custom_credit` INT NULL DEFAULT NULL",
            'creation_mode'     => "ALTER TABLE `tasks` ADD COLUMN `creation_mode` ENUM('manual', 'agentic') DEFAULT 'manual'"
        ];

        foreach ($needed_columns as $col => $sql) {
            try {
                $chk = $db->query("SHOW COLUMNS FROM `tasks` LIKE '$col'")->fetch();
                if (!$chk) {
                    $db->exec($sql);
                }
            } catch (\Throwable $th) {}
        }
    } catch (\Throwable $e) {}

    // An agentic task must ALWAYS stay agentic
    if ($old_creation_mode === 'agentic' || (!empty($data->creation_mode) && $data->creation_mode === 'agentic') || !empty($data->blueprint_variants) || !empty($data->blueprint_data)) {
        $creation_mode = 'agentic';
    } else {
        $creation_mode = !empty($data->creation_mode) ? $data->creation_mode : 'manual';
    }

    $priority = $data->priority ?? 'Medium';
    $checklists_val = isset($data->checklists) ? (is_string($data->checklists) ? $data->checklists : json_encode($data->checklists, JSON_UNESCAPED_UNICODE)) : null;

    $submission_link = isset($data->submission_link) ? trim($data->submission_link) : null;

    if ($employee_id) {
        $query = "UPDATE tasks 
                  SET title = :title, description = :description, priority = :priority, checklists = :checklists, ref_links = :ref_links, ref_image = :ref_image, visual_image = :visual_image,
                      creation_mode = :creation_mode,
                      category_id = :category_id, subcategory_id = :subcategory_id, child_category_id = :child_category_id, custom_credit = :custom_credit, department_id = :department_id, assigned_to = :assigned_to,
                      status = IF(status = 'Unassigned', 'To-Do', status),
                      assign_date = COALESCE(:assign_date, assign_date),
                      deadline = :deadline, deadline_time = :deadline_time,
                      submission_link = :submission_link,
                      updated_at = NOW()
                  WHERE id = :task_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':assigned_to',     $employee_id);
    } else {
        $query = "UPDATE tasks 
                  SET title = :title, description = :description, priority = :priority, checklists = :checklists, ref_links = :ref_links, ref_image = :ref_image, visual_image = :visual_image,
                      creation_mode = :creation_mode,
                      category_id = :category_id, subcategory_id = :subcategory_id, child_category_id = :child_category_id, custom_credit = :custom_credit, department_id = :department_id,
                      assign_date = COALESCE(:assign_date, assign_date),
                      deadline = :deadline, deadline_time = :deadline_time,
                      submission_link = :submission_link,
                      updated_at = NOW()
                  WHERE id = :task_id";
        $stmt = $db->prepare($query);
    }

    $stmt->bindParam(':title',             $title);
    $stmt->bindParam(':description',       $description);
    $stmt->bindParam(':priority',          $priority);
    $stmt->bindParam(':checklists',        $checklists_val);
    $stmt->bindParam(':ref_links',         $ref_links);
    $stmt->bindParam(':ref_image',         $ref_image);
    $stmt->bindParam(':visual_image',      $visual_image);
    $stmt->bindParam(':creation_mode',     $creation_mode);
    $stmt->bindParam(':category_id',       $category_id);
    $stmt->bindParam(':subcategory_id',    $subcategory_id);
    $stmt->bindParam(':child_category_id', $child_category_id);
    $stmt->bindParam(':custom_credit',     $custom_credit);
    $stmt->bindParam(':department_id',     $department_id);
    $stmt->bindParam(':assign_date',       $assign_date);
    $stmt->bindParam(':deadline',          $deadline);
    $stmt->bindParam(':deadline_time',     $deadline_time);
    $stmt->bindParam(':submission_link',   $submission_link);
    $stmt->bindParam(':task_id',           $task_id);

    if ($stmt->execute()) {
        // Sync blueprint variants if provided in edit request
        if (isset($data->blueprint_variants) || isset($data->blueprint_data)) {
            try {
                $raw_variants = isset($data->blueprint_variants) ? $data->blueprint_variants : [];
                $variants = json_decode(json_encode($raw_variants), true);
                if (!is_array($variants)) $variants = [];

                $blueprint_data_val = isset($data->blueprint_data) ? (is_string($data->blueprint_data) ? $data->blueprint_data : json_encode($data->blueprint_data)) : null;

                $hasAnyValidBlueprint = false;
                foreach ($variants as $v) {
                    if (is_array($v) && (!empty($v['blueprint_data']) || !empty($v['blueprint_json']))) {
                        $hasAnyValidBlueprint = true;
                        break;
                    }
                }

                if (!$hasAnyValidBlueprint && !empty($blueprint_data_val)) {
                    $parsed_b = json_decode($blueprint_data_val, true);
                    $model_used = $parsed_b['model_used'] ?? 'meta-llama/llama-3.3-70b-instruct:free';
                    $variants = [
                        [
                            'variant_name' => 'Variant 1',
                            'ai_model_used' => $model_used,
                            'is_active' => 1,
                            'blueprint_json' => $blueprint_data_val
                        ]
                    ];
                }

                if (is_array($variants) && count($variants) > 0) {
                    $db->prepare("DELETE FROM task_blueprint_variants WHERE task_id = :task_id")->execute([':task_id' => $task_id]);
                    
                    $ins_var = $db->prepare("INSERT INTO task_blueprint_variants (task_id, variant_name, ai_model_used, is_active, blueprint_json) 
                        VALUES (:task_id, :variant_name, :ai_model_used, :is_active, :blueprint_json)");
                    
                    $hasActive = false;
                    foreach ($variants as $v) {
                        if (is_array($v) && !empty($v['is_active'])) { $hasActive = true; break; }
                    }

                    foreach ($variants as $idx => $v) {
                        if (!is_array($v)) continue;
                        $v_name = !empty($v['variant_name']) ? trim($v['variant_name']) : ('Variant ' . ($idx + 1));
                        $v_model = !empty($v['ai_model_used']) ? trim($v['ai_model_used']) : null;
                        $v_active = (!empty($v['is_active']) || (!$hasActive && $idx === 0)) ? 1 : 0;
                        $raw_b = $v['blueprint_data'] ?? $v['blueprint_json'] ?? null;
                        $v_json = is_array($raw_b) ? json_encode($raw_b) : (is_string($raw_b) ? $raw_b : null);

                        if (!empty($v_json) && $v_json !== 'null' && $v_json !== '""') {
                            $ins_var->execute([
                                ':task_id' => $task_id,
                                ':variant_name' => $v_name,
                                ':ai_model_used' => $v_model,
                                ':is_active' => $v_active,
                                ':blueprint_json' => $v_json
                            ]);
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        try {
            if (file_exists(__DIR__ . '/../../tasks/task_history_helper.php')) {
                require_once __DIR__ . '/../../tasks/task_history_helper.php';
                $logger = new TaskHistoryLogger($db);
                $logger->logHistory($task_id, "Task Updated", $updated_by_name);
            }
        } catch (\Throwable $e) {}

        if (isset($data->assigned_to) && !empty($data->assigned_to) && $data->assigned_to !== 'unassigned') {
            try {
                if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $data->assigned_to,
                        null,
                        "Task Updated: " . $title,
                        "The task '{$title}' assigned to you has been updated by Admin.",
                        "task_updated",
                        "staff",
                        "/tasks",
                        "normal",
                        ["task_id" => $task_id]
                    );
                }
            } catch (\Throwable $e) {}

            // Send Email only if assigned to a NEW person
            if ($employee_id && $old_employee_id !== $employee_id) {
                try {
                    if (file_exists(__DIR__ . '/../../emails/EmailHelper.php')) {
                        require_once __DIR__ . '/../../emails/EmailHelper.php';
                        $stmt_user = $db->prepare("SELECT name, email FROM users WHERE id = :id LIMIT 1");
                        $stmt_user->execute([':id' => $data->assigned_to]);
                        $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);

                        if ($user_data && !empty($user_data['email'])) {
                            $stmt_tpl = $db->prepare("SELECT subject, body FROM email_templates WHERE event_name = 'task_assigned'");
                            $stmt_tpl->execute();
                            if ($tpl = $stmt_tpl->fetch(PDO::FETCH_ASSOC)) {
                                $subject = str_replace('{{task_title}}', $title ?? 'Task', $tpl['subject']);
                                $body = $tpl['body'];
                                $body = str_replace('{{staff_name}}', $user_data['name'], $body);
                                $body = str_replace('{{task_title}}', $title ?? 'Task', $body);
                                $body = str_replace('{{task_category}}', $category_name_log, $body);
                                
                                $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $task_id;
                                $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                                
                                EmailHelper::sendEmail($user_data['email'], $user_data['name'], $subject, $htmlBody);
                            }
                        }
                    }
                } catch (\Throwable $e) {}
            }
        }

        echo json_encode(["status" => "success", "message" => "Task updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update task."]);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>