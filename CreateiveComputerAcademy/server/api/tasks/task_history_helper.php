<?php
require_once __DIR__ . '/../../config/database.php';

class TaskHistoryLogger {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function logHistory($task_id, $action_text, $performed_by_name) {
        try {
            $query = "INSERT INTO task_history (task_id, action_text, performed_by_name) VALUES (:task_id, :action_text, :performed_by_name)";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':task_id' => $task_id,
                ':action_text' => $action_text,
                ':performed_by_name' => $performed_by_name
            ]);
            return true;
        } catch(PDOException $e) {
            // Silently fail history logging to avoid breaking main flows
            return false;
        }
    }
}
?>
