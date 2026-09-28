<?php
// DailyLogDbHelper.php - Schema auto-ensurance for Student Daily Work Log System

class DailyLogDbHelper {
    public static function ensureSchema($db) {
        if (!$db) return;
        try {
            // 1. Create table if not exists
            $db->exec("CREATE TABLE IF NOT EXISTS student_daily_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                topic_title VARCHAR(255) NOT NULL,
                summary TEXT NOT NULL,
                challenges_faced TEXT NULL,
                files LONGTEXT NULL,
                practice_hours DECIMAL(4,2) DEFAULT 0.00,
                instructor_feedback TEXT NULL,
                instructor_rating TINYINT NULL,
                reviewed_by INT NULL,
                reviewed_at DATETIME NULL,
                credits_earned INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (date),
                INDEX (user_id, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 2. Add missing columns if existing table
            $cols = $db->query("SHOW COLUMNS FROM student_daily_logs")->fetchAll(PDO::FETCH_COLUMN);

            if (!in_array('challenges_faced', $cols)) {
                $db->exec("ALTER TABLE student_daily_logs ADD COLUMN challenges_faced TEXT NULL AFTER summary");
            }
            if (!in_array('practice_hours', $cols)) {
                $db->exec("ALTER TABLE student_daily_logs ADD COLUMN practice_hours DECIMAL(4,2) DEFAULT 0.00 AFTER files");
            }
            if (!in_array('instructor_rating', $cols)) {
                $db->exec("ALTER TABLE student_daily_logs ADD COLUMN instructor_rating TINYINT NULL AFTER instructor_feedback");
            }
            if (!in_array('reviewed_by', $cols)) {
                $db->exec("ALTER TABLE student_daily_logs ADD COLUMN reviewed_by INT NULL AFTER instructor_rating");
            }
            if (!in_array('reviewed_at', $cols)) {
                $db->exec("ALTER TABLE student_daily_logs ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by");
            }
            if (!in_array('credits_earned', $cols)) {
                $db->exec("ALTER TABLE student_daily_logs ADD COLUMN credits_earned INT DEFAULT 0 AFTER reviewed_at");
            }

        } catch (Throwable $t) {
            error_log("DailyLogDbHelper error: " . $t->getMessage());
        }
    }
}
?>
