<?php
// server/api/security_deposit/SecurityDepositHelper.php

/**
 * SecurityDepositHelper
 * Manages Staff Security Deposit (জামানত) configuration, ledger audit trails,
 * and Option A monthly earnings split:
 * (Living allowance threshold to staff in hand, surplus to security deposit vault until 100% fulfilled).
 */
class SecurityDepositHelper {

    /**
     * Self-healing JIT schema migration for staff security deposits
     */
    public static function ensureSchema($pdo) {
        if (!$pdo) return;

        try {
            // 1. staff_security_deposits (Main deposit configuration and balance per user)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `staff_security_deposits` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL UNIQUE,
                    `target_amount` DECIMAL(10,2) NOT NULL DEFAULT 50000.00,
                    `collected_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `monthly_living_allowance` DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
                    `status` ENUM('active', 'fulfilled', 'exempt', 'paused') NOT NULL DEFAULT 'active',
                    `fulfilled_at` DATETIME NULL,
                    `initial_offline_deposit` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `notes` TEXT NULL,
                    `created_by` INT NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_user_status` (`user_id`, `status`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. staff_security_deposit_ledger (Monthly audit trail of deposit deductions)
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `staff_security_deposit_ledger` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `deposit_id` INT NOT NULL,
                    `user_id` INT NOT NULL,
                    `entry_type` ENUM('monthly_surplus', 'offline_cash', 'manual_adjustment', 'refund') NOT NULL DEFAULT 'monthly_surplus',
                    `entry_date` DATE NULL,
                    `month_key` VARCHAR(7) NOT NULL,
                    `monthly_earned` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `living_allowance` DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
                    `deducted_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `take_home_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `running_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `notes` VARCHAR(255) NULL,
                    `created_by` INT NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_user_date` (`user_id`, `entry_date`),
                    INDEX `idx_deposit_id` (`deposit_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // Self-healing migrations for staff_security_deposit_ledger
            try {
                $idxCheck = $pdo->query("SHOW INDEX FROM `staff_security_deposit_ledger` WHERE Key_name = 'idx_user_month' AND Non_unique = 0");
                if ($idxCheck && $idxCheck->fetch()) {
                    $pdo->exec("ALTER TABLE `staff_security_deposit_ledger` DROP INDEX `idx_user_month`");
                    $pdo->exec("ALTER TABLE `staff_security_deposit_ledger` ADD INDEX `idx_user_month` (`user_id`, `month_key`)");
                }
            } catch (Throwable $e) {}

            try {
                $colCheck = $pdo->query("SHOW COLUMNS FROM `staff_security_deposit_ledger` LIKE 'entry_type'");
                if ($colCheck && !$colCheck->fetch()) {
                    $pdo->exec("ALTER TABLE `staff_security_deposit_ledger` ADD COLUMN `entry_type` ENUM('monthly_surplus', 'offline_cash', 'manual_adjustment', 'refund') NOT NULL DEFAULT 'monthly_surplus' AFTER `user_id`");
                }
            } catch (Throwable $e) {}

            try {
                $colCheck = $pdo->query("SHOW COLUMNS FROM `staff_security_deposit_ledger` LIKE 'entry_date'");
                if ($colCheck && !$colCheck->fetch()) {
                    $pdo->exec("ALTER TABLE `staff_security_deposit_ledger` ADD COLUMN `entry_date` DATE NULL AFTER `entry_type`");
                }
            } catch (Throwable $e) {}

            try {
                $colCheck = $pdo->query("SHOW COLUMNS FROM `staff_security_deposit_ledger` LIKE 'created_by'");
                if ($colCheck && !$colCheck->fetch()) {
                    $pdo->exec("ALTER TABLE `staff_security_deposit_ledger` ADD COLUMN `created_by` INT NULL AFTER `notes`");
                }
            } catch (Throwable $e) {}
        } catch (Throwable $e) {
            error_log('SecurityDepositHelper::ensureSchema error: ' . $e->getMessage());
        }
    }

    /**
     * Fetch deposit record for a user
     */
    public static function getDepositRecord($pdo, $userId) {
        if (!$pdo || $userId <= 0) return null;
        self::ensureSchema($pdo);

        try {
            $stmt = $pdo->prepare("SELECT * FROM `staff_security_deposits` WHERE `user_id` = :uid LIMIT 1");
            $stmt->execute([':uid' => $userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (Throwable $e) {
            error_log('SecurityDepositHelper::getDepositRecord error: ' . $e->getMessage());
            return null;
        }
    }

    public static function calculateOptionASplit($depositRecord, $monthlyEarned) {
        $earned = max(0.0, floatval($monthlyEarned));

        // If no deposit record or exempt: Full earnings to staff
        if (!$depositRecord || $depositRecord['status'] === 'exempt') {
            return [
                'has_deposit' => false,
                'status' => 'exempt',
                'monthly_earned' => $earned,
                'take_home_amount' => $earned,
                'deducted_amount' => 0.0,
                'living_allowance' => 0.0,
                'surplus_earned' => 0.0,
                'is_fulfilled' => true,
                'remaining_goal' => 0.0,
            ];
        }

        $target = max(0.0, floatval($depositRecord['target_amount'] ?? 0));
        $collected = max(0.0, floatval($depositRecord['collected_amount'] ?? 0));
        $allowance = max(0.0, floatval($depositRecord['monthly_living_allowance'] ?? 0));
        if ($allowance <= 0) {
            $allowance = 5000.0;
        }
        $remaining = max(0.0, $target - $collected);

        // If already fulfilled or target <= 0
        if ($depositRecord['status'] === 'fulfilled' || $remaining <= 0.0) {
            return [
                'has_deposit' => true,
                'status' => 'fulfilled',
                'monthly_earned' => $earned,
                'take_home_amount' => $earned,
                'deducted_amount' => 0.0,
                'living_allowance' => $allowance,
                'surplus_earned' => max(0.0, $earned - $allowance),
                'is_fulfilled' => true,
                'remaining_goal' => 0.0,
            ];
        }

        // Active deposit calculation:
        // Case 1: Earned is within living allowance
        if ($earned <= $allowance) {
            return [
                'has_deposit' => true,
                'status' => 'active',
                'monthly_earned' => $earned,
                'take_home_amount' => $earned,
                'deducted_amount' => 0.0,
                'living_allowance' => $allowance,
                'surplus_earned' => 0.0,
                'is_fulfilled' => false,
                'remaining_goal' => $remaining,
            ];
        }

        // Case 2: Earned exceeds living allowance -> split surplus
        $surplus = $earned - $allowance;
        $deducted = min($surplus, $remaining);
        $takeHome = $earned - $deducted;
        $willFulfill = ($collected + $deducted >= $target);

        return [
            'has_deposit' => true,
            'status' => $willFulfill ? 'fulfilled' : 'active',
            'monthly_earned' => $earned,
            'take_home_amount' => round($takeHome, 2),
            'deducted_amount' => round($deducted, 2),
            'living_allowance' => $allowance,
            'surplus_earned' => round($surplus, 2),
            'is_fulfilled' => $willFulfill,
            'remaining_goal' => max(0.0, round($remaining - $deducted, 2)),
        ];
    }

    /**
     * Get full comprehensive security deposit profile for user
     */
    public static function getDepositSummaryForUser($pdo, $userId, $currentMonthEarned = 0.0, $currentMonthKey = null) {
        if (!$pdo || $userId <= 0) {
            return ['has_deposit' => false, 'status' => 'exempt'];
        }

        $record = self::getDepositRecord($pdo, $userId);
        if (!$record) {
            return [
                'has_deposit' => false,
                'status' => 'exempt',
                'status_label' => 'ফুল বেতন (No Deposit)',
            ];
        }

        $target = floatval($record['target_amount']);
        $collected = floatval($record['collected_amount']);
        $allowance = floatval($record['monthly_living_allowance'] ?? 0);
        if ($allowance <= 0) {
            try {
                $stmtScheme = $pdo->prepare("SELECT salary_amount FROM staff_pay_schemes WHERE user_id = :uid AND status = 'active' ORDER BY id DESC LIMIT 1");
                $stmtScheme->execute([':uid' => $userId]);
                $sch = $stmtScheme->fetch(PDO::FETCH_ASSOC);
                $allowance = ($sch && floatval($sch['salary_amount']) > 0) ? floatval($sch['salary_amount']) : 5000.0;
            } catch (Throwable $e) {
                $allowance = 5000.0;
            }
        }
        $record['monthly_living_allowance'] = $allowance;
        $remaining = max(0.0, $target - $collected);
        $isFulfilled = ($record['status'] === 'fulfilled' || ($target > 0 && $collected >= $target));
        $progressPercent = $target > 0 ? min(100.0, round(($collected / $target) * 100, 1)) : 100.0;

        $split = self::calculateOptionASplit($record, $currentMonthEarned);

        // Fetch recent ledger deductions (date-wise audit trail)
        $ledger = [];
        try {
            $stmt = $pdo->prepare("
                SELECT id, deposit_id, user_id, entry_type, entry_date, month_key,
                       monthly_earned, living_allowance, deducted_amount, take_home_amount,
                       running_total, notes, created_by, created_at
                FROM `staff_security_deposit_ledger`
                WHERE `user_id` = :uid
                ORDER BY `created_at` DESC, `id` DESC LIMIT 50
            ");
            $stmt->execute([':uid' => $userId]);
            $ledger = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {}

        return [
            'has_deposit' => true,
            'id' => intval($record['id']),
            'user_id' => intval($record['user_id']),
            'target_amount' => $target,
            'collected_amount' => $collected,
            'remaining_amount' => $remaining,
            'monthly_living_allowance' => $allowance,
            'progress_percent' => $progressPercent,
            'status' => $record['status'],
            'is_fulfilled' => $isFulfilled,
            'fulfilled_at' => $record['fulfilled_at'],
            'initial_offline_deposit' => floatval($record['initial_offline_deposit']),
            'notes' => $record['notes'],
            'current_month_split' => $split,
            'ledger' => $ledger,
            'status_label' => $isFulfilled
                ? 'জামানত সম্পূর্ণ (100% Fulfilled)'
                : ($record['status'] === 'paused' ? 'জামানত স্থগিত (Paused)' : 'জামানত চলমান (In Progress)'),
        ];
    }

    /**
     * Save or update deposit configuration from Admin panel
     */
    public static function saveDepositConfig($pdo, $data, $adminId = null) {
        self::ensureSchema($pdo);

        $userId = intval($data['user_id'] ?? 0);
        if ($userId <= 0) {
            throw new Exception("Valid user_id is required.");
        }

        $hasDeposit = !empty($data['has_security_deposit']);
        $target = max(0.0, floatval($data['target_amount'] ?? 50000.0));
        $allowance = floatval($data['monthly_living_allowance'] ?? 0.0);
        if ($allowance <= 0) {
            try {
                $stmtScheme = $pdo->prepare("SELECT salary_amount FROM staff_pay_schemes WHERE user_id = :uid AND status = 'active' ORDER BY id DESC LIMIT 1");
                $stmtScheme->execute([':uid' => $userId]);
                $sch = $stmtScheme->fetch(PDO::FETCH_ASSOC);
                $allowance = ($sch && floatval($sch['salary_amount']) > 0) ? floatval($sch['salary_amount']) : 5000.0;
            } catch (Throwable $e) {
                $allowance = 5000.0;
            }
        }
        $offlineDeposit = max(0.0, floatval($data['initial_offline_deposit'] ?? 0.0));
        $status = trim($data['status'] ?? ($hasDeposit ? 'active' : 'exempt'));
        $notes = trim($data['notes'] ?? '');

        // If exempt/disabled
        if (!$hasDeposit) {
            $status = 'exempt';
        }

        // Check existing
        $existing = self::getDepositRecord($pdo, $userId);

        if ($existing) {
            $collected = floatval($existing['collected_amount']);

            // If offline deposit changed
            if ($offlineDeposit > 0 && abs($offlineDeposit - floatval($existing['initial_offline_deposit'])) > 0.01) {
                $diff = $offlineDeposit - floatval($existing['initial_offline_deposit']);
                $collected = max(0.0, $collected + $diff);
            }

            // Check if explicitly marked fulfilled or collected meets target
            $fulfilledAt = $existing['fulfilled_at'];
            if ($status === 'fulfilled' || ($target > 0 && $collected >= $target)) {
                $status = 'fulfilled';
                if (!$fulfilledAt) $fulfilledAt = date('Y-m-d H:i:s');
            } elseif ($status === 'active' && $collected < $target) {
                $fulfilledAt = null;
            }

            $stmt = $pdo->prepare("
                UPDATE `staff_security_deposits`
                SET `target_amount` = :target,
                    `collected_amount` = :collected,
                    `monthly_living_allowance` = :allowance,
                    `initial_offline_deposit` = :offline,
                    `status` = :status,
                    `fulfilled_at` = :fulfilled_at,
                    `notes` = :notes,
                    `updated_at` = NOW()
                WHERE `user_id` = :uid
            ");

            $stmt->execute([
                ':target' => $target,
                ':collected' => $collected,
                ':allowance' => $allowance,
                ':offline' => $offlineDeposit,
                ':status' => $status,
                ':fulfilled_at' => $fulfilledAt,
                ':notes' => $notes,
                ':uid' => $userId,
            ]);

            // If offline deposit was adjusted/increased, log an audit entry
            if (isset($diff) && $diff > 0) {
                try {
                    $stmtLedger = $pdo->prepare("
                        INSERT INTO `staff_security_deposit_ledger` (
                            `deposit_id`, `user_id`, `entry_type`, `entry_date`, `month_key`,
                            `monthly_earned`, `living_allowance`, `deducted_amount`, `take_home_amount`,
                            `running_total`, `notes`, `created_by`, `created_at`
                        ) VALUES (
                            :dep_id, :uid, 'offline_cash', :entry_date, :m_key,
                            0, :allowance, :amount, 0,
                            :running_total, :notes, :created_by, NOW()
                        )
                    ");
                    $stmtLedger->execute([
                        ':dep_id' => $existing['id'],
                        ':uid' => $userId,
                        ':entry_date' => date('Y-m-d'),
                        ':m_key' => date('Y-m'),
                        ':allowance' => $allowance,
                        ':amount' => $diff,
                        ':running_total' => $collected,
                        ':notes' => !empty($notes) ? $notes : 'অফলাইন ক্যাশ জমা সমন্বয় (Offline Cash Deposit Adjustment)',
                        ':created_by' => $adminId,
                    ]);
                } catch (Throwable $e) {
                    error_log('Error logging offline deposit adjustment: ' . $e->getMessage());
                }
            }
        } else {
            // New record
            if ($status === 'exempt' && !$hasDeposit) {
                // No need to create table row if user never had a deposit
                return ['status' => 'success', 'message' => 'User marked exempt. No deposit required.'];
            }

            $collected = $offlineDeposit;
            $fulfilledAt = ($target > 0 && $collected >= $target) ? date('Y-m-d H:i:s') : null;
            if ($fulfilledAt) $status = 'fulfilled';

            $stmt = $pdo->prepare("
                INSERT INTO `staff_security_deposits` (
                    `user_id`, `target_amount`, `collected_amount`, `monthly_living_allowance`,
                    `status`, `fulfilled_at`, `initial_offline_deposit`, `notes`, `created_by`, `created_at`
                ) VALUES (
                    :uid, :target, :collected, :allowance,
                    :status, :fulfilled_at, :offline, :notes, :created_by, NOW()
                )
            ");

            $stmt->execute([
                ':uid' => $userId,
                ':target' => $target,
                ':collected' => $collected,
                ':allowance' => $allowance,
                ':status' => $status,
                ':fulfilled_at' => $fulfilledAt,
                ':offline' => $offlineDeposit,
                ':notes' => $notes,
                ':created_by' => $adminId,
            ]);

            $newDepositId = $pdo->lastInsertId();

            // If initial offline deposit was given, log it into the ledger
            if ($offlineDeposit > 0) {
                try {
                    $stmtLedger = $pdo->prepare("
                        INSERT INTO `staff_security_deposit_ledger` (
                            `deposit_id`, `user_id`, `entry_type`, `entry_date`, `month_key`,
                            `monthly_earned`, `living_allowance`, `deducted_amount`, `take_home_amount`,
                            `running_total`, `notes`, `created_by`, `created_at`
                        ) VALUES (
                            :dep_id, :uid, 'offline_cash', :entry_date, :m_key,
                            0, :allowance, :amount, 0,
                            :running_total, :notes, :created_by, NOW()
                        )
                    ");
                    $stmtLedger->execute([
                        ':dep_id' => $newDepositId,
                        ':uid' => $userId,
                        ':entry_date' => date('Y-m-d'),
                        ':m_key' => date('Y-m'),
                        ':allowance' => $allowance,
                        ':amount' => $offlineDeposit,
                        ':running_total' => $collected,
                        ':notes' => !empty($notes) ? $notes : 'প্রারম্ভিক অফলাইন ক্যাশ জমা (Initial Offline Cash Deposit)',
                        ':created_by' => $adminId,
                    ]);
                } catch (Throwable $e) {
                    error_log('Error logging initial offline deposit: ' . $e->getMessage());
                }
            }
        }

        return [
            'status' => 'success',
            'message' => 'Security deposit configuration saved successfully.',
            'data' => self::getDepositSummaryForUser($pdo, $userId)
        ];
    }

    /**
     * Record a manual deposit or adjustment ledger entry (date-wise)
     */
    public static function recordLedgerEntry($pdo, $data, $adminId = null) {
        self::ensureSchema($pdo);

        $userId = intval($data['user_id'] ?? 0);
        $amount = floatval($data['amount'] ?? 0.0);
        $entryType = trim($data['entry_type'] ?? 'manual_adjustment');
        $entryDate = !empty($data['entry_date']) ? $data['entry_date'] : date('Y-m-d');
        $monthKey = !empty($data['month_key']) ? $data['month_key'] : substr($entryDate, 0, 7);
        $notes = trim($data['notes'] ?? '');

        if ($userId <= 0 || $amount <= 0) {
            throw new Exception("Valid user_id and amount greater than 0 are required.");
        }

        $deposit = self::getDepositRecord($pdo, $userId);
        if (!$deposit) {
            throw new Exception("No security deposit record exists for this user. Please enable security deposit first.");
        }

        $depositId = intval($deposit['id']);
        $currentCollected = floatval($deposit['collected_amount']);
        $newRunningTotal = $currentCollected + $amount;
        $target = floatval($deposit['target_amount']);
        $isFulfilled = ($target > 0 && $newRunningTotal >= $target);
        $status = $isFulfilled ? 'fulfilled' : $deposit['status'];
        $fulfilledAt = $isFulfilled ? ($deposit['fulfilled_at'] ?: date('Y-m-d H:i:s')) : null;

        // 1. Insert into staff_security_deposit_ledger
        $stmt = $pdo->prepare("
            INSERT INTO `staff_security_deposit_ledger` (
                `deposit_id`, `user_id`, `entry_type`, `entry_date`, `month_key`,
                `monthly_earned`, `living_allowance`, `deducted_amount`, `take_home_amount`,
                `running_total`, `notes`, `created_by`, `created_at`
            ) VALUES (
                :deposit_id, :user_id, :entry_type, :entry_date, :month_key,
                0, :allowance, :amount, 0,
                :running_total, :notes, :created_by, NOW()
            )
        ");
        $stmt->execute([
            ':deposit_id' => $depositId,
            ':user_id' => $userId,
            ':entry_type' => $entryType,
            ':entry_date' => $entryDate,
            ':month_key' => $monthKey,
            ':allowance' => floatval($deposit['monthly_living_allowance']),
            ':amount' => $amount,
            ':running_total' => $newRunningTotal,
            ':notes' => $notes ?: 'ম্যানুয়াল জমা এন্ট্রি (Manual Cash Entry)',
            ':created_by' => $adminId,
        ]);

        // 2. Update staff_security_deposits collected_amount and status
        $updateStmt = $pdo->prepare("
            UPDATE `staff_security_deposits`
            SET `collected_amount` = :collected,
                `status` = :status,
                `fulfilled_at` = :fulfilled_at,
                `updated_at` = NOW()
            WHERE `id` = :id
        ");
        $updateStmt->execute([
            ':collected' => $newRunningTotal,
            ':status' => $status,
            ':fulfilled_at' => $fulfilledAt,
            ':id' => $depositId,
        ]);

        return [
            'status' => 'success',
            'message' => 'Deposit ledger entry recorded successfully.',
            'running_total' => $newRunningTotal,
            'is_fulfilled' => $isFulfilled,
            'data' => self::getDepositSummaryForUser($pdo, $userId)
        ];
    }

    /**
     * Fetch all security deposits for Admin dashboard
     */
    public static function getAllDepositsMap($pdo) {
        if (!$pdo) return [];
        self::ensureSchema($pdo);

        try {
            $stmt = $pdo->query("SELECT * FROM `staff_security_deposits`");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $map = [];
            foreach ($rows as $r) {
                $uid = intval($r['user_id']);
                $target = floatval($r['target_amount']);
                $collected = floatval($r['collected_amount']);
                $isFulfilled = ($r['status'] === 'fulfilled' || ($target > 0 && $collected >= $target));
                $map[$uid] = [
                    'id' => intval($r['id']),
                    'user_id' => $uid,
                    'target_amount' => $target,
                    'collected_amount' => $collected,
                    'remaining_amount' => max(0.0, $target - $collected),
                    'monthly_living_allowance' => floatval($r['monthly_living_allowance']),
                    'progress_percent' => $target > 0 ? min(100.0, round(($collected / $target) * 100, 1)) : 100.0,
                    'status' => $r['status'],
                    'is_fulfilled' => $isFulfilled,
                    'fulfilled_at' => $r['fulfilled_at'],
                    'initial_offline_deposit' => floatval($r['initial_offline_deposit']),
                    'notes' => $r['notes']
                ];
            }
            return $map;
        } catch (Throwable $e) {
            error_log('SecurityDepositHelper::getAllDepositsMap error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Fetch all staff members with full deposit breakdown and ledger statistics
     * for the Admin Security Deposit Master View
     */
    public static function getAllDepositsDetailed($pdo) {
        if (!$pdo) return [];
        self::ensureSchema($pdo);

        try {
            $sql = "
                SELECT 
                    u.id AS user_id,
                    u.name,
                    u.email,
                    u.profile_picture,
                    e.designation,
                    d.name AS department_name,
                    ps.salary_amount,
                    ps.scheme_type,
                    ssd.id AS deposit_id,
                    ssd.target_amount,
                    ssd.collected_amount,
                    ssd.monthly_living_allowance,
                    ssd.status AS deposit_status,
                    ssd.fulfilled_at,
                    ssd.initial_offline_deposit,
                    ssd.notes AS deposit_notes,
                    (
                        SELECT COUNT(*) FROM staff_security_deposit_ledger 
                        WHERE user_id = u.id
                    ) AS ledger_entries_count,
                    (
                        SELECT MAX(created_at) FROM staff_security_deposit_ledger 
                        WHERE user_id = u.id
                    ) AS last_deposit_date,
                    (
                        SELECT deducted_amount FROM staff_security_deposit_ledger 
                        WHERE user_id = u.id ORDER BY id DESC LIMIT 1
                    ) AS last_deposit_amount
                FROM users u
                LEFT JOIN employees e ON u.id = e.user_id
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN staff_pay_schemes ps ON ps.id = (
                    SELECT id FROM staff_pay_schemes WHERE user_id = u.id ORDER BY id DESC LIMIT 1
                )
                LEFT JOIN staff_security_deposits ssd ON ssd.user_id = u.id
                WHERE u.status = 'active'
                ORDER BY 
                    CASE 
                        WHEN ssd.status = 'active' THEN 1 
                        WHEN ssd.status = 'fulfilled' THEN 2 
                        ELSE 3 
                    END,
                    ssd.collected_amount DESC,
                    u.name ASC
            ";

            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $detailedList = [];
            foreach ($rows as $r) {
                $hasDeposit = !empty($r['deposit_id']) && ($r['deposit_status'] !== 'exempt');
                $target = floatval($r['target_amount'] ?? 0);
                $collected = floatval($r['collected_amount'] ?? 0);
                $remaining = max(0.0, $target - $collected);
                $progressPercent = $target > 0 ? min(100.0, round(($collected / $target) * 100, 1)) : 100.0;
                $isFulfilled = ($r['deposit_status'] === 'fulfilled' || ($target > 0 && $collected >= $target));

                $detailedList[] = [
                    'user_id' => intval($r['user_id']),
                    'name' => $r['name'],
                    'email' => $r['email'],
                    'profile_picture' => $r['profile_picture'],
                    'designation' => $r['designation'] ?: 'Staff Member',
                    'department_name' => $r['department_name'] ?: 'CCA',
                    'monthly_salary' => floatval($r['salary_amount'] ?? 0),
                    'has_deposit' => $hasDeposit,
                    'deposit_id' => $r['deposit_id'] ? intval($r['deposit_id']) : null,
                    'target_amount' => $target,
                    'collected_amount' => $collected,
                    'remaining_amount' => $remaining,
                    'monthly_living_allowance' => floatval($r['monthly_living_allowance'] ?: $r['salary_amount'] ?: 5000),
                    'progress_percent' => $progressPercent,
                    'status' => $r['deposit_status'] ?: 'exempt',
                    'is_fulfilled' => $isFulfilled,
                    'fulfilled_at' => $r['fulfilled_at'],
                    'initial_offline_deposit' => floatval($r['initial_offline_deposit'] ?? 0),
                    'last_deposit_date' => $r['last_deposit_date'],
                    'last_deposit_amount' => floatval($r['last_deposit_amount'] ?? 0),
                    'ledger_entries_count' => intval($r['ledger_entries_count'] ?? 0),
                    'notes' => $r['deposit_notes']
                ];
            }

            return $detailedList;

        } catch (Throwable $e) {
            error_log('SecurityDepositHelper::getAllDepositsDetailed error: ' . $e->getMessage());
            return [];
        }
    }
}

