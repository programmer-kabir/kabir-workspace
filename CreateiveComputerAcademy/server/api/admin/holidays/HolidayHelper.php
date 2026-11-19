<?php
/**
 * HolidayHelper.php — Center Closures & Official Holidays Engine
 *
 * Self-healing schema, CRUD management, auto-absent cleanup,
 * and payroll wage protection integration for Creative Computer Academy.
 */

class HolidayHelper {

    /**
     * Self-healing JIT schema migration for holidays table.
     * Guarantees all columns exist without manual SQL migrations on Hostinger.
     */
    public static function ensureSchema($db) {
        if (!$db) return;

        try {
            // 1. Ensure table exists
            $db->exec("
                CREATE TABLE IF NOT EXISTS `holidays` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `date` DATE NOT NULL,
                    `title` VARCHAR(150) NOT NULL,
                    `expected_hours` INT DEFAULT 0,
                    `is_paid` TINYINT(1) NOT NULL DEFAULT 1,
                    `closure_type` VARCHAR(50) NOT NULL DEFAULT 'public_holiday',
                    `notes` TEXT NULL,
                    `created_by` INT NULL,
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (`date`),
                    INDEX (`is_paid`),
                    INDEX (`closure_type`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. Add columns if missing in existing table
            $columns = [];
            $colStmt = $db->query("SHOW COLUMNS FROM `holidays`");
            if ($colStmt) {
                while ($c = $colStmt->fetch(PDO::FETCH_ASSOC)) {
                    $columns[strtolower($c['Field'])] = true;
                }
            }

            if (!isset($columns['is_paid'])) {
                $db->exec("ALTER TABLE `holidays` ADD COLUMN `is_paid` TINYINT(1) NOT NULL DEFAULT 1 AFTER `expected_hours`");
            }
            if (!isset($columns['closure_type'])) {
                $db->exec("ALTER TABLE `holidays` ADD COLUMN `closure_type` VARCHAR(50) NOT NULL DEFAULT 'public_holiday' AFTER `is_paid`");
            }
            if (!isset($columns['notes'])) {
                $db->exec("ALTER TABLE `holidays` ADD COLUMN `notes` TEXT NULL AFTER `closure_type`");
            }
            if (!isset($columns['created_by'])) {
                $db->exec("ALTER TABLE `holidays` ADD COLUMN `created_by` INT NULL AFTER `notes`");
            }
            if (!isset($columns['updated_at'])) {
                $db->exec("ALTER TABLE `holidays` ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`");
            }

            // 3. Unique index on date to prevent duplicate holidays for the same date
            try {
                $idxStmt = $db->query("SHOW INDEX FROM `holidays` WHERE Key_name = 'uniq_holiday_date'");
                if ($idxStmt && $idxStmt->rowCount() === 0) {
                    $db->exec("ALTER TABLE `holidays` ADD UNIQUE KEY `uniq_holiday_date` (`date`)");
                }
            } catch (Throwable $e) {}

            // 4. Ensure staff_work_earnings source_type supports 'paid_holiday'
            try {
                $db->exec("ALTER TABLE `staff_work_earnings` MODIFY COLUMN `source_type` VARCHAR(50) NOT NULL DEFAULT 'attendance'");
            } catch (Throwable $e) {}

        } catch (Throwable $e) {
            error_log("HolidayHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    /**
     * Retrieve all holidays, optionally filtered by year or month.
     */
    public static function getHolidays($db, $year = null, $month = null) {
        self::ensureSchema($db);

        $params = [];
        $where = [];

        if (!empty($year)) {
            $where[] = "YEAR(h.date) = :year";
            $params[':year'] = intval($year);
        }
        if (!empty($month)) {
            $where[] = "MONTH(h.date) = :month";
            $params[':month'] = intval($month);
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        $sql = "
            SELECT 
                h.id,
                h.date,
                h.title,
                COALESCE(h.expected_hours, 0) as expected_hours,
                COALESCE(h.is_paid, 1) as is_paid,
                COALESCE(h.closure_type, 'public_holiday') as closure_type,
                h.notes,
                h.created_by,
                h.created_at,
                h.updated_at,
                u.name as creator_name,
                u.email as creator_email
            FROM `holidays` h
            LEFT JOIN `users` u ON h.created_by = u.id
            {$whereClause}
            ORDER BY h.date DESC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $today = date('Y-m-d');
        $holidays = [];
        $totalPaid = 0;
        $totalUnpaid = 0;
        $upcomingCount = 0;
        $nextUpcoming = null;

        // Group rows in ascending date order for next holiday determination
        $sortedAsc = $rows;
        usort($sortedAsc, function($a, $b) {
            return strcmp($a['date'], $b['date']);
        });

        foreach ($sortedAsc as $r) {
            if ($r['date'] >= $today && $nextUpcoming === null) {
                $nextUpcoming = $r;
            }
        }

        foreach ($rows as $r) {
            $isPaid = (intval($r['is_paid']) === 1);
            if ($isPaid) {
                $totalPaid++;
            } else {
                $totalUnpaid++;
            }

            if ($r['date'] >= $today) {
                $upcomingCount++;
            }

            $dateTs = strtotime($r['date']);
            $r['day_of_week'] = date('l', $dateTs);
            $r['formatted_date'] = date('d M Y', $dateTs);
            $r['is_past'] = ($r['date'] < $today);
            $r['is_today'] = ($r['date'] === $today);
            $r['is_paid'] = $isPaid ? 1 : 0;

            $holidays[] = $r;
        }

        return [
            'holidays' => $holidays,
            'stats' => [
                'total' => count($holidays),
                'paid_count' => $totalPaid,
                'unpaid_count' => $totalUnpaid,
                'upcoming_count' => $upcomingCount,
                'next_upcoming' => $nextUpcoming
            ]
        ];
    }

    /**
     * Save (create or update) a holiday / center closure.
     */
    public static function saveHoliday($db, $data, $adminId = null) {
        self::ensureSchema($db);

        $id = !empty($data['id']) ? intval($data['id']) : null;
        $date = !empty($data['date']) ? trim($data['date']) : null;
        $title = !empty($data['title']) ? trim($data['title']) : '';
        $expectedHours = isset($data['expected_hours']) ? intval($data['expected_hours']) : 0;
        $isPaid = isset($data['is_paid']) ? ($data['is_paid'] ? 1 : 0) : 1;
        $closureType = !empty($data['closure_type']) ? trim($data['closure_type']) : 'public_holiday';
        $notes = !empty($data['notes']) ? trim($data['notes']) : '';
        $creatorId = $adminId ?: (!empty($data['admin_id']) ? intval($data['admin_id']) : null);

        if (!$date || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            throw new InvalidArgumentException("Valid date (YYYY-MM-DD) is required.");
        }
        if (empty($title)) {
            throw new InvalidArgumentException("Holiday / Closure title is required.");
        }

        // Check if another holiday already exists on this date
        if ($id) {
            $checkStmt = $db->prepare("SELECT id FROM `holidays` WHERE `date` = :date AND id != :id LIMIT 1");
            $checkStmt->execute([':date' => $date, ':id' => $id]);
        } else {
            $checkStmt = $db->prepare("SELECT id FROM `holidays` WHERE `date` = :date LIMIT 1");
            $checkStmt->execute([':date' => $date]);
        }

        if ($checkStmt->fetch()) {
            throw new RuntimeException("A holiday or center closure is already declared for {$date}.");
        }

        if ($id) {
            // Update
            $sql = "
                UPDATE `holidays` SET
                    `date` = :date,
                    `title` = :title,
                    `expected_hours` = :expected_hours,
                    `is_paid` = :is_paid,
                    `closure_type` = :closure_type,
                    `notes` = :notes
                WHERE id = :id
            ";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':date' => $date,
                ':title' => $title,
                ':expected_hours' => $expectedHours,
                ':is_paid' => $isPaid,
                ':closure_type' => $closureType,
                ':notes' => $notes,
                ':id' => $id
            ]);
            $holidayId = $id;
        } else {
            // Insert
            $sql = "
                INSERT INTO `holidays` (
                    `date`, `title`, `expected_hours`, `is_paid`, `closure_type`, `notes`, `created_by`, `created_at`
                ) VALUES (
                    :date, :title, :expected_hours, :is_paid, :closure_type, :notes, :created_by, NOW()
                )
            ";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':date' => $date,
                ':title' => $title,
                ':expected_hours' => $expectedHours,
                ':is_paid' => $isPaid,
                ':closure_type' => $closureType,
                ':notes' => $notes,
                ':created_by' => $creatorId
            ]);
            $holidayId = (int)$db->lastInsertId();
        }

        // ── AUTO-CLEANUP 1: Remove any Auto-Absent records on this holiday date ──
        try {
            $cleanStmt = $db->prepare("DELETE FROM `attendance` WHERE `date` = :date AND `status` = 'Absent'");
            $cleanStmt->execute([':date' => $date]);
        } catch (Throwable $e) {
            error_log("Failed to clean absent attendance for holiday: " . $e->getMessage());
        }

        // ── AUTO-SYNC 2: Sync to staff_work_earnings if PayrollSync is available ──
        try {
            if (file_exists(__DIR__ . '/../../payroll/PayrollSync.php')) {
                require_once __DIR__ . '/../../payroll/PayrollHelper.php';
                require_once __DIR__ . '/../../payroll/PayrollSync.php';
                PayrollSync::syncAttendanceEarnings($db);
            }
        } catch (Throwable $e) {
            error_log("PayrollSync trigger error after saving holiday: " . $e->getMessage());
        }

        // ── NOTIFICATION 3: Notify active staff about the center closure ──
        try {
            if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
                require_once __DIR__ . '/../../notifications/notification_helper.php';
                $payStatusText = $isPaid ? "Paid Holiday (100% Salary Protected)" : "Unpaid Closure";
                $notifTitle = "🏛️ Center Closed Notice: {$title}";
                $notifMsg = "The academy will remain closed on {$date} ({$title}). Status: {$payStatusText}. Attendance is excused.";

                $staffUsers = $db->query("
                    SELECT u.id 
                    FROM users u 
                    INNER JOIN user_roles ur ON u.id = ur.user_id 
                    WHERE ur.role IN ('staff', 'manager', 'instructor') AND u.status = 'active'
                ")->fetchAll(PDO::FETCH_COLUMN);

                foreach ($staffUsers as $uid) {
                    NotificationHelper::sendToUser(
                        $db,
                        $uid,
                        $creatorId,
                        $notifTitle,
                        $notifMsg,
                        'center_closure_notice',
                        'staff',
                        '/attendance'
                    );
                }
            }
        } catch (Throwable $e) {
            // Notification is non-blocking
        }

        return [
            'id' => $holidayId,
            'date' => $date,
            'title' => $title,
            'is_paid' => $isPaid,
            'closure_type' => $closureType,
            'notes' => $notes
        ];
    }

    /**
     * Delete a holiday and rollback any associated paid holiday earnings.
     */
    public static function deleteHoliday($db, $holidayId) {
        self::ensureSchema($db);

        $holidayId = intval($holidayId);
        if ($holidayId <= 0) {
            throw new InvalidArgumentException("Valid holiday ID required.");
        }

        // Get details before deleting
        $stmt = $db->prepare("SELECT * FROM `holidays` WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $holidayId]);
        $holiday = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$holiday) {
            throw new RuntimeException("Holiday not found.");
        }

        // Delete from holidays table
        $delStmt = $db->prepare("DELETE FROM `holidays` WHERE id = :id");
        $delStmt->execute([':id' => $holidayId]);

        // Rollback any paid holiday wage earnings created for this specific holiday
        try {
            $delEarnStmt = $db->prepare("
                DELETE FROM `staff_work_earnings` 
                WHERE `source_type` = 'paid_holiday' AND `reference_id` = :id
            ");
            $delEarnStmt->execute([':id' => $holidayId]);
        } catch (Throwable $e) {
            error_log("Failed to clean up staff_work_earnings on holiday delete: " . $e->getMessage());
        }

        return $holiday;
    }
}
