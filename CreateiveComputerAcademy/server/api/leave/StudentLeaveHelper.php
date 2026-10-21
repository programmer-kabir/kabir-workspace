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
                SELECT is_student, student_leave_quota, student_institution 
                FROM employees 
                WHERE user_id = :uid 
                LIMIT 1
            ");
            $empStmt->execute([':uid' => $userId]);
            $emp = $empStmt->fetch(PDO::FETCH_ASSOC);
        } else {
            $emp = ['is_student' => 0, 'student_leave_quota' => 3, 'student_institution' => null];
        }

        $isStudent = !empty($emp['is_student']);
        $monthlyQuota = !empty($emp['student_leave_quota']) ? intval($emp['student_leave_quota']) : 3;
        $institution = $emp['student_institution'] ?? '';

        if (!$isStudent) {
            return [
                'is_student'       => false,
                'institution'      => '',
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
            'monthly_quota'    => $monthlyQuota,
            'approved_days'    => $approvedCount,
            'pending_days'     => $pendingCount,
            'used_days'        => $totalUsed,
            'remaining_days'   => $remaining,
            'current_month'    => $monthStr
        ];
    }
}
