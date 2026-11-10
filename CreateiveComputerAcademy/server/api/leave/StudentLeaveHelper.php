<?php
// server/api/leave/StudentLeaveHelper.php

class StudentLeaveHelper {
    public static function ensureSchema($db) {
        if (!$db instanceof PDO) {
            return;
        }
        try {
            $cols = $db->query("SHOW COLUMNS FROM `employees`")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('is_student', $cols)) {
                $db->exec("ALTER TABLE `employees` ADD COLUMN `is_student` TINYINT(1) DEFAULT 0");
            }
            if (!in_array('student_leave_quota', $cols)) {
                $db->exec("ALTER TABLE `employees` ADD COLUMN `student_leave_quota` INT DEFAULT 3");
            }
            if (!in_array('student_institution', $cols)) {
                $db->exec("ALTER TABLE `employees` ADD COLUMN `student_institution` VARCHAR(150) NULL");
            }
            if (!in_array('institution_type', $cols)) {
                $db->exec("ALTER TABLE `employees` ADD COLUMN `institution_type` VARCHAR(50) DEFAULT 'College'");
            }
            if (!in_array('student_level', $cols)) {
                $db->exec("ALTER TABLE `employees` ADD COLUMN `student_level` VARCHAR(100) NULL");
            }

            // Ensure leave_requests.type allows 'Student Academic Leave' (widen ENUM to VARCHAR)
            $lrType = $db->query("SHOW COLUMNS FROM `leave_requests` LIKE 'type'")->fetch(PDO::FETCH_ASSOC);
            if ($lrType && stripos($lrType['Type'], 'varchar') === false && stripos($lrType['Type'], 'Student Academic Leave') === false) {
                $db->exec("ALTER TABLE `leave_requests` MODIFY COLUMN `type` VARCHAR(50) NOT NULL DEFAULT 'Casual'");
            }

            // Ensure attendance.status allows 'Student Leave' (widen ENUM to VARCHAR)
            $attStatus = $db->query("SHOW COLUMNS FROM `attendance` LIKE 'status'")->fetch(PDO::FETCH_ASSOC);
            if ($attStatus && stripos($attStatus['Type'], 'varchar') === false && stripos($attStatus['Type'], 'Student Leave') === false) {
                $db->exec("ALTER TABLE `attendance` MODIFY COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'Absent'");
            }
        } catch (Throwable $e) {}
    }

    /**
     * Calculates remaining student leave quota for a specific user and month
     *
     * @param PDO $db
     * @param int $userId
     * @param string|null $month YYYY-MM (e.g. 2026-10)
     * @return array
     */
    public static function getQuotaSummary(PDO $db, $userId, $month = null) {
        self::ensureSchema($db);

        $monthStr = $month ?: date('Y-m');
        $startOfMonth = "{$monthStr}-01";
        $endOfMonth = date('Y-m-t', strtotime($startOfMonth));

        // 1. Fetch employee student status & quota safely
        $cols = [];
        try {
            $cols = $db->query("SHOW COLUMNS FROM `employees`")->fetchAll(PDO::FETCH_COLUMN);
        } catch (Throwable $e) {}

        if (in_array('is_student', $cols)) {
            $empStmt = $db->prepare("
                SELECT is_student, student_leave_quota, student_institution, institution_type, student_level 
                FROM employees 
                WHERE user_id = :uid 
                LIMIT 1
            ");
            $empStmt->execute([':uid' => $userId]);
            $emp = $empStmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $emp = [
                'is_student' => 0, 
                'student_leave_quota' => 3, 
                'student_institution' => null,
                'institution_type' => 'College',
                'student_level' => null
            ];
        }

        $isStudent = !empty($emp['is_student']);
        $monthlyQuota = !empty($emp['student_leave_quota']) ? intval($emp['student_leave_quota']) : 3;
        $institution = $emp['student_institution'] ?? '';
        $institutionType = $emp['institution_type'] ?? 'College';
        $studentLevel = $emp['student_level'] ?? '';

        if (!$isStudent) {
            return [
                'is_student'       => false,
                'institution'      => '',
                'institution_type' => '',
                'student_level'    => '',
                'monthly_quota'    => 0,
                'approved_days'    => 0,
                'pending_days'     => 0,
                'used_days'        => 0,
                'remaining_days'   => 0,
                'current_month'    => $monthStr
            ];
        }

        // 2. Count approved and pending student academic leaves in this month
        $leaveStmt = $db->prepare("
            SELECT start_date, end_date, status 
            FROM leave_requests 
            WHERE user_id = :uid 
              AND type = 'Student Academic Leave'
              AND status IN ('Approved', 'Pending')
              AND start_date <= :end_month 
              AND end_date >= :start_month
        ");
        $leaveStmt->execute([
            ':uid'         => $userId,
            ':start_month' => $startOfMonth,
            ':end_month'   => $endOfMonth
        ]);
        $leaves = $leaveStmt->fetchAll(PDO::FETCH_ASSOC);

        $approvedDaysMap = [];
        $pendingDaysMap = [];

        foreach ($leaves as $lv) {
            $cur = strtotime(max($startOfMonth, $lv['start_date']));
            $end = strtotime(min($endOfMonth, $lv['end_date']));

            while ($cur <= $end) {
                // Exclude Fridays (Day 5 in ISO-8601 where Monday=1, Friday=5) as standard off-day
                if (date('N', $cur) != 5) {
                    $dStr = date('Y-m-d', $cur);
                    if ($lv['status'] === 'Approved') {
                        $approvedDaysMap[$dStr] = true;
                    } else if ($lv['status'] === 'Pending') {
                        $pendingDaysMap[$dStr] = true;
                    }
                }
                $cur = strtotime('+1 day', $cur);
            }
        }

        $approvedCount = count($approvedDaysMap);
        $pendingCount  = count($pendingDaysMap);
        $totalUsed     = $approvedCount + $pendingCount;
        $remaining     = max(0, $monthlyQuota - $totalUsed);

        return [
            'is_student'       => true,
            'institution'      => $institution,
            'institution_type' => $institutionType,
            'student_level'    => $studentLevel,
            'monthly_quota'    => $monthlyQuota,
            'approved_days'    => $approvedCount,
            'pending_days'     => $pendingCount,
            'used_days'        => $totalUsed,
            'remaining_days'   => $remaining,
            'current_month'    => $monthStr
        ];
    }
}
