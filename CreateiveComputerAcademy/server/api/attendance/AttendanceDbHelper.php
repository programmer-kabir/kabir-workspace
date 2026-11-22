<?php
// AttendanceDbHelper.php - Self-Healing Schema & Proxy Attendance Audit Logger

class AttendanceDbHelper {

    /**
     * Ensure attendance table columns and proxy audit log tables exist (Self-healing JIT schema)
     */
    public static function ensureSchema($db) {
        if (!$db) return;

        try {
            // 1. Ensure attendance table has override tracking columns
            $cols = $db->query("SHOW COLUMNS FROM attendance")->fetchAll(PDO::FETCH_COLUMN);

            if (!in_array('is_admin_override', $cols)) {
                $db->exec("ALTER TABLE attendance ADD COLUMN is_admin_override TINYINT(1) DEFAULT 0");
            }
            if (!in_array('punched_by_user_id', $cols)) {
                $db->exec("ALTER TABLE attendance ADD COLUMN punched_by_user_id INT NULL");
            }
            if (!in_array('admin_override_reason', $cols)) {
                $db->exec("ALTER TABLE attendance ADD COLUMN admin_override_reason VARCHAR(255) NULL");
            }

            // 2. Ensure attendance_proxy_logs audit table exists
            $db->exec("CREATE TABLE IF NOT EXISTS `attendance_proxy_logs` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `target_user_id` INT NOT NULL,
                `operator_id` INT NOT NULL,
                `punch_type` VARCHAR(20) NOT NULL, -- 'check_in', 'check_out', 'both'
                `punch_date` DATE NOT NULL,
                `punch_time` VARCHAR(20) NOT NULL,
                `reason` VARCHAR(255) NOT NULL,
                `notes` TEXT NULL,
                `ip_address` VARCHAR(45) NULL,
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (`target_user_id`),
                INDEX (`operator_id`),
                INDEX (`punch_date`),
                INDEX (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        } catch (Throwable $e) {
            error_log("AttendanceDbHelper::ensureSchema warning: " . $e->getMessage());
        }
    }

    /**
     * Log a proxy punch event to audit log table
     */
    public static function logProxyPunch($db, $targetUserId, $operatorId, $punchType, $date, $time, $reason, $notes = null, $ip = null) {
        if (!$db) return false;
        self::ensureSchema($db);

        try {
            $clientIp = $ip ?: ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
            $stmt = $db->prepare("
                INSERT INTO attendance_proxy_logs 
                    (target_user_id, operator_id, punch_type, punch_date, punch_time, reason, notes, ip_address, created_at)
                VALUES 
                    (:target_id, :op_id, :p_type, :p_date, :p_time, :reason, :notes, :ip, NOW())
            ");
            return $stmt->execute([
                ':target_id' => $targetUserId,
                ':op_id'     => $operatorId,
                ':p_type'    => $punchType,
                ':p_date'    => $date,
                ':p_time'    => $time,
                ':reason'    => substr($reason, 0, 255),
                ':notes'     => $notes,
                ':ip'        => $clientIp
            ]);
        } catch (Throwable $e) {
            error_log("Failed to log proxy punch: " . $e->getMessage());
            return false;
        }
    }
}
?>
