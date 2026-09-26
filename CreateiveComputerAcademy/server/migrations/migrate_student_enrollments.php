<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

try {
    $db->beginTransaction();

    // 1. Create student_enrollments table (NO batch_id)
    $db->exec("
        CREATE TABLE IF NOT EXISTS `student_enrollments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `course_id` INT NOT NULL,
            `enrollment_date` DATE NOT NULL,
            `completion_date` DATE DEFAULT NULL,
            `status` ENUM('active', 'completed', 'dropped', 'suspended') NOT NULL DEFAULT 'active',
            `created_at` DATETIME NOT NULL,
            `updated_at` DATETIME NOT NULL,
            UNIQUE KEY `uniq_user_course` (`user_id`, `course_id`),
            INDEX `idx_user_id` (`user_id`),
            INDEX `idx_course_id` (`course_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. Migrate existing course enrollments from students table
    $migrateQuery = "
        INSERT INTO `student_enrollments` (
            `user_id`, `course_id`, `enrollment_date`, `completion_date`, `status`, `created_at`, `updated_at`
        )
        SELECT 
            s.user_id, 
            s.course_id, 
            COALESCE(s.enrollment_date, CURDATE()), 
            s.completion_date, 
            CASE 
                WHEN s.status IN ('active', 'completed', 'dropped', 'suspended') THEN s.status 
                ELSE 'active' 
            END, 
            COALESCE(s.created_at, NOW()), 
            COALESCE(s.updated_at, NOW())
        FROM `students` s
        WHERE s.course_id IS NOT NULL AND s.course_id > 0
        ON DUPLICATE KEY UPDATE 
            `status` = VALUES(`status`),
            `updated_at` = VALUES(`updated_at`);
    ";
    $stmt = $db->prepare($migrateQuery);
    $stmt->execute();
    $migratedCount = $stmt->rowCount();

    // 3. Deduplicate students profile table so each user_id has 1 permanent record
    // Find all distinct user_ids that have more than 1 record in students
    $dupQuery = "
        SELECT user_id, COUNT(*) as cnt 
        FROM `students` 
        GROUP BY user_id 
        HAVING cnt > 1
    ";
    $dupStmt = $db->query($dupQuery);
    $dupUsers = $dupStmt ? $dupStmt->fetchAll(PDO::FETCH_ASSOC) : [];

    $removedDups = 0;
    foreach ($dupUsers as $dup) {
        $uid = intval($dup['user_id']);
        // Keep the earliest record or the one with the original student_code
        $records = $db->query("SELECT id, student_code FROM `students` WHERE user_id = $uid ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC);
        if (count($records) > 1) {
            $keepId = $records[0]['id'];
            $delStmt = $db->prepare("DELETE FROM `students` WHERE user_id = :uid AND id != :keep_id");
            $delStmt->execute([':uid' => $uid, ':keep_id' => $keepId]);
            $removedDups += $delStmt->rowCount();
        }
    }

    // 4. Drop course_id from students table if it still exists
    $col_chk = $db->query("SHOW COLUMNS FROM `students` LIKE 'course_id'");
    $droppedCourseId = false;
    if ($col_chk && $col_chk->rowCount() > 0) {
        $db->exec("ALTER TABLE `students` DROP COLUMN `course_id`");
        $droppedCourseId = true;
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Migration completed successfully!",
        "table_created" => "student_enrollments",
        "enrollments_migrated" => $migratedCount,
        "duplicate_student_profiles_cleaned" => $removedDups,
        "course_id_column_dropped" => $droppedCourseId
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>
