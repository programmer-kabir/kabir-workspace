<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../notifications/notification_helper.php';
require_once __DIR__ . '/OvertimeEngine.php';
require_once __DIR__ . '/PayrollSync.php';
require_once __DIR__ . '/PayrollRoadmap.php';
require_once __DIR__ . '/PayrollWithdrawal.php';
require_once __DIR__ . '/PayrollLedger.php';

class PayrollHelper {
    public static function ensureSchema($pdo) {
        if (!$pdo instanceof PDO) return;
        try {
            // 1. payroll_cycle_controls table
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `payroll_cycle_controls` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `month_key` VARCHAR(7) NOT NULL UNIQUE,
                    `is_unlocked` TINYINT(1) NOT NULL DEFAULT 0,
                    `unlocked_at` DATETIME NULL,
                    `unlocked_by` INT NULL,
                    `notes` TEXT NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. staff_withdrawals covered_months and invoice_ids
            $wCols = $pdo->query("SHOW COLUMNS FROM `staff_withdrawals`")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('covered_months', $wCols)) {
                $pdo->exec("ALTER TABLE `staff_withdrawals` ADD COLUMN `covered_months` VARCHAR(255) NULL AFTER `overtime_hours_cashed`");
            }
            if (!in_array('invoice_ids', $wCols)) {
                $pdo->exec("ALTER TABLE `staff_withdrawals` ADD COLUMN `invoice_ids` TEXT NULL AFTER `covered_months`");
            }

            // 3. staff_contract_tiers table for Staggered / Graduated Salary Schemes
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS `staff_contract_tiers` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `scheme_id` INT NOT NULL,
                    `user_id` INT NOT NULL,
                    `tier_number` TINYINT NOT NULL DEFAULT 1,
                    `tier_name` VARCHAR(100) NOT NULL,
                    `start_month_index` INT NOT NULL DEFAULT 1,
                    `end_month_index` INT NOT NULL DEFAULT 3,
                    `monthly_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    `hourly_rate` DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
                    `working_days_per_month` INT NOT NULL DEFAULT 26,
                    `standard_daily_hours` DECIMAL(4,2) NOT NULL DEFAULT 8.00,
                    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX `idx_scheme_id` (`scheme_id`),
                    INDEX `idx_user_tier` (`user_id`, `tier_number`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 4. Update staff_pay_schemes scheme_type to support STAGGERED_CONTRACT
            $pdo->exec("ALTER TABLE `staff_pay_schemes` MODIFY COLUMN `scheme_type` VARCHAR(30) NOT NULL DEFAULT 'MONTHLY'");

            // 5. Staff Security Deposit (জামানত) schema
            require_once __DIR__ . '/../security_deposit/SecurityDepositHelper.php';
            SecurityDepositHelper::ensureSchema($pdo);

            // 6. Self-healing alignment: Sync shift_hours from employees table (e.g. 6h for Jahidul & Kalam, 8h for others)
            try {
                $pdo->exec("
                    UPDATE staff_pay_schemes ps
                    JOIN employees e ON ps.user_id = e.user_id
                    SET ps.standard_daily_hours = COALESCE(e.shift_hours, 8.0)
                    WHERE ps.status = 'active' AND e.shift_hours IS NOT NULL AND e.shift_hours > 0
                ");
            } catch (Throwable $eSync) {}

            $schemesToUpdate = $pdo->query("SELECT id, scheme_type, salary_amount, contract_amount, working_days_per_month, standard_daily_hours, contract_duration_months, hourly_rate FROM staff_pay_schemes WHERE status = 'active'")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($schemesToUpdate as $sch) {
                $empShift = floatval($sch['standard_daily_hours'] ?: 8.0);
                $calcRate = self::calculateHourlyRate(
                    $sch['scheme_type'],
                    $sch['salary_amount'],
                    $sch['contract_amount'],
                    $sch['working_days_per_month'] ?: 26,
                    $empShift,
                    $sch['contract_duration_months'] ?: 12
                );
                if (abs(floatval($sch['hourly_rate']) - $calcRate) > 0.001) {
                    $uStmt = $pdo->prepare("UPDATE staff_pay_schemes SET hourly_rate = :rate WHERE id = :id");
                    $uStmt->execute([':rate' => $calcRate, ':id' => $sch['id']]);
                }
            }
        } catch (Throwable $e) {
            error_log('PayrollHelper::ensureSchema error: ' . $e->getMessage());
        }
    }

    /**
     * Map daily hours to standard shift minutes (e.g. 8.0h = 480m, 6.0h = 360m).
     * Allocated 40-minute paid break is included in the shift. Any excess break beyond 40m is deducted.
     */
    public static function getStandardDailyMinutes($dailyHours) {
        $dh = floatval($dailyHours);
        if ($dh <= 0 || abs($dh - 8.0) < 0.05) {
            return 480; // Standard 8h shift (480 mins)
        } elseif (abs($dh - 7.0) < 0.05) {
            return 420;
        } elseif (abs($dh - 6.0) < 0.05) {
            return 360; // Standard 6h shift (360 mins) for 6-hour staff
        } elseif (abs($dh - 5.0) < 0.05) {
            return 300;
        }
        return max(60, intval(round($dh * 60)));
    }

    /**
     * Calculate hourly rate based on scheme parameters
     */
    public static function calculateHourlyRate($schemeType, $salaryAmount, $contractAmount, $workingDays = 26, $dailyHours = 8.0, $durationMonths = 12) {
        $workingDays = max(1, intval($workingDays));
        $dailyHours = max(0.1, floatval($dailyHours));
        $durationMonths = max(1, intval($durationMonths));

        $dailyMins = self::getStandardDailyMinutes($dailyHours);
        $effectiveDailyHours = $dailyMins / 60.0; // 8.0 hours

        if ($schemeType === 'YEARLY_CONTRACT') {
            $amount = floatval($contractAmount);
            $totalHours = $workingDays * $durationMonths * $effectiveDailyHours;
            if ($totalHours <= 0) return 0.0;
            return round($amount / $totalHours, 6);
        } elseif ($schemeType === 'STAGGERED_CONTRACT') {
            $amount = floatval($salaryAmount > 0 ? $salaryAmount : 3500.0);
            $monthlyHours = $workingDays * $effectiveDailyHours;
            if ($monthlyHours <= 0) return 0.0;
            return round($amount / $monthlyHours, 6);
        } else {
            // MONTHLY
            $amount = floatval($salaryAmount);
            $monthlyHours = $workingDays * $effectiveDailyHours;
            if ($monthlyHours <= 0) return 0.0;
            return round($amount / $monthlyHours, 6);
        }
    }

    /**
     * Get active pay scheme for a user
     */
    public static function getActiveScheme($pdo, $userId) {
        $stmt = $pdo->prepare("
            SELECT * FROM staff_pay_schemes 
            WHERE user_id = :user_id AND status = 'active'
            ORDER BY id DESC LIMIT 1
        ");
        $stmt->execute([':user_id' => $userId]);
        $scheme = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$scheme) {
            // Check if there is any scheme (e.g. recently expired/completed)
            $stmtLast = $pdo->prepare("
                SELECT * FROM staff_pay_schemes 
                WHERE user_id = :user_id 
                ORDER BY id DESC LIMIT 1
            ");
            $stmtLast->execute([':user_id' => $userId]);
            $scheme = $stmtLast->fetch(PDO::FETCH_ASSOC);
        }

        return $scheme ?: null;
    }

    /**
     * Fetch contract tiers for a scheme (delegated to PayrollRoadmap)
     */
    public static function getContractTiers($pdo, $schemeId) {
        return PayrollRoadmap::getContractTiers($pdo, $schemeId);
    }

    /**
     * Save/replace contract tiers for a scheme (delegated to PayrollRoadmap)
     */
    public static function saveContractTiers($pdo, $schemeId, $userId, $tiers, $workingDays = 26, $dailyHours = 8.0) {
        return PayrollRoadmap::saveContractTiers($pdo, $schemeId, $userId, $tiers, $workingDays, $dailyHours);
    }

    /**
     * Resolve the active tier and rate for a specific date or YYYY-MM (delegated to PayrollRoadmap)
     */
    public static function getTierInfoForMonth($scheme, $dateOrMonth, $tiers = null) {
        return PayrollRoadmap::getTierInfoForMonth($scheme, $dateOrMonth, $tiers);
    }

    /**
     * Build visual roadmap object for Staggered Contracts (delegated to PayrollRoadmap)
     */
    public static function buildContractRoadmap($scheme, $tiers, $totalEarned, $pdo = null, $userId = null) {
        return PayrollRoadmap::buildContractRoadmap($scheme, $tiers, $totalEarned, $pdo, $userId);
    }

    /**
     * Sync attendance records into staff_work_earnings for a user or scheme
     * (Delegated to dedicated PayrollSync engine)
     */
    public static function syncAttendanceEarnings($pdo, $userId = null, $schemeId = null) {
        return PayrollSync::syncAttendanceEarnings($pdo, $userId, $schemeId);
    }

    /**
     * Get complete staff wallet & progress summary
     */
    public static function getStaffWalletSummary($pdo, $userId, $autoSync = true) {
        return PayrollLedger::getStaffWalletSummary($pdo, $userId, $autoSync);
    }

    /**
     * Record an approved work-time earning session
     */
    public static function recordWorkTimeEarning($pdo, $userId, $approvedMinutes, $sourceType = 'timer', $referenceId = null, $notes = null, $workDate = null, $sessionStart = null, $sessionEnd = null) {
        $approvedMinutes = max(1, intval($approvedMinutes));
        $scheme = self::getActiveScheme($pdo, $userId);

        if (!$scheme) {
            throw new Exception("No active pay scheme configured for user ID: {$userId}");
        }

        $schemeId = $scheme['id'];
        $workDate = $workDate ?: date('Y-m-d');
        $sessionStart = $sessionStart ?: date('Y-m-d H:i:s', strtotime("-{$approvedMinutes} minutes"));
        $sessionEnd = $sessionEnd ?: date('Y-m-d H:i:s');

        // Resolve active tier rate if staggered contract
        $tiers = self::getContractTiers($pdo, $schemeId);
        $tierInfo = self::getTierInfoForMonth($scheme, $workDate, $tiers);
        $hourlyRate = $tierInfo['hourly_rate'] ?: floatval($scheme['hourly_rate']);

        // Check if contract is expired
        if (!empty($scheme['contract_end_date']) && $workDate > $scheme['contract_end_date']) {
            throw new Exception("The pay scheme contract ended on {$scheme['contract_end_date']}. Please contact admin for renewal.");
        }

        // Exact earned amount
        $earnedAmount = round(($approvedMinutes / 60.0) * $hourlyRate, 2);

        // Check surplus status for Yearly Contract
        $isSurplus = 0;
        if ($scheme['scheme_type'] === 'YEARLY_CONTRACT') {
            $contractTarget = floatval($scheme['contract_amount']);
            // Get prior total earned
            $stmtPrior = $pdo->prepare("SELECT COALESCE(SUM(earned_amount), 0) FROM staff_work_earnings WHERE scheme_id = :scheme_id");
            $stmtPrior->execute([':scheme_id' => $schemeId]);
            $priorEarned = floatval($stmtPrior->fetchColumn());

            if ($priorEarned >= $contractTarget) {
                $isSurplus = 1;
            } elseif (($priorEarned + $earnedAmount) >= $contractTarget) {
                // Just completed the company target!
                $isSurplus = 1;
                // Send milestone notification to staff
                try {
                    NotificationHelper::sendToUser(
                        $pdo,
                        $userId,
                        null,
                        "🎉 Company Contract Target Completed!",
                        "Congratulations! You have successfully completed your ৳" . number_format($contractTarget) . " Company Target. All future work earnings are now 100% your withdrawable surplus!",
                        "success",
                        "staff"
                    );
                } catch (Exception $e) {
                    // Non-blocking
                }
            }
        }

        // Insert into staff_work_earnings
        $stmtInsert = $pdo->prepare("
            INSERT INTO staff_work_earnings (
                user_id, scheme_id, work_date, session_start, session_end, 
                approved_minutes, applied_rate, earned_amount, is_surplus, 
                source_type, reference_id, notes, created_at
            ) VALUES (
                :user_id, :scheme_id, :work_date, :session_start, :session_end, 
                :approved_minutes, :applied_rate, :earned_amount, :is_surplus, 
                :source_type, :reference_id, :notes, NOW()
            )
        ");

        $stmtInsert->execute([
            ':user_id' => $userId,
            ':scheme_id' => $schemeId,
            ':work_date' => $workDate,
            ':session_start' => $sessionStart,
            ':session_end' => $sessionEnd,
            ':approved_minutes' => $approvedMinutes,
            ':applied_rate' => $hourlyRate,
            ':earned_amount' => $earnedAmount,
            ':is_surplus' => $isSurplus,
            ':source_type' => $sourceType,
            ':reference_id' => $referenceId,
            ':notes' => $notes,
        ]);

        $earningId = $pdo->lastInsertId();

        return [
            'earning_id' => $earningId,
            'approved_minutes' => $approvedMinutes,
            'applied_rate' => $hourlyRate,
            'earned_amount' => $earnedAmount,
            'is_surplus' => $isSurplus,
            'wallet_summary' => self::getStaffWalletSummary($pdo, $userId)
        ];
    }

    /**
     * Check and send maturity notification to staff on 15th once per cycle
     * (Delegated to dedicated PayrollWithdrawal engine)
     */
    public static function checkAndSendMaturityNotification($pdo, $userId, $availableAmount, $fractionalRollover) {
        return PayrollWithdrawal::checkAndSendMaturityNotification($pdo, $userId, $availableAmount, $fractionalRollover);
    }

    /**
     * Request a withdrawal (supports base salary + optional overtime cashout)
     * (Delegated to dedicated PayrollWithdrawal engine)
     */
    public static function requestWithdrawal($pdo, $userId, $amount, $paymentMethod, $accountDetails, $overtimeHoursToCash = 0.0) {
        return PayrollWithdrawal::requestWithdrawal($pdo, $userId, $amount, $paymentMethod, $accountDetails, $overtimeHoursToCash);
    }
}
?>