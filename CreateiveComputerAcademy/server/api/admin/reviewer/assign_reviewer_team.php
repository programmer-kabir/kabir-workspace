<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->reviewer_user_id)) {
    echo json_encode(["status" => "error", "message" => "reviewer_user_id is required."]);
    exit;
}

$reviewer_user_id = intval($data->reviewer_user_id);
$staff_user_ids   = isset($data->staff_user_ids) && is_array($data->staff_user_ids) ? $data->staff_user_ids : [];

// Sanitize user IDs
$cleaned_ids = [];
foreach ($staff_user_ids as $id) {
    $uid = intval($id);
    if ($uid > 0) $cleaned_ids[] = $uid;
}

try {
    $db->beginTransaction();

    // 1. Remove old staff assignments for this reviewer
    $clear_stmt = $db->prepare("
        UPDATE employees 
        SET reporting_manager_id = NULL 
        WHERE reporting_manager_id = :reviewer_user_id
    ");
    $clear_stmt->execute([':reviewer_user_id' => $reviewer_user_id]);

    // 2. Assign newly selected staff
    $assigned_count = 0;
    if (!empty($cleaned_ids)) {
        $in_placeholders = implode(',', array_fill(0, count($cleaned_ids), '?'));
        $assign_sql = "
            UPDATE employees 
            SET reporting_manager_id = ? 
            WHERE user_id IN ($in_placeholders)
        ";
        $assign_stmt = $db->prepare($assign_sql);
        $params = array_merge([$reviewer_user_id], $cleaned_ids);
        $assign_stmt->execute($params);
        $assigned_count = count($cleaned_ids);
    }

    $db->commit();

    echo json_encode([
        "status"         => "success",
        "message"        => "Team assigned successfully ({$assigned_count} staff members).",
        "assigned_count" => $assigned_count
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
