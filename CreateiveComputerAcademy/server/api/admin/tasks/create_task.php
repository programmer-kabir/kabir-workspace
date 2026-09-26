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

if(!isset($data->title)) {
    echo json_encode(["status" => "error", "message" => "Task Title is required."]);
    exit;
}

try {
    // 1. Dynamically get a valid user ID for 'created_by'
    $stmt_user = $db->query("SELECT id FROM users LIMIT 1");
    $created_by = $stmt_user ? $stmt_user->fetchColumn() : null;

    if (!$created_by) {
        $db->exec("INSERT INTO users (name, email, password, status) VALUES ('System Admin', 'admin@admin.com', '123456', 'active')");
        $created_by = $db->lastInsertId();
    }

    // 2. assigned_to is optional for Unassigned Task Pool
    $employee_id = null;
    $emp_dept_id = null;
    $is_unassigned = true;
    
    if (isset($data->assigned_to) && $data->assigned_to !== '' && $data->assigned_to !== 'unassigned' && $data->assigned_to !== null) {
        $stmt_emp = $db->prepare("SELECT id, department_id FROM employees WHERE user_id = :user_id LIMIT 1");
        $stmt_emp->execute([':user_id' => $data->assigned_to]);
        $emp_row = $stmt_emp->fetch(PDO::FETCH_ASSOC);

        if (!$emp_row) {
            echo json_encode(["status" => "error", "message" => "The selected staff member does not have an employee profile."]);
            exit;
        }
        $employee_id = (int)$emp_row['id'];
        $emp_dept_id = !empty($emp_row['department_id']) ? (int)$emp_row['department_id'] : null;
        $is_unassigned = false;
    }

    // 3. Extract admin name safely without crashing on JWT
    $created_by_name = 'Admin';
    try {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (isset($headers['Authorization']) || isset($headers['authorization'])) {
            $authHeader = $headers['Authorization'] ?? $headers['authorization'];
            $token = str_replace('Bearer ', '', $authHeader);
            $token_parts = explode('.', $token);
            if (count($token_parts) === 3) {
                $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $token_parts[1])), true);
                if (!empty($payload['data']['name'])) {
                    $created_by_name = $payload['data']['name'];
                }
            }
        }
    } catch (\Throwable $e) {}

    $initial_status = $is_unassigned ? 'Unassigned' : 'To-Do';

    // 4. Auto-ensure columns exist in tasks and task_categories tables safely
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

    $creation_mode = !empty($data->creation_mode) ? $data->creation_mode : (!empty($data->blueprint_variants) || !empty($data->blueprint_data) ? 'agentic' : 'manual');

    // 5. Category hierarchy fields (category_id, subcategory_id, child_category_id)
    $category_id       = !empty($data->category_id) ? (int)$data->category_id : null;
    $subcategory_id    = !empty($data->subcategory_id) ? (int)$data->subcategory_id : null;
    $child_category_id = !empty($data->child_category_id) ? (int)$data->child_category_id : null;
    $custom_credit     = (isset($data->custom_credit) && trim((string)$data->custom_credit) !== '' && intval($data->custom_credit) > 0) ? intval($data->custom_credit) : null;
    $category_name_log = !empty($data->category) ? trim($data->category) : 'General';

    // 6. Intelligent department_id resolution
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

    $query = "INSERT INTO tasks (title, description, priority, checklists, ref_links, ref_image, visual_image, creation_mode, created_by, assigned_to, category_id, subcategory_id, child_category_id, custom_credit, department_id, status, assign_date, deadline, deadline_time, submission_link, created_at, updated_at) 
              VALUES (:title, :description, :priority, :checklists, :ref_links, :ref_image, :visual_image, :creation_mode, :created_by, :assigned_to, :category_id, :subcategory_id, :child_category_id, :custom_credit, :department_id, :status, :assign_date, :deadline, :deadline_time, :submission_link, NOW(), NOW())";
              
    $stmt = $db->prepare($query);

    // Form data fields
    $priority = $data->priority ?? 'Medium';
    
    // Checklists: ensure it's saved as JSON string
    $checklists_val = null;
    if (isset($data->checklists)) {
        $checklists_val = is_string($data->checklists) ? $data->checklists : json_encode($data->checklists, JSON_UNESCAPED_UNICODE);
    }

    // ref_links
    $raw_links = $data->ref_links ?? null;
    if (is_array($raw_links)) {
        $ref_links_val = json_encode(array_values(array_filter($raw_links)));
    } elseif (is_string($raw_links) && !empty(trim($raw_links))) {
        $ref_links_val = $raw_links;
    } else {
        $ref_links_val = json_encode([]);
    }

    // ref_image
    $raw_images = $data->ref_image ?? null;
    if (is_array($raw_images)) {
        $clean_images = array_values(array_filter($raw_images, function($img) {
            return is_string($img) && !empty(trim($img));
        }));
        $ref_image_val = json_encode($clean_images);
    } elseif (is_string($raw_images) && !empty(trim($raw_images))) {
        $ref_image_val = $raw_images;
    } else {
        $ref_image_val = json_encode([]);
    }

    // visual_image
    $raw_visual = $data->visual_image ?? null;
    if (is_array($raw_visual)) {
        $clean_visual = array_values(array_filter($raw_visual, function($img) {
            return is_string($img) && !empty(trim($img));
        }));
        $visual_image_val = json_encode($clean_visual);
    } elseif (is_string($raw_visual) && !empty(trim($raw_visual))) {
        $visual_image_val = $raw_visual;
    } else {
        $visual_image_val = json_encode([]);
    }

    $stmt->execute([
        ':title'             => $data->title,
        ':description'       => $data->description ?? null,
        ':priority'          => $priority,
        ':checklists'        => $checklists_val,
        ':ref_links'         => $ref_links_val,
        ':ref_image'         => $ref_image_val,
        ':visual_image'      => $visual_image_val,
        ':creation_mode'     => $creation_mode,
        ':created_by'        => $created_by,
        ':assigned_to'       => $employee_id,
        ':category_id'       => $category_id,
        ':subcategory_id'    => $subcategory_id,
        ':child_category_id' => $child_category_id,
        ':custom_credit'     => $custom_credit,
        ':department_id'     => $department_id,
        ':status'            => $initial_status,
        ':assign_date'       => !empty($data->assign_date) ? $data->assign_date : date('Y-m-d'),
        ':deadline'          => (!empty($data->deadline) && $data->deadline !== '') ? $data->deadline : null,
        ':deadline_time'     => (!empty($data->deadline_time) && $data->deadline_time !== '') ? $data->deadline_time : null,
        ':submission_link'   => !empty($data->submission_link) ? trim($data->submission_link) : null
    ]);

    $task_id = $db->lastInsertId();

    // 7. Insert blueprint variants if provided
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

        if (!empty($variants)) {
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

    // 8. Log history safely
    try {
        if (file_exists(__DIR__ . '/../../tasks/task_history_helper.php')) {
            require_once __DIR__ . '/../../tasks/task_history_helper.php';
            $logger = new TaskHistoryLogger($db);
            $log_msg = $is_unassigned ? ($creation_mode === 'agentic' ? "Agentic AI Task Created (Unassigned)" : "Task Created as Unassigned") : ($creation_mode === 'agentic' ? "Agentic AI Blueprint Task Created & Assigned" : "Task Created & Assigned");
            $logger->logHistory($task_id, $log_msg, $created_by_name);
        }
    } catch (\Throwable $e) {}

    // 9. Send notifications safely
    if (!$is_unassigned) {
        try {
            if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
                require_once __DIR__ . '/../../notifications/notification_helper.php';
                $priority_level = $data->priority ?? 'Normal';
                NotificationHelper::sendToUser(
                    $db,
                    $data->assigned_to,
                    $created_by,
                    "New Task Assigned: " . $data->title,
                    "You have been assigned a new task: {$data->title}",
                    "task_assigned",
                    "staff",
                    "/tasks",
                    $priority_level === 'High' || $priority_level === 'Critical' ? 'high' : 'normal',
                    ["task_id" => $task_id]
                );
            }
        } catch (\Throwable $e) {}

        // Send email notification safely
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
                        $subject = str_replace('{{task_title}}', $data->title ?? 'Task', $tpl['subject']);
                        $body = $tpl['body'];
                        $body = str_replace('{{staff_name}}', $user_data['name'], $body);
                        $body = str_replace('{{task_title}}', $data->title ?? 'Task', $body);
                        $body = str_replace('{{task_category}}', $category_name_log, $body);
                        
                        $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $task_id;
                        $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                        
                        EmailHelper::sendEmail($user_data['email'], $user_data['name'], $subject, $htmlBody);
                    }
                }
            }
        } catch (\Throwable $e) {}
    }

    echo json_encode([
        "status" => "success", 
        "message" => "Task created and assigned successfully.",
        "task_id" => (int)$task_id,
        "department_id" => $department_id
    ]);

} catch(\PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch(\Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>