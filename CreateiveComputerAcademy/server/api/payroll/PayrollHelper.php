<?php
// server/api/payroll/PayrollHelper.php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../notifications/notification_helper.php';

class PayrollHelper {

    /**
     * Calculate hourly rate based on scheme parameters
     */
    public static function calculateHourlyRate($schemeType, $salaryAmount, $contractAmount, $workingDays = 26, $dailyHours = 8.0, $durationMonths = 12) {
        $workingDays = max(1, intval($workingDays));
        $dailyHours = max(0.1, floatval($dailyHours));
        $durationMonths = max(1, intval($durationMonths));

        if ($schemeType === 'YEARLY_CONTRACT') {
            $amount = floatval($contractAmount);
            $totalHours = $workingDays * $durationMonths * $dailyHours;
            if ($totalHours <= 0) return 0.0;
            return round($amount / $totalHours, 6);
        } else {
            // MONTHLY
            $amount = floatval($salaryAmount);
            $monthlyHours = $workingDays * $dailyHours;
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
     * Sync attendance records into staff_work_earnings for a user or scheme
     */
    public static function syncAttendanceEarnings($pdo, $userId = null, $schemeId = null) {
        $schemes = [];
        if ($schemeId) {
            $stmt = $pdo->prepare("SELECT * FROM staff_pay_schemes WHERE id = :id AND status = 'active'");
            $stmt->execute([':id' => $schemeId]);
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM staff_pay_schemes WHERE user_id = :user_id AND status = 'active' ORDER BY id DESC");
            $stmt->execute([':user_id' => $userId]);
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $pdo->query("SELECT * FROM staff_pay_schemes WHERE status = 'active' ORDER BY id DESC");
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $totalSyncedSessions = 0;
        $totalSyncedAmount = 0.0;

        foreach ($schemes as $scheme) {
            $sId = $scheme['id'];
            $uId = $scheme['user_id'];
            $startDate = $scheme['contract_start_date'];
            $endDate = !empty($scheme['contract_end_date']) ? $scheme['contract_end_date'] : null;
            $hourlyRate = floatval($scheme['hourly_rate']);

            // Find all attendance records within contract period
            $sql = "
                SELECT id, user_id, date, check_in, check_out, status
                FROM attendance
                WHERE user_id = :user_id
                  AND date >= :start_date
                  " . ($endDate ? "AND date <= :end_date" : "") . "
                  AND check_in IS NOT NULL AND check_in != ''
                  AND check_out IS NOT NULL AND check_out != ''
                  AND status IN ('Present', 'Late', 'Half Day')
                ORDER BY date ASC, check_in ASC
            ";

            $params = [
                ':user_id' => $uId,
                ':start_date' => $startDate,
            ];
            if ($endDate) {
                $params[':end_date'] = $endDate;
            }

            $stmtAtt = $pdo->prepare($sql);
            $stmtAtt->execute($params);
            $attendances = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($attendances as $att) {
                $attId = $att['id'];
                $attDate = $att['date'];
                $checkInRaw = trim($att['check_in']);
                $checkOutRaw = trim($att['check_out']);

                // Normalize check-in / check-out timestamps
                $inTimeStr = (strpos($checkInRaw, ' ') !== false) ? $checkInRaw : ($attDate . ' ' . $checkInRaw);
                $outTimeStr = (strpos($checkOutRaw, ' ') !== false) ? $checkOutRaw : ($attDate . ' ' . $checkOutRaw);

                $inTs = strtotime($inTimeStr);
                $outTs = strtotime($outTimeStr);

                if ($outTs <= $inTs) {
                    continue; // Skip invalid or zero durations
                }

                $approvedMinutes = max(1, intval(round(($outTs - $inTs) / 60)));
                $earnedAmount = round(($approvedMinutes / 60.0) * $hourlyRate, 2);
                $sessionStart = date('Y-m-d H:i:s', $inTs);
                $sessionEnd = date('Y-m-d H:i:s', $outTs);
                $notes = "Attendance Work Session ({$att['status']}): {$checkInRaw} to {$checkOutRaw}";

                // Check if already in staff_work_earnings
                $stmtCheck = $pdo->prepare("
                    SELECT id FROM staff_work_earnings 
                    WHERE scheme_id = :scheme_id 
                      AND source_type = 'attendance' 
                      AND reference_id = :reference_id
                    LIMIT 1
                ");
                $stmtCheck->execute([
                    ':scheme_id' => $sId,
                    ':reference_id' => $attId
                ]);
                $existingEarning = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existingEarning) {
                    $stmtUpdate = $pdo->prepare("
                        UPDATE staff_work_earnings SET
                            work_date = :work_date,
                            session_start = :session_start,
                            session_end = :session_end,
                            approved_minutes = :approved_minutes,
                            applied_rate = :applied_rate,
                            earned_amount = :earned_amount,
                            notes = :notes
                        WHERE id = :id
                    ");
                    $stmtUpdate->execute([
                        ':work_date' => $attDate,
                        ':session_start' => $sessionStart,
                        ':session_end' => $sessionEnd,
                        ':approved_minutes' => $approvedMinutes,
                        ':applied_rate' => $hourlyRate,
                        ':earned_amount' => $earnedAmount,
                        ':notes' => $notes,
                        ':id' => $existingEarning['id']
                    ]);
                } else {
                    $stmtInsert = $pdo->prepare("
                        INSERT INTO staff_work_earnings (
                            user_id, scheme_id, work_date, session_start, session_end,
                            approved_minutes, applied_rate, earned_amount, is_surplus,
                            source_type, reference_id, notes, created_at
                        ) VALUES (
                            :user_id, :scheme_id, :work_date, :session_start, :session_end,
                            :approved_minutes, :applied_rate, :earned_amount, 0,
                            'attendance', :reference_id, :notes, NOW()
                        )
                    ");
                    $stmtInsert->execute([
                        ':user_id' => $uId,
                        ':scheme_id' => $sId,
                        ':work_date' => $attDate,
                        ':session_start' => $sessionStart,
                        ':session_end' => $sessionEnd,
                        ':approved_minutes' => $approvedMinutes,
                        ':applied_rate' => $hourlyRate,
                        ':earned_amount' => $earnedAmount,
                        ':reference_id' => $attId,
                        ':notes' => $notes
                    ]);
                }

                $totalSyncedSessions++;
                $totalSyncedAmount += $earnedAmount;
            }

            // Recalculate surplus flags chronologically for yearly contract schemes
            if ($scheme['scheme_type'] === 'YEARLY_CONTRACT') {
                $contractTarget = floatval($scheme['contract_amount']);
                $stmtAll = $pdo->prepare("
                    SELECT id, earned_amount 
                    FROM staff_work_earnings 
                    WHERE scheme_id = :scheme_id 
                    ORDER BY work_date ASC, session_start ASC, id ASC
                ");
                $stmtAll->execute([':scheme_id' => $sId]);
                $allEarnings = $stmtAll->fetchAll(PDO::FETCH_ASSOC);

                $runningEarned = 0.0;
                $stmtUpdateSurplus = $pdo->prepare("UPDATE staff_work_earnings SET is_surplus = :is_surplus WHERE id = :id");

                foreach ($allEarnings as $row) {
                    $rowEarned = floatval($row['earned_amount']);
                    $isSurplus = ($runningEarned >= $contractTarget) ? 1 : 0;
                    $stmtUpdateSurplus->execute([
                        ':is_surplus' => $isSurplus,
                        ':id' => $row['id']
                    ]);
                    $runningEarned += $rowEarned;
                }
            }
        }

        return [
            'status' => 'success',
            'synced_sessions' => $totalSyncedSessions,
            'synced_amount' => round($totalSyncedAmount, 2),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get complete staff wallet & progress summary
     */
    public static function getStaffWalletSummary($pdo, $userId, $autoSync = true) {
        if ($autoSync) {
            try {
                self::syncAttendanceEarnings($pdo, $userId);
            } catch (Exception $e) {
                // Non-blocking sync error log
            }
        }

        $scheme = self::getActiveScheme($pdo, $userId);

        if (!$scheme) {
            return [
                'has_scheme' => false,
                'message' => 'No active pay scheme found for this staff member.',
                'total_earned' => 0.0,
                'total_approved_minutes' => 0,
                'total_approved_hours' => 0.0,
                'available_withdrawable' => 0.0,
            ];
        }

        $schemeId = $scheme['id'];
        $schemeType = $scheme['scheme_type'];
        $hourlyRate = floatval($scheme['hourly_rate']);

        // 1. Total work earnings within this scheme
        $stmtEarn = $pdo->prepare("
            SELECT 
                COALESCE(SUM(earned_amount), 0) AS total_earned,
                COALESCE(SUM(approved_minutes), 0) AS total_minutes,
                COALESCE(COUNT(id), 0) AS total_sessions
            FROM staff_work_earnings
            WHERE scheme_id = :scheme_id
        ");
        $stmtEarn->execute([':scheme_id' => $schemeId]);
        $earnData = $stmtEarn->fetch(PDO::FETCH_ASSOC);

        $totalEarned = floatval($earnData['total_earned']);
        $totalMinutes = intval($earnData['total_minutes']);
        $totalHours = round($totalMinutes / 60, 2);

        // 2. Withdrawals summary
        $stmtWd = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount ELSE 0 END), 0) AS total_withdrawn,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending_withdrawn
            FROM staff_withdrawals
            WHERE scheme_id = :scheme_id
        ");
        $stmtWd->execute([':scheme_id' => $schemeId]);
        $wdData = $stmtWd->fetch(PDO::FETCH_ASSOC);

        $totalWithdrawn = floatval($wdData['total_withdrawn']);
        $pendingWithdrawn = floatval($wdData['pending_withdrawn']);

        // 3. Check for Live Ongoing Active Shift (Today's check-in without check-out)
        $today = date('Y-m-d');
        $stmtLive = $pdo->prepare("
            SELECT id, date, check_in 
            FROM attendance 
            WHERE user_id = :user_id 
              AND date = :today 
              AND check_in IS NOT NULL AND check_in != ''
              AND (check_out IS NULL OR check_out = '')
            LIMIT 1
        ");
        $stmtLive->execute([':user_id' => $userId, ':today' => $today]);
        $liveAttendance = $stmtLive->fetch(PDO::FETCH_ASSOC);

        $activeSession = null;
        if ($liveAttendance) {
            $liveInStr = (strpos($liveAttendance['check_in'], ' ') !== false) 
                ? $liveAttendance['check_in'] 
                : ($today . ' ' . $liveAttendance['check_in']);
            $liveInTs = strtotime($liveInStr);
            $nowTs = time();
            $liveElapsedMinutes = max(0, intval(round(($nowTs - $liveInTs) / 60)));
            $liveEarned = round(($liveElapsedMinutes / 60.0) * $hourlyRate, 2);

            $activeSession = [
                'attendance_id' => $liveAttendance['id'],
                'check_in_time' => $liveAttendance['check_in'],
                'session_start' => date('Y-m-d H:i:s', $liveInTs),
                'elapsed_minutes' => $liveElapsedMinutes,
                'elapsed_hours' => round($liveElapsedMinutes / 60, 2),
                'live_earned' => $liveEarned,
                'hourly_rate' => $hourlyRate,
            ];
        }

        // 4. Monthly Cycle & 15th Maturity Calculation
        $todayDate = date('Y-m-d');
        $currentMonth = date('Y-m'); // e.g. 2026-10
        $currentDay = intval(date('j'));

        // Next upcoming payout unlock date (15th of next month if current month ongoing)
        $nextPayoutDate = date('Y-m-15', strtotime('+1 month'));
        $daysUntilNextPayout = max(0, intval(round((strtotime($nextPayoutDate) - strtotime($todayDate)) / 86400)));

        // Fetch earnings grouped by month for this scheme
        $stmtMonthEarn = $pdo->prepare("
            SELECT 
                DATE_FORMAT(work_date, '%Y-%m') AS month_key,
                DATE_FORMAT(work_date, '%M %Y') AS month_label,
                COALESCE(SUM(earned_amount), 0) AS total_earned,
                COALESCE(SUM(CASE WHEN is_surplus = 1 THEN earned_amount ELSE 0 END), 0) AS surplus_earned,
                COALESCE(SUM(approved_minutes), 0) AS approved_minutes,
                COUNT(id) AS sessions_count,
                COUNT(DISTINCT work_date) AS days_count
            FROM staff_work_earnings
            WHERE scheme_id = :scheme_id
            GROUP BY DATE_FORMAT(work_date, '%Y-%m'), DATE_FORMAT(work_date, '%M %Y')
            ORDER BY month_key ASC
        ");
        $stmtMonthEarn->execute([':scheme_id' => $schemeId]);
        $monthlyEarningsRows = $stmtMonthEarn->fetchAll(PDO::FETCH_ASSOC);

        $maturedEarned = 0.0;
        $maturedSurplus = 0.0;
        $accruingEarned = 0.0;
        $accruingSurplus = 0.0;
        $monthlyCycleLedger = [];

        foreach ($monthlyEarningsRows as $mRow) {
            $mKey = $mRow['month_key'];
            $mEarned = floatval($mRow['total_earned']);
            $mSurplus = floatval($mRow['surplus_earned']);

            // Payout unlock date for month 'YYYY-MM' is 15th of the NEXT month (e.g. 2026-09 unlocks on 2026-10-15; 2026-10 unlocks on 2026-11-15)
            $payoutUnlockDate = date('Y-m-15', strtotime($mKey . '-01 +1 month'));

            // A month is unlocked if:
            // 1. It is a past completed month (e.g. September 2026 < October 2026) AND today >= 15th (or testing past month unlock)
            // 2. Current ongoing month (e.g. October 2026) is NEVER unlocked until November 15th!
            $isUnlocked = ($mKey < $currentMonth);

            if ($isUnlocked) {
                $maturedEarned += $mEarned;
                $maturedSurplus += $mSurplus;
                $status = 'unlocked';
            } else {
                $accruingEarned += $mEarned;
                $accruingSurplus += $mSurplus;
                $status = 'accruing';
            }

            $monthlyCycleLedger[] = [
                'invoice_id' => 'CCA-PS-' . str_replace('-', '', $mKey) . '-' . $userId,
                'month_key' => $mKey,
                'month_label' => $mRow['month_label'],
                'total_earned' => $mEarned,
                'surplus_earned' => $mSurplus,
                'invoice_integer_amount' => floor($mEarned),
                'fractional_rollover' => round($mEarned - floor($mEarned), 2),
                'approved_minutes' => intval($mRow['approved_minutes']),
                'approved_hours' => round(intval($mRow['approved_minutes']) / 60, 2),
                'days_count' => intval($mRow['days_count']),
                'sessions_count' => intval($mRow['sessions_count']),
                'payout_unlock_date' => $payoutUnlockDate,
                'is_unlocked' => $isUnlocked,
                'status' => $status
            ];
        }

        // Scheme-specific calculations
        $summary = [
            'has_scheme' => true,
            'scheme' => $scheme,
            'total_earned' => $totalEarned,
            'total_approved_minutes' => $totalMinutes,
            'total_approved_hours' => $totalHours,
            'total_sessions' => intval($earnData['total_sessions']),
            'total_withdrawn' => $totalWithdrawn,
            'pending_withdrawn' => $pendingWithdrawn,
            'active_session' => $activeSession,
            'next_payout_date' => $nextPayoutDate,
            'days_until_next_payout' => $daysUntilNextPayout,
            'monthly_cycle_ledger' => array_reverse($monthlyCycleLedger),
        ];

        if ($schemeType === 'YEARLY_CONTRACT') {
            $contractTarget = floatval($scheme['contract_amount']);
            $companyReserved = min($totalEarned, $contractTarget);
            $targetCompleted = ($totalEarned >= $contractTarget);
            $progressPercent = $contractTarget > 0 ? min(100.0, round(($totalEarned / $contractTarget) * 100, 2)) : 100.0;
            $staffSurplusEarned = max(0.0, $totalEarned - $contractTarget);

            // Matured vs Accruing surplus calculation
            $maturedSurplusCalc = max(0.0, $maturedEarned - $contractTarget);
            $accruingSurplusCalc = max(0.0, $staffSurplusEarned - $maturedSurplusCalc);

            // Available withdrawable is matured surplus minus what has been requested/paid
            $availableWithdrawableTotal = max(0.0, $maturedSurplusCalc - $totalWithdrawn - $pendingWithdrawn);

            // Minimum 5K requirement for Yearly Contract
            $minWithdrawalLimit = 5000.0;

            $summary['contract_target'] = $contractTarget;
            $summary['company_reserved'] = $companyReserved;
            $summary['target_completed'] = $targetCompleted;
            $summary['progress_percent'] = $progressPercent;
            $summary['staff_surplus_earned'] = $staffSurplusEarned;
            $summary['matured_surplus_earned'] = $maturedSurplusCalc;
            $summary['accruing_balance'] = round($accruingSurplusCalc, 2);
        } else {
            // MONTHLY
            $salaryAmount = floatval($scheme['salary_amount']);
            $availableWithdrawableTotal = max(0.0, $maturedEarned - $totalWithdrawn - $pendingWithdrawn);

            // Minimum withdrawal threshold is base salary amount
            $minWithdrawalLimit = ($salaryAmount > 0) ? $salaryAmount : 5000.0;

            $summary['monthly_salary'] = $salaryAmount;
            $summary['matured_earned'] = $maturedEarned;
            $summary['accruing_balance'] = round($accruingEarned, 2);
        }

        // Integer cashout & Paisa/Fraction Rollover calculation
        $availableWithdrawableInteger = floor($availableWithdrawableTotal);
        $fractionalRollover = round($availableWithdrawableTotal - $availableWithdrawableInteger, 2);
        $canWithdraw = ($minWithdrawalLimit > 0 && $availableWithdrawableInteger >= $minWithdrawalLimit);
        $withdrawalBlockReason = !$canWithdraw 
            ? (($availableWithdrawableInteger <= 0) 
                ? 'No matured withdrawable balance available yet.' 
                : 'Minimum withdrawal requirement for your scheme is ৳ ' . number_format($minWithdrawalLimit) . '.')
            : null;

        $summary['available_withdrawable_total'] = round($availableWithdrawableTotal, 2);
        $summary['available_withdrawable'] = $availableWithdrawableInteger;
        $summary['fractional_rollover'] = $fractionalRollover;
        $summary['min_withdrawal_limit'] = $minWithdrawalLimit;
        $summary['can_withdraw'] = $canWithdraw;
        $summary['withdrawal_block_reason'] = $withdrawalBlockReason;

        // Auto Notify Staff when maturity cycle unlocks with withdrawable amount ONLY IF user strictly meets/exceeds their required minimum salary threshold
        if ($canWithdraw && $availableWithdrawableInteger >= $minWithdrawalLimit && $minWithdrawalLimit > 0) {
            self::checkAndSendMaturityNotification($pdo, $userId, $availableWithdrawableInteger, $fractionalRollover);
        }

        return $summary;
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
        $hourlyRate = floatval($scheme['hourly_rate']);
        $workDate = $workDate ?: date('Y-m-d');
        $sessionStart = $sessionStart ?: date('Y-m-d H:i:s', strtotime("-{$approvedMinutes} minutes"));
        $sessionEnd = $sessionEnd ?: date('Y-m-d H:i:s');

        // Check if contract is expired
        if ($workDate > $scheme['contract_end_date']) {
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
     */
    public static function checkAndSendMaturityNotification($pdo, $userId, $availableAmount, $fractionalRollover) {
        try {
            $scheme = self::getActiveScheme($pdo, $userId);
            if (!$scheme) {
                return;
            }

            // Strictly determine minimum withdrawal limit (monthly salary or 5k)
            $minLimit = ($scheme['scheme_type'] === 'YEARLY_CONTRACT') 
                ? 5000.0 
                : floatval($scheme['salary_amount'] ?: 5000.0);

            // If available amount does not meet or exceed salary limit, staff is NOT eligible to withdraw -> DO NOT send notification!
            if ($availableAmount < $minLimit || $minLimit <= 0) {
                return;
            }

            require_once __DIR__ . '/../notifications/notification_helper.php';

            $currentCycle = date('Y-m');
            $metaTag = 'payout_unlocked_' . $currentCycle;

            // Check if notification already sent for this cycle
            $stmt = $pdo->prepare("
                SELECT id FROM notifications 
                WHERE user_id = :user_id 
                  AND type = 'payroll_unlocked' 
                  AND (metadata LIKE :meta_tag OR title LIKE '%পে-রোল%')
                LIMIT 1
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':meta_tag' => '%' . $metaTag . '%'
            ]);

            if (!$stmt->fetch()) {
                $title = "🎉 পে-রোল সাইকেল আনলক: ৳" . number_format($availableAmount) . " তোলার জন্য প্রস্তুত!";
                $msg = "আপনার পে-রোল সাইকেল সফলভাবে আনলক হয়েছে। ৳" . number_format($availableAmount) . " তোলার জন্য প্রস্তুত রয়েছে।" . ($fractionalRollover > 0 ? " (অবশিষ্ট ৳" . number_format($fractionalRollover, 2) . " পরের মাসের সাথে রোলওভার হবে)" : "");
                
                NotificationHelper::sendToUser(
                    $pdo,
                    $userId,
                    null,
                    $title,
                    $msg,
                    'payroll_unlocked',
                    'all',
                    '/payroll',
                    'high',
                    ['cycle' => $currentCycle, 'tag' => $metaTag, 'amount' => $availableAmount, 'fraction' => $fractionalRollover]
                );
            }
        } catch (Exception $e) {
            error_log("Maturity Notification Error: " . $e->getMessage());
        }
    }

    /**
     * Request a withdrawal
     */
    public static function requestWithdrawal($pdo, $userId, $amount, $paymentMethod, $accountDetails) {
        $amount = floor(floatval($amount)); // Integer cashout
        if ($amount <= 0) {
            throw new Exception("Withdrawal amount must be a positive whole number (e.g. ৳ 5000).");
        }

        $summary = self::getStaffWalletSummary($pdo, $userId);
        if (!$summary['has_scheme']) {
            throw new Exception($summary['message']);
        }

        $minLimit = floatval($summary['min_withdrawal_limit'] ?? 5000);
        if ($amount < $minLimit) {
            throw new Exception("Minimum withdrawal amount for your pay scheme is ৳" . number_format($minLimit) . ".");
        }

        $available = floatval($summary['available_withdrawable']);
        if ($amount > $available) {
            throw new Exception("Requested amount (৳" . number_format($amount) . ") exceeds your available withdrawable balance (৳" . number_format($available) . "). Fractional paisa (৳" . number_format($summary['fractional_rollover'], 2) . ") remains in wallet for next month.");
        }

        $scheme = $summary['scheme'];
        $withdrawalType = ($scheme['scheme_type'] === 'YEARLY_CONTRACT') ? 'CONTRACT_SURPLUS' : 'MONTHLY_SALARY';

        $stmt = $pdo->prepare("
            INSERT INTO staff_withdrawals (
                user_id, scheme_id, amount, withdrawal_type, status,
                payment_method, account_details, requested_at
            ) VALUES (
                :user_id, :scheme_id, :amount, :withdrawal_type, 'pending',
                :payment_method, :account_details, NOW()
            )
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':scheme_id' => $scheme['id'],
            ':amount' => $amount,
            ':withdrawal_type' => $withdrawalType,
            ':payment_method' => $paymentMethod,
            ':account_details' => $accountDetails,
        ]);

        $withdrawalId = $pdo->lastInsertId();

        // Send notifications
        try {
            require_once __DIR__ . '/../notifications/notification_helper.php';
            
            // 1. Notify Admin
            NotificationHelper::sendToRole(
                $pdo,
                'admin',
                $userId,
                "💰 New Payout Request: ৳" . number_format($amount),
                "A staff member submitted a withdrawal request of ৳" . number_format($amount) . " via " . strtoupper($paymentMethod) . ".",
                'withdrawal_request',
                'admin',
                '/payroll'
            );

            // 2. Notify Staff
            NotificationHelper::sendToUser(
                $pdo,
                $userId,
                null,
                "⏳ Withdrawal Request Submitted: ৳" . number_format($amount),
                "Your payout request of ৳" . number_format($amount) . " via {$paymentMethod} is currently under admin review.",
                'withdrawal_pending',
                'staff',
                '/payroll'
            );
        } catch (Exception $e) {
            // Non-blocking
        }

        return [
            'withdrawal_id' => $withdrawalId,
            'amount' => $amount,
            'status' => 'pending',
            'requested_at' => date('Y-m-d H:i:s')
        ];
    }
}
?>
