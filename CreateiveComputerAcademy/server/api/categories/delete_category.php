<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'category_helper.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || empty($data->id)) {
    echo json_encode(["status" => "error", "message" => "Category ID is required."]);
    exit;
}

try {
    $id = (int)$data->id;

    // Check if tasks are using this category
    $task_check = $db->prepare("SELECT COUNT(*) FROM tasks WHERE category_id = :id OR subcategory_id = :id OR child_category_id = :id");
    $task_check->execute([':id' => $id]);
    $used_count = $task_check->fetchColumn();

    if ($used_count > 0) {
        // Soft delete / set to inactive so historic tasks don't break
        $stmt = $db->prepare("UPDATE task_categories SET status = 'inactive', updated_at = NOW() WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["status" => "success", "message" => "Category is attached to existing tasks, so it was marked inactive."]);
    } else {
        // Safe to delete along with any child categories
        $db->beginTransaction();
        
        // Find subcategory IDs if deleting a main category
        $sub_ids = $db->query("SELECT id FROM task_categories WHERE parent_id = $id")->fetchAll(PDO::FETCH_COLUMN);
        if (!empty($sub_ids)) {
            $in_subs = implode(',', $sub_ids);
            $db->exec("DELETE FROM task_categories WHERE parent_id IN ($in_subs)");
        }
        $db->exec("DELETE FROM task_categories WHERE parent_id = $id");
        $db->exec("DELETE FROM task_categories WHERE id = $id");
        
        $db->commit();
        echo json_encode(["status" => "success", "message" => "Category deleted successfully."]);
    }
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
