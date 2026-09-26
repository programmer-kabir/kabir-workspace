<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->task_id) || !isset($data->status)) {
    echo json_encode(["status" => "error", "message" => "Task ID and Status are required."]);
    exit;
}

try {
    $db->beginTransaction();

    // Get old status
    $old_stmt = $db->prepare("SELECT status FROM tasks WHERE id = :id");
    $old_stmt->execute([':id' => $data->task_id]);
    $old_status = $old_stmt->fetchColumn();

    // Update status
    $query = "UPDATE tasks SET status = :status, updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':id', $data->task_id);
    $stmt->execute();

    // Log the change — use changed_by from request if provided, otherwise NULL
    $changed_by = isset($data->changed_by) && $data->changed_by ? $data->changed_by : null;

    if ($changed_by) {
        $log_query = "INSERT INTO task_logs (task_id, status_from, status_to, changed_by) VALUES (:task_id, :status_from, :status_to, :changed_by)";
        $log_stmt = $db->prepare($log_query);
        $log_stmt->execute([
            ':task_id'     => $data->task_id,
            ':status_from' => $old_status,
            ':status_to'   => $data->status,
            ':changed_by'  => $changed_by,
        ]);
    } else {
        // No user ID — log without changed_by (relies on column being nullable)
        $log_query = "INSERT INTO task_logs (task_id, status_from, status_to) VALUES (:task_id, :status_from, :status_to)";
        $log_stmt = $db->prepare($log_query);
        $log_stmt->execute([
            ':task_id'     => $data->task_id,
            ':status_from' => $old_status,
            ':status_to'   => $data->status,
        ]);
    }

    $db->commit();
    echo json_encode(["status" => "success", "message" => "Task marked as " . $data->status]);

} catch(PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
