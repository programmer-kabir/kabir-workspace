<?php
// BreakSchema.php - Dedicated JIT Schema & Table Manager for Break System

class BreakSchema {
    private static $ensured = false;

    /**
     * Ensures all break tables and columns exist in MySQL database
     */
    public static function ensure($db) {
        if (!$db) return;
        if (self::$ensured) return;
        self::$ensured = true;

        try {
            // 1. Create user_breaks table
            $db->exec("CREATE TABLE IF NOT EXISTS user_breaks (
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

            // 2. Ensure missing columns in user_breaks
            $cols = $db->query("SHOW COLUMNS FROM user_breaks")->fetchAll(PDO::FETCH_COLUMN);

            if (!in_array('purpose', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN purpose VARCHAR(50) NULL AFTER break_type");
                $db->exec("UPDATE user_breaks SET purpose = 'Tiffin' WHERE break_type = 'Tiffin' AND (purpose IS NULL OR purpose = '')");
            }
            if (!in_array('reason', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN reason VARCHAR(255) NULL AFTER status");
            }
            if (!in_array('estimated_minutes', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN estimated_minutes INT NULL AFTER reason");
            }
            if (!in_array('approved_by', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN approved_by INT NULL AFTER estimated_minutes");
            }
            if (!in_array('approved_at', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN approved_at DATETIME NULL AFTER approved_by");
            }
            if (!in_array('tiffin_delta_minutes', $cols)) {
                $db->exec("ALTER TABLE user_breaks ADD COLUMN tiffin_delta_minutes INT DEFAULT 0 AFTER duration_minutes");
                try {
                    $db->exec("UPDATE user_breaks 
                        SET tiffin_delta_minutes = (40 - duration_minutes) 
                        WHERE break_type = 'Tiffin' 
                          AND status = 'Completed' 
                          AND duration_minutes > 0");
                } catch (Throwable $bf) {}
            }

            // 3. Ensure staff_withdrawals overtime_hours_cashed column
            try {
                $swCols = $db->query("SHOW COLUMNS FROM staff_withdrawals")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('overtime_hours_cashed', $swCols)) {
                    $db->exec("ALTER TABLE staff_withdrawals ADD COLUMN overtime_hours_cashed DECIMAL(6,2) NOT NULL DEFAULT 0.00 AFTER amount");
                }
            } catch (Throwable $t2) {}

            // 4. Ensure staff_overtime_trades table
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS staff_overtime_trades (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    trade_code VARCHAR(50) NOT NULL UNIQUE,
                    seller_id INT NOT NULL,
                    buyer_id INT NOT NULL,
                    hours_traded DECIMAL(6,2) NOT NULL,
                    minutes_traded INT NOT NULL,
                    hourly_rate DECIMAL(10,2) NOT NULL,
                    total_price DECIMAL(10,2) NOT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'pending_seller',
                    seller_action_at DATETIME NULL,
                    approved_by INT NULL,
                    approved_at DATETIME NULL,
                    rejection_reason VARCHAR(255) NULL,
                    buyer_note VARCHAR(255) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (seller_id),
                    INDEX (buyer_id),
                    INDEX (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
            } catch (Throwable $t3) {}

            // 5. Ensure mango_vault_ledger table
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS mango_vault_ledger (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    action_type VARCHAR(30) NOT NULL,
                    mango_count INT NOT NULL DEFAULT 1,
                    minutes_amount INT NOT NULL DEFAULT 0,
                    source_user_id INT NULL,
                    target_user_id INT NULL,
                    from_source VARCHAR(20) DEFAULT 'vault',
                    note VARCHAR(255) NULL,
                    performed_by INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (user_id),
                    INDEX (action_type),
                    INDEX (performed_by),
                    INDEX (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
            } catch (Throwable $t4) {}

            // 6. Ensure center_prayer_schedules table for afternoon prayer & tiffin
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS center_prayer_schedules (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(100) NOT NULL DEFAULT 'আসরের নামাজ ও বিকাল বিরতি',
                    start_time TIME NOT NULL DEFAULT '16:15:00',
                    end_time TIME NOT NULL DEFAULT '16:35:00',
                    allocated_minutes INT NOT NULL DEFAULT 20,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    effective_date DATE NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

                // Seed default schedule if table is empty
                $sCount = $db->query("SELECT COUNT(*) FROM center_prayer_schedules")->fetchColumn();
                if ((int)$sCount === 0) {
                    $db->exec("INSERT INTO center_prayer_schedules (title, start_time, end_time, allocated_minutes, is_active, salah_reward_mins, salah_full_day_bonus, is_reward_enabled) 
                               VALUES ('আসরের নামাজ ও বিকাল বিরতি', '16:15:00', '16:35:00', 20, 1, 3, 5, 1)");
                }

                // Ensure reward columns exist on center_prayer_schedules
                $cpsCols = $db->query("SHOW COLUMNS FROM center_prayer_schedules")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('salah_reward_mins', $cpsCols)) {
                    $db->exec("ALTER TABLE center_prayer_schedules ADD COLUMN salah_reward_mins INT NOT NULL DEFAULT 3 AFTER allocated_minutes");
                }
                if (!in_array('salah_full_day_bonus', $cpsCols)) {
                    $db->exec("ALTER TABLE center_prayer_schedules ADD COLUMN salah_full_day_bonus INT NOT NULL DEFAULT 5 AFTER salah_reward_mins");
                }
                if (!in_array('is_reward_enabled', $cpsCols)) {
                    $db->exec("ALTER TABLE center_prayer_schedules ADD COLUMN is_reward_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER salah_full_day_bonus");
                }
            } catch (Throwable $tps) {}

            // 7. Ensure staff_salah_logs table for Daily 5 Waqt Salah Habit Tracker
            try {
                $db->exec("CREATE TABLE IF NOT EXISTS staff_salah_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    date DATE NOT NULL,
                    waqt VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'prayed',
                    reward_minutes INT NOT NULL DEFAULT 0,
                    bonus_minutes INT NOT NULL DEFAULT 0,
                    ledger_id INT NULL,
                    logged_at DATETIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_user_date_waqt (user_id, date, waqt),
                    INDEX idx_user_date (user_id, date),
                    INDEX idx_waqt (waqt)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

                $sslCols = $db->query("SHOW COLUMNS FROM staff_salah_logs")->fetchAll(PDO::FETCH_COLUMN);
                if (!in_array('reward_minutes', $sslCols)) {
                    $db->exec("ALTER TABLE staff_salah_logs ADD COLUMN reward_minutes INT NOT NULL DEFAULT 0 AFTER status");
                }
                if (!in_array('bonus_minutes', $sslCols)) {
                    $db->exec("ALTER TABLE staff_salah_logs ADD COLUMN bonus_minutes INT NOT NULL DEFAULT 0 AFTER reward_minutes");
                }
                if (!in_array('ledger_id', $sslCols)) {
                    $db->exec("ALTER TABLE staff_salah_logs ADD COLUMN ledger_id INT NULL AFTER bonus_minutes");
                }
            } catch (Throwable $tsl) {}

        } catch (Throwable $t) {
            error_log("BreakSchema error: " . $t->getMessage());
        }
    }
}
