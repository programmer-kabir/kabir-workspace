<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'task_history_helper.php';
require_once '../notifications/notification_helper.php';

$database = new Database();
$db = $database->getConnection();

// Ensure is_self_created column exists in tasks table
try {
    $db->query("SELECT is_self_created FROM tasks LIMIT 1");
} catch (Exception $e) {
    try {
        $db->exec("ALTER TABLE `tasks` ADD COLUMN `is_self_created` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`");
    } catch (Exception $ex) {}
}

// Support both FormData (multipart/form-data) and JSON payloads
$user_id = null;
$title = null;
$category = 'Graphic Design';
$description = '';
$ref_links = '';
$submission_link = '';
$priority = 'Normal';

if (!empty($_POST)) {
    $user_id = $_POST['user_id'] ?? null;
    $title = $_POST['title'] ?? null;
    $category = $_POST['category'] ?? 'Graphic Design';
    $description = $_POST['description'] ?? '';
    $ref_links = $_POST['ref_links'] ?? ($_POST['submission_link'] ?? '');
    $submission_link = $_POST['submission_link'] ?? '';
    $priority = $_POST['priority'] ?? 'Normal';
} else {
    $raw_input = file_get_contents("php://input");
    $data = json_decode($raw_input);
    if ($data) {
        $user_id = $data->user_id ?? null;
        $title = $data->title ?? null;
        $category = $data->category ?? 'Graphic Design';
        $description = $data->description ?? '';
        $ref_links = $data->ref_links ?? ($data->submission_link ?? '');
        $submission_link = $data->submission_link ?? '';
        $priority = $data->priority ?? 'Normal';
    }
}

if (empty($user_id) || empty($title)) {
    echo json_encode([
        "status" => "error",
        "message" => "User ID and Task Title are required."
    ]);
    exit;
}

try {
    // 1. Fetch Employee record and User details for the creator
    $emp_query = "SELECT e.id as employee_id, e.department_id, e.reporting_manager_id, u.name as staff_name 
                  FROM employees e 
                  JOIN users u ON e.user_id = u.id 
                  WHERE e.user_id = :user_id LIMIT 1";
    $emp_stmt = $db->prepare($emp_query);
    $emp_stmt->execute([':user_id' => $user_id]);
    $emp_data = $emp_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$emp_data) {
        echo json_encode([
            "status" => "error",
            "message" => "Employee profile not found for this user."
        ]);
        exit;
    }

    $employee_id = $emp_data['employee_id'];
    $department_id = $emp_data['department_id'] ?: null;
    $reporting_manager_id = $emp_data['reporting_manager_id'] ?: null;
    $staff_name = $emp_data['staff_name'] ?: 'Staff Member';

    // 2. Handle Thumbnail / Visual Image Upload
    $visual_image_val = null;

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../../uploads/tasks/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $file_tmp = $_FILES['image']['tmp_name'];
        $file_name = $_FILES['image']['name'];
        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        $allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

        if (in_array($ext, $allowed_exts)) {
            $unique_filename = 'task_self_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
            $destination = $upload_dir . $unique_filename;

            if (move_uploaded_file($file_tmp, $destination)) {
                $relative_path = 'uploads/tasks/' . $unique_filename;
                $visual_image_val = json_encode([$relative_path]);
            }
        }
    } elseif (!empty($_POST['visual_image'])) {
        $raw_visual = $_POST['visual_image'];
        $visual_image_val = is_string($raw_visual) && strpos($raw_visual, '[') === 0 ? $raw_visual : json_encode([$raw_visual]);
    }

    // Prepare ref_links as JSON array if present
    $ref_links_val = null;
    if (!empty($ref_links)) {
        if (is_array($ref_links)) {
            $ref_links_val = json_encode(array_values(array_filter($ref_links)));
        } else {
            $ref_links_val = json_encode([trim($ref_links)]);
        }
    }

    $category_id = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : ($data->category_id ?? null);
    $subcategory_id = !empty($_POST['subcategory_id']) ? (int)$_POST['subcategory_id'] : ($data->subcategory_id ?? null);
    $child_category_id = !empty($_POST['child_category_id']) ? (int)$_POST['child_category_id'] : ($data->child_category_id ?? null);

    // 3. Insert Task with status = 'To-Do', is_self_created = 1, assign_date = CURDATE()
    $insert_query = "INSERT INTO tasks (
        title, 
        description, 
        priority, 
        category_id,
        subcategory_id,
        child_category_id,
        department_id, 
        visual_image, 
        ref_links,
        submission_link, 
        created_by, 
        assigned_to, 
        status, 
        is_self_created, 
        assign_date,
        created_at,
        updated_at
    ) VALUES (
        :title, 
        :description, 
        :priority, 
        :category_id,
        :subcategory_id,
        :child_category_id,
        :department_id, 
        :visual_image, 
        :ref_links,
        :submission_link, 
        :created_by, 
        :assigned_to, 
        'To-Do', 
        1, 
        CURDATE(),
        NOW(),
        NOW()
    )";

    $stmt = $db->prepare($insert_query);
    $stmt->execute([
        ':title'             => trim($title),
        ':description'       => $description ? trim($description) : null,
        ':priority'          => $priority,
        ':category_id'       => $category_id,
        ':subcategory_id'    => $subcategory_id,
        ':child_category_id' => $child_category_id,
        ':department_id'     => $department_id,
        ':visual_image'      => $visual_image_val,
        ':ref_links'         => $ref_links_val,
        ':submission_link'   => !empty($submission_link) ? trim($submission_link) : null,
        ':created_by'        => $user_id,
        ':assigned_to'       => $employee_id
    ]);

    $task_id = $db->lastInsertId();

    // 4. Log Task History
    $logger = new TaskHistoryLogger($db);
    $logger->logHistory($task_id, "Self-Initiated Creative Task Created in To-Do", $staff_name);

    // 5. Insert Log for Admin Audit Trail
    try {
        $log_query = "INSERT INTO task_logs (task_id, status_from, status_to, changed_by) VALUES (:task_id, 'None', 'To-Do', :changed_by)";
        $log_stmt = $db->prepare($log_query);
        $log_stmt->execute([
            ':task_id'    => $task_id,
            ':changed_by' => $user_id
        ]);
    } catch (Exception $e) {
        // Non-fatal
    }

    // 6. Fetch the newly created task to return to the frontend
    $fetch_stmt = $db->prepare("SELECT * FROM tasks WHERE id = :id LIMIT 1");
    $fetch_stmt->execute([':id' => $task_id]);
    $new_task = $fetch_stmt->fetch(PDO::FETCH_ASSOC);

    if ($new_task) {
        $history_stmt = $db->prepare("SELECT * FROM task_history WHERE task_id = :task_id ORDER BY created_at ASC");
        $history_stmt->execute([':task_id' => $task_id]);
        $new_task['history'] = $history_stmt->fetchAll(PDO::FETCH_ASSOC);
        $new_task['checklists'] = [];
        $new_task['is_delayed'] = false;
        $new_task['deadline_status'] = null;
    }

    echo json_encode([
        "status" => "success",
        "message" => "Creative task created and added to your To-Do list!",
        "task" => $new_task
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "An error occurred while creating creative task: " . $e->getMessage()
    ]);
}
?>
