<?php
// BreakDbHelper.php - Schema auto-ensurance for Break & Approval System

class BreakDbHelper {
    public static function ensureSchema($db) {
        if (!$db) return;
        try {
            // 1. Create table if not exists
            $db->exec("CREATE TABLE IF NOT EXISTS employee_breaks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                break_type VARCHAR(50) NOT NULL,
                start_time DATETIME NULL,
                end_time DATETIME DEFAULT NULL,
                duration_minutes INT DEFAULT 0,
                status VARCHAR(30) NOT NULL DEFAULT 'Active',
                reason VARCHAR(255) NULL,
                estimated_minutes INT NULL,
                approved_by INT NULL,
                approved_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (date),
                INDEX (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 2. Add missing columns if existing table
            $cols = $db->query("SHOW COLUMNS FROM employee_breaks")->fetchAll(PDO::FETCH_COLUMN);

            if (!in_array('reason', $cols)) {
                $db->exec("ALTER TABLE employee_breaks ADD COLUMN reason VARCHAR(255) NULL AFTER status");
            }
            if (!in_array('estimated_minutes', $cols)) {
                $db->exec("ALTER TABLE employee_breaks ADD COLUMN estimated_minutes INT NULL AFTER reason");
            }
            if (!in_array('approved_by', $cols)) {
                $db->exec("ALTER TABLE employee_breaks ADD COLUMN approved_by INT NULL AFTER estimated_minutes");
            }
            if (!in_array('approved_at', $cols)) {
                $db->exec("ALTER TABLE employee_breaks ADD COLUMN approved_at DATETIME NULL AFTER approved_by");
            }

            // Ensure status is VARCHAR(30) so 'Pending', 'Active', 'Completed', 'Rejected' are supported
            $db->exec("ALTER TABLE employee_breaks MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Active'");

            // Allow start_time to be NULL for initial pending state
            $db->exec("ALTER TABLE employee_breaks MODIFY COLUMN start_time DATETIME NULL");

        } catch (Throwable $t) {
            error_log("BreakDbHelper error: " . $t->getMessage());
        }
    }
}
?>
