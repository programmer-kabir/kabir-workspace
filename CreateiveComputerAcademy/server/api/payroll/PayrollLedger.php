<?php
// server/api/payroll/PayrollLedger.php
// Dedicated Ledger, Billing Cycles & Staff Wallet Summary Engine for CCA Payroll.

require_once __DIR__ . '/OvertimeEngine.php';

class PayrollLedger {

    /**
     * Get complete staff wallet & progress summary
     *
     * @param PDO  $pdo      Active PDO database connection
     * @param int  $userId   Staff user ID
     * @param bool $autoSync Whether to run attendance sync before summarizing
     * @return array         Comprehensive wallet summary dictionary
     */
    public static function getStaffWalletSummary($pdo, $userId, $autoSync = true) {
        PayrollHelper::ensureSchema($pdo);
        if ($autoSync) {
            try {
                PayrollHelper::syncAttendanceEarnings($pdo, $userId);
            } catch (Exception $e) {
                // Non-blocking sync error log
            }
        }

        $scheme = PayrollHelper::getActiveScheme($pdo, $userId);

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
        $tiers = PayrollHelper::getContractTiers($pdo, $schemeId);

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
            $grossElapsedMinutes = max(0, intval(round(($nowTs - $liveInTs) / 60)));

            // Fetch completed breaks for today (unpaid time = ৳ 0)
            $stmtCompletedBreaks = $pdo->prepare("
                SELECT COALESCE(SUM(duration_minutes), 0)
                FROM user_breaks
                WHERE user_id = :user_id AND date = :today AND status = 'Completed'
            ");
            $stmtCompletedBreaks->execute([':user_id' => $userId, ':today' => $today]);
            $completedBreakMins = intval($stmtCompletedBreaks->fetchColumn());

            // Check if user is currently on an active break right now
            $stmtActiveBreak = $pdo->prepare("
                SELECT id, break_type, purpose, start_time 
                FROM user_breaks 
                WHERE user_id = :user_id AND date = :today AND status = 'Active' 
                ORDER BY id DESC LIMIT 1
            ");
            $stmtActiveBreak->execute([':user_id' => $userId, ':today' => $today]);
            $activeBreak = $stmtActiveBreak->fetch(PDO::FETCH_ASSOC);

            $currentBreakMins = 0;
            if ($activeBreak && !empty($activeBreak['start_time'])) {
                $bStartTs = strtotime($activeBreak['start_time']);
                $currentBreakMins = max(0, intval(round(($nowTs - $bStartTs) / 60)));
            }

            // Total break minutes taken today (allocated 40m is paid; only excess beyond 40m is deducted)
            $totalBreakMins = $completedBreakMins + $currentBreakMins;
            $excessBreakMins = max(0, $totalBreakMins - 40);
            $netElapsedMinutes = max(0, $grossElapsedMinutes - $excessBreakMins);

            $liveTierInfo = PayrollHelper::getTierInfoForMonth($scheme, $today, $tiers);
            $liveRate = $liveTierInfo['hourly_rate'] ?: $hourlyRate;
            $liveEarned = round(($netElapsedMinutes / 60.0) * $liveRate, 2);

            $activeSession = [
                'attendance_id' => $liveAttendance['id'],
                'check_in_time' => $liveAttendance['check_in'],
                'session_start' => date('Y-m-d H:i:s', $liveInTs),
                'elapsed_minutes' => $netElapsedMinutes,
                'elapsed_hours' => round($netElapsedMinutes / 60, 2),
                'gross_elapsed_minutes' => $grossElapsedMinutes,
                'completed_break_minutes' => $completedBreakMins,
                'current_break_minutes' => $currentBreakMins,
                'total_break_minutes' => $totalBreakMins,
                'excess_break_minutes' => $excessBreakMins,
                'is_on_break' => !empty($activeBreak),
                'active_break_type' => $activeBreak ? ($activeBreak['purpose'] ?: $activeBreak['break_type']) : null,
                'live_earned' => $liveEarned,
                'hourly_rate' => $liveRate,
            ];
        }

        // 4. Monthly Cycle, Flexible Payout Controls & Settlement Calculation
        $todayDate = date('Y-m-d');
        $currentMonth = date('Y-m'); // e.g. 2026-11
        $currentDay = intval(date('j'));

        // Next upcoming payout unlock date (15th of next month if current month ongoing)
        $nextPayoutDate = date('Y-m-15', strtotime('+1 month'));
        $daysUntilNextPayout = max(0, intval(round((strtotime($nextPayoutDate) - strtotime($todayDate)) / 86400)));

        // Fetch custom admin cycle overrides
        $cycleControls = [];
        try {
            $ctrlStmt = $pdo->query("SELECT month_key, is_unlocked, unlocked_at, unlocked_by, notes FROM payroll_cycle_controls");
            while ($cRow = $ctrlStmt->fetch(PDO::FETCH_ASSOC)) {
                $cycleControls[$cRow['month_key']] = $cRow;
            }
        } catch (Throwable $e) {}

        // Fetch all withdrawals for this scheme to chronologically allocate payments to monthly invoices
        $totalPaidPool = 0.0;
        $latestPaidTx = null;
        try {
            $wStmt = $pdo->prepare("
                SELECT id, amount, status, payment_method, account_details, transaction_reference, covered_months, invoice_ids, requested_at, processed_at
                FROM staff_withdrawals
                WHERE scheme_id = :scheme_id AND status IN ('approved', 'paid')
                ORDER BY requested_at ASC, id ASC
            ");
            $wStmt->execute([':scheme_id' => $schemeId]);
            $paidWdList = $wStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($paidWdList as $pw) {
                $totalPaidPool += floatval($pw['amount']);
                $latestPaidTx = $pw;
            }
        } catch (Throwable $e) {}

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

            // Determine if cycle is unlocked:
            // 1. Admin explicit toggle takes top precedence
            // 2. Default: past month ($mKey < $currentMonth) is auto-unlocked
            $hasAdminOverride = isset($cycleControls[$mKey]);
            if ($hasAdminOverride) {
                $isUnlocked = !empty($cycleControls[$mKey]['is_unlocked']);
                $unlockType = 'manual_admin';
                $payoutUnlockDate = $isUnlocked
                    ? (!empty($cycleControls[$mKey]['unlocked_at']) ? 'Unlocked on ' . date('d M Y', strtotime($cycleControls[$mKey]['unlocked_at'])) : 'Unlocked by Admin')
                    : 'Locked by Admin';
            } else {
                $isPastMonth = ($mKey < $currentMonth);
                $isUnlocked = $isPastMonth;
                $unlockType = 'auto_cycle';
                $payoutUnlockDate = date('15 M Y', strtotime($mKey . '-01 +1 month'));
            }

            if ($isUnlocked) {
                $maturedEarned += $mEarned;
                $maturedSurplus += $mSurplus;
            } else {
                $accruingEarned += $mEarned;
                $accruingSurplus += $mSurplus;
            }

            // Chronological payment settlement status for this cycle
            $cyclePaidStatus = 'unpaid';
            $cyclePaidAmount = 0.0;
            $cycleTxRef = null;
            $cyclePayMethod = null;
            $cyclePaidDate = null;

            if ($totalPaidPool >= $mEarned && $mEarned > 0) {
                $cyclePaidStatus = 'paid';
                $cyclePaidAmount = $mEarned;
                $totalPaidPool -= $mEarned;
                if ($latestPaidTx) {
                    $cycleTxRef = $latestPaidTx['transaction_reference'];
                    $cyclePayMethod = $latestPaidTx['payment_method'];
                    $cyclePaidDate = $latestPaidTx['processed_at'] ?: $latestPaidTx['requested_at'];
                }
            } elseif ($totalPaidPool > 0 && $mEarned > 0) {
                $cyclePaidStatus = 'partially_paid';
                $cyclePaidAmount = $totalPaidPool;
                $totalPaidPool = 0.0;
                if ($latestPaidTx) {
                    $cycleTxRef = $latestPaidTx['transaction_reference'];
                    $cyclePayMethod = $latestPaidTx['payment_method'];
                    $cyclePaidDate = $latestPaidTx['processed_at'] ?: $latestPaidTx['requested_at'];
                }
            }

            // Human-readable invoice status & badges
            if ($cyclePaidStatus === 'paid') {
                $status = 'paid';
                $statusLabel = 'Paid & Settled';
            } elseif ($cyclePaidStatus === 'partially_paid') {
                $status = 'partially_paid';
                $statusLabel = 'Partially Paid (৳' . number_format($cyclePaidAmount, 2) . ')';
            } elseif (!$isUnlocked) {
                $status = 'accruing';
                $statusLabel = 'Ongoing Cycle (Accruing)';
            } else {
                if ($pendingWithdrawn > 0) {
                    $status = 'pending_payout';
                    $statusLabel = 'Payout Pending Admin Approval';
                } else {
                    $status = 'unlocked';
                    $statusLabel = 'Matured & Ready for Payout';
                }
            }

            $mTierInfo = PayrollHelper::getTierInfoForMonth($scheme, $mKey, $tiers);

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
                'unlock_type' => $unlockType,
                'is_unlocked' => $isUnlocked,
                'has_admin_override' => $hasAdminOverride,
                'status' => $status,
                'status_label' => $statusLabel,
                'cycle_paid_status' => $cyclePaidStatus,
                'cycle_paid_amount' => $cyclePaidAmount,
                'transaction_reference' => $cycleTxRef,
                'payment_method' => $cyclePayMethod,
                'paid_at' => $cyclePaidDate,
                'tier_number' => $mTierInfo['tier_number'],
                'tier_name' => $mTierInfo['tier_name'],
                'tier_salary' => $mTierInfo['monthly_salary'],
                'tier_hourly_rate' => $mTierInfo['hourly_rate'],
                'month_index' => $mTierInfo['month_index']
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
        } elseif ($schemeType === 'STAGGERED_CONTRACT') {
            $contractTarget = floatval($scheme['contract_amount'] ?: 60000.0);
            $availableWithdrawableTotal = max(0.0, $maturedEarned - $totalWithdrawn - $pendingWithdrawn);

            // Active tier for current cycle
            $currentMonthKey = date('Y-m');
            $activeTierInfo = PayrollHelper::getTierInfoForMonth($scheme, $currentMonthKey, $tiers);
            $minWithdrawalLimit = ($activeTierInfo['monthly_salary'] > 0) ? $activeTierInfo['monthly_salary'] : 3500.0;

            $roadmap = PayrollHelper::buildContractRoadmap($scheme, $tiers, $totalEarned, $pdo, $userId);

            if ($roadmap && !empty($roadmap['active_tier'])) {
                $activeTierInfo = array_merge($activeTierInfo, $roadmap['active_tier']);
            }

            $summary['contract_target'] = $contractTarget;
            $summary['monthly_salary'] = $activeTierInfo['monthly_salary'];
            $summary['active_tier'] = $activeTierInfo;
            $summary['contract_roadmap'] = $roadmap;
            $summary['matured_earned'] = $maturedEarned;
            $summary['accruing_balance'] = round($accruingEarned, 2);
        } else {
            // MONTHLY
            $salaryAmount = floatval($scheme['salary_amount']);
            $availableWithdrawableTotal = max(0.0, $maturedEarned - $totalWithdrawn - $pendingWithdrawn);

            $summary['monthly_salary'] = $salaryAmount;
            $summary['matured_earned'] = $maturedEarned;
            $summary['accruing_balance'] = round($accruingEarned, 2);
        }

        // Calculate dynamic salary target requirement across unlocked, unpaid billing cycles
        $unlockedUnpaidMonths = [];
        $targetSalaryRequirement = 0.0;
        if (!empty($monthlyCycleLedger)) {
            foreach ($monthlyCycleLedger as $cItem) {
                if (!empty($cItem['is_unlocked']) && ($cItem['cycle_paid_status'] ?? 'unpaid') !== 'paid') {
                    $unlockedUnpaidMonths[] = $cItem;
                    $mSalary = floatval($cItem['tier_salary'] ?? $scheme['salary_amount'] ?? 0);
                    $targetSalaryRequirement += $mSalary;
                }
            }
        }
        $unlockedCycleCount = count($unlockedUnpaidMonths);
        if ($targetSalaryRequirement <= 0) {
            $targetSalaryRequirement = ($schemeType === 'STAGGERED_CONTRACT' && !empty($activeTierInfo['monthly_salary'])) 
                ? floatval($activeTierInfo['monthly_salary']) 
                : ((floatval($scheme['salary_amount'] ?? 0) > 0) ? floatval($scheme['salary_amount']) : 5000.0);
            $unlockedCycleCount = max(1, $unlockedCycleCount);
        }
        $minWithdrawalLimit = $targetSalaryRequirement;

        // Integer cashout & Paisa/Fraction Rollover calculation
        $availableWithdrawableInteger = floor($availableWithdrawableTotal);
        $fractionalRollover = round($availableWithdrawableTotal - $availableWithdrawableInteger, 2);
        $canWithdraw = ($minWithdrawalLimit > 0 && $availableWithdrawableInteger >= $minWithdrawalLimit);
        $shortfallInitial = ceil(max(0, $minWithdrawalLimit - $availableWithdrawableInteger));
        $withdrawalBlockReason = !$canWithdraw 
            ? (($availableWithdrawableInteger <= 0) 
                ? 'No matured withdrawable balance available yet.' 
                : "আপনার {$unlockedCycleCount} মাসের নির্ধারিত মোট বেতন লক্ষ্যমাত্রা ৳ " . number_format($minWithdrawalLimit) . "। বর্তমান ব্যালেন্স ৳ " . number_format($availableWithdrawableInteger) . " (ঘাটতি: ৳ " . number_format($shortfallInitial) . ")। লক্ষ্যমাত্রা পূরণ না হওয়া পর্যন্ত উইথড্র লক থাকবে।")
            : null;

        $summary['available_withdrawable_total'] = round($availableWithdrawableTotal, 2);
        $summary['available_withdrawable'] = $availableWithdrawableInteger;
        $summary['fractional_rollover'] = $fractionalRollover;
        $summary['min_withdrawal_limit'] = $minWithdrawalLimit;
        $summary['can_withdraw'] = $canWithdraw;
        $summary['unlocked_cycle_count'] = $unlockedCycleCount;
        $summary['target_salary_requirement'] = $minWithdrawalLimit;
        $summary['shortfall_amount'] = $shortfallInitial;
        $summary['withdrawal_block_reason'] = $withdrawalBlockReason;

        // Auto Notify Staff when maturity cycle unlocks with withdrawable amount ONLY IF user strictly meets/exceeds their required minimum salary threshold
        if ($canWithdraw && $availableWithdrawableInteger >= $minWithdrawalLimit && $minWithdrawalLimit > 0) {
            PayrollHelper::checkAndSendMaturityNotification($pdo, $userId, $availableWithdrawableInteger, $fractionalRollover);
        }

        // Period statistics (Today, This Week, This Month, All Time)
        $dayOfWeek = intval(date('w')); // 0 (Sun) to 6 (Sat)
        $diffDays = ($dayOfWeek + 1) % 7; // In BD Saturday starts week: Sat=0, Sun=1, ..., Fri=6
        $weekStart = date('Y-m-d', strtotime("-{$diffDays} days"));
        $monthStart = date('Y-m-01');

        $stmtPeriod = $pdo->prepare("
            SELECT 
                COALESCE(SUM(CASE WHEN work_date = :today THEN earned_amount ELSE 0 END), 0) AS today_earned,
                COALESCE(SUM(CASE WHEN work_date = :today THEN approved_minutes ELSE 0 END), 0) AS today_minutes,
                COALESCE(COUNT(CASE WHEN work_date = :today THEN id ELSE NULL END), 0) AS today_sessions,

                COALESCE(SUM(CASE WHEN work_date >= :week_start THEN earned_amount ELSE 0 END), 0) AS week_earned,
                COALESCE(SUM(CASE WHEN work_date >= :week_start THEN approved_minutes ELSE 0 END), 0) AS week_minutes,
                COALESCE(COUNT(CASE WHEN work_date >= :week_start THEN id ELSE NULL END), 0) AS week_sessions,

                COALESCE(SUM(CASE WHEN work_date >= :month_start THEN earned_amount ELSE 0 END), 0) AS month_earned,
                COALESCE(SUM(CASE WHEN work_date >= :month_start THEN approved_minutes ELSE 0 END), 0) AS month_minutes,
                COALESCE(COUNT(CASE WHEN work_date >= :month_start THEN id ELSE NULL END), 0) AS month_sessions
            FROM staff_work_earnings
            WHERE scheme_id = :scheme_id
        ");
        $stmtPeriod->execute([
            ':scheme_id' => $schemeId,
            ':today' => $today,
            ':week_start' => $weekStart,
            ':month_start' => $monthStart
        ]);
        $periodData = $stmtPeriod->fetch(PDO::FETCH_ASSOC);

        $summary['period_stats'] = [
            'today' => [
                'earned' => round(floatval($periodData['today_earned']), 2),
                'minutes' => intval($periodData['today_minutes']),
                'hours' => round(intval($periodData['today_minutes']) / 60, 2),
                'sessions' => intval($periodData['today_sessions']),
                'date' => $today,
            ],
            'this_week' => [
                'earned' => round(floatval($periodData['week_earned']), 2),
                'minutes' => intval($periodData['week_minutes']),
                'hours' => round(intval($periodData['week_minutes']) / 60, 2),
                'sessions' => intval($periodData['week_sessions']),
                'start_date' => $weekStart,
            ],
            'this_month' => [
                'earned' => round(floatval($periodData['month_earned']), 2),
                'minutes' => intval($periodData['month_minutes']),
                'hours' => round(intval($periodData['month_minutes']) / 60, 2),
                'sessions' => intval($periodData['month_sessions']),
                'start_date' => $monthStart,
            ],
            'all_time' => [
                'earned' => round($totalEarned, 2),
                'minutes' => $totalMinutes,
                'hours' => $totalHours,
                'sessions' => intval($earnData['total_sessions']),
            ]
        ];

        // 5. Overtime Bank (Money vs Mango Choice Calculation)
        try {
            $shiftHours = floatval($scheme['standard_daily_hours'] ?: 7.33);
            if ($shiftHours <= 0) $shiftHours = 7.33;
            $shiftMins = PayrollHelper::getStandardDailyMinutes($shiftHours);
            $effectiveShiftHours = $shiftMins / 60.0;

            // Determine cutoff date and covered month labels for unlocked withdrawal cycles
            $unlockedMonths = [];
            $maxUnlockedMonth = null;
            if (!empty($monthlyCycleLedger)) {
                foreach ($monthlyCycleLedger as $cycle) {
                    if (!empty($cycle['is_unlocked'])) {
                        $unlockedMonths[$cycle['month_key']] = $cycle['month_label'] ?: date('F Y', strtotime($cycle['month_key'] . '-01'));
                        if ($maxUnlockedMonth === null || $cycle['month_key'] > $maxUnlockedMonth) {
                            $maxUnlockedMonth = $cycle['month_key'];
                        }
                    }
                }
            }
            ksort($unlockedMonths);
            $cycleEndDate = $maxUnlockedMonth ? date('Y-m-t', strtotime($maxUnlockedMonth . '-01')) : date('Y-m-d');
            
            // Dynamic cycle label representing ALL unlocked months (e.g. "September 2026 + October 2026")
            $unlockedLabels = array_values($unlockedMonths);
            if (count($unlockedLabels) > 1) {
                $cycleLabel = implode(' + ', $unlockedLabels);
            } elseif (count($unlockedLabels) === 1) {
                $cycleLabel = $unlockedLabels[0];
            } else {
                $cycleLabel = date('F Y');
            }

            $stdDailyMins = PayrollHelper::getStandardDailyMinutes($scheme['standard_daily_hours'] ?: 8.0);
            $effectiveShiftHours = $stdDailyMins / 60.0;
            $shiftHours = $effectiveShiftHours;

            // ── OvertimeEngine: Single Source of Truth (same engine as Mango Tree) ──
            // Computes gross OT, tiffin bonuses, short shifts, excess breaks, absents,
            // mango claims, and cashouts in one unified pass.
            $otEngine = OvertimeEngine::calculate($pdo, $userId, $effectiveShiftHours, $cycleEndDate);

            $totalOtSeconds           = $otEngine['gross_ot_seconds'];
            $totalOtHours             = $otEngine['gross_ot_hours'];
            $totalTiffinBonusSeconds  = $otEngine['tiffin_bonus_seconds'];
            $totalTiffinBonusHours    = $otEngine['tiffin_bonus_hours'];
            $monthlyOtSec             = $otEngine['monthly_ot_seconds'];
            $monthlyTiffinBonusSec    = $otEngine['monthly_tiffin_seconds'];
            $monthlyShortSec          = $otEngine['monthly_short_seconds'];
            $monthlyExcessBreakSec    = $otEngine['monthly_excess_break_sec'];
            $monthlyBreakSec          = $otEngine['monthly_break_sec'];
            $totalShortSeconds        = $otEngine['short_seconds'];
            $totalShortHours          = $otEngine['short_hours'];
            $totalExcessBreakSeconds  = $otEngine['excess_break_seconds'];
            $totalExcessBreakHours    = $otEngine['excess_break_hours'];
            $totalClaimedBreakSeconds = $otEngine['claimed_break_seconds'];
            $claimedOtHours           = round($otEngine['claimed_break_seconds'] / 3600, 2);
            $totalInShiftBreakSeconds = $otEngine['in_shift_break_seconds'];
            $inShiftOtHours           = round($otEngine['in_shift_break_seconds'] / 3600, 2);
            $cashedOtHours            = $otEngine['cashed_out_hours'];
            $absentPenaltySec         = $otEngine['absent_seconds'];
            $monthlyAbsentSec         = $otEngine['monthly_absent_sec'];

            // Unified Single Bucket Rule (Matching Mango Tree calculated from exact seconds):
            // Gross Overtime = Pure Attendance Overtime beyond 8.0h shift + Tiffin Efficiency Savings Bonus
            $totalGrossOtSeconds = $otEngine['total_gross_ot_seconds'];
            $grossOtHours = round($totalGrossOtSeconds / 3600, 2);

            $effectiveOtCashRate = ($schemeType === 'STAGGERED_CONTRACT' && !empty($activeTierInfo['hourly_rate']))
                ? floatval($activeTierInfo['hourly_rate'])
                : $hourlyRate;

            // Non-shift deductions: Excess breaks (>40m), Claimed Mango breaks, In-shift breaks,
            // cashed out OT, AND absent/leave penalty (same as Mango Tree rule)
            $totalOtherDeductionSeconds = $totalExcessBreakSeconds + $totalClaimedBreakSeconds
                                        + $totalInShiftBreakSeconds + intval($cashedOtHours * 3600)
                                        + $absentPenaltySec;
            $totalDeductions = round($totalOtherDeductionSeconds / 3600, 2);

            // Chronological Ledger Overtime Restoration (Oldest Month to Newest Month)
            // Eliminates double deduction: Overtime first restores base salary up to monthly target.
            // Any surplus overtime flows into the Overtime Bank / Mango Tree as ripe mangoes and extra cash!
            $chronoLedger = array_reverse($summary['monthly_cycle_ledger']);
            $runningOtCash = 0.0;
            $totalOtUsedForBase = 0.0;
            $newMaturedEarned = 0.0;
            $monthlyOtBreakdown = [];

            foreach ($chronoLedger as &$cycleItem) {
                $mK = $cycleItem['month_key'];
                $cycleRate = !empty($cycleItem['tier_hourly_rate']) ? floatval($cycleItem['tier_hourly_rate']) : $hourlyRate;
                $mTargetSalary = floatval($cycleItem['tier_salary'] ?: ($scheme['salary_amount'] ?: 5000));
                $baseEarned = floatval($cycleItem['total_earned']);

                // Gross overtime earned this month (Attendance OT beyond shift + Tiffin efficiency savings)
                $monthGrossOtSec = ($monthlyOtSec[$mK] ?? 0) + ($monthlyTiffinBonusSec[$mK] ?? 0);
                $monthGrossOtCash = round(($monthGrossOtSec / 3600.0) * $cycleRate, 2);

                // Month-specific non-shift deductions (excess breaks beyond 40m, claimed mango breaks in this month, absent penalty)
                $monthOtherDedSec = ($monthlyExcessBreakSec[$mK] ?? 0) + ($monthlyBreakSec[$mK] ?? 0)
                                  + ($monthlyAbsentSec[$mK] ?? 0);  // ← Absent/Leave penalty same as Mango Tree
                $monthOtherDedCash = round(($monthOtherDedSec / 3600.0) * $cycleRate, 2);
                $monthNetOtCash = max(0.0, $monthGrossOtCash - $monthOtherDedCash);

                // Pool available overtime into running cash
                $runningOtCash += $monthNetOtCash;

                // Cover base salary shortfall for unlocked/matured cycles using available overtime
                $otCoverCash = 0.0;
                if (!empty($cycleItem['is_unlocked'])) {
                    $baseShortfall = max(0.0, $mTargetSalary - $baseEarned);
                    $otCoverCash = min($baseShortfall, $runningOtCash);
                    $restoredBaseEarned = round($baseEarned + $otCoverCash, 2);
                    $runningOtCash = max(0.0, $runningOtCash - $otCoverCash);
                    $newMaturedEarned += $restoredBaseEarned;
                    $totalOtUsedForBase += $otCoverCash;
                } else {
                    $restoredBaseEarned = $baseEarned;
                }

                // Month's True Net Overtime (SSoT matching Mango Tree day-by-day attendance net balance):
                // Gross OT (attendance + tiffin bonus) minus all month deductions (shortfalls + excess breaks + mango claims + absent penalties)
                $monthTotalDedSec = ($monthlyShortSec[$mK] ?? 0) + $monthOtherDedSec;
                $monthTrueNetSec = max(0, $monthGrossOtSec - $monthTotalDedSec);
                $monthTrueNetHours = round($monthTrueNetSec / 3600.0, 2);
                $monthTrueNetCash = round($monthTrueNetHours * $cycleRate, 2);

                // Update ledger item with month's own distinct Net Overtime (eliminating cumulative running confusion)
                $cycleItem['total_earned'] = $restoredBaseEarned;
                $cycleItem['ot_restoration_amount'] = $otCoverCash;
                $cycleItem['overtime_cash'] = $monthTrueNetCash;
                $cycleItem['overtime_hours'] = $monthTrueNetHours;
                $cycleItem['invoice_integer_amount'] = floor($restoredBaseEarned);
                $cycleItem['fractional_rollover'] = round($restoredBaseEarned - floor($restoredBaseEarned), 2);
                $cycleItem['combined_earned'] = round($restoredBaseEarned + $monthTrueNetCash, 2);

                if (!empty($cycleItem['is_unlocked']) && ($monthGrossOtSec > 0 || $monthOtherDedSec > 0)) {
                    $monthlyOtBreakdown[] = [
                        'month_key' => $mK,
                        'month_label' => $cycleItem['month_label'] ?? $mK,
                        'gross_ot_hours' => round(($monthlyOtSec[$mK] ?? 0) / 3600, 2),
                        'tiffin_bonus_hours' => round(($monthlyTiffinBonusSec[$mK] ?? 0) / 3600, 2),
                        'short_hours' => round(($monthlyShortSec[$mK] ?? 0) / 3600, 2),
                        'excess_break_hours' => round(($monthlyExcessBreakSec[$mK] ?? 0) / 3600, 2),
                        'absent_hours' => round(($monthlyAbsentSec[$mK] ?? 0) / 3600, 2),
                        'ot_seconds' => $monthTrueNetSec,
                        'ot_hours' => $monthTrueNetHours,
                        'ot_restoration_amount' => $otCoverCash,
                        'cash_value' => $monthTrueNetCash,
                        'hourly_rate' => $cycleRate
                    ];
                }
            }
            unset($cycleItem);

            // Re-reverse back to newest first for display
            $summary['monthly_cycle_ledger'] = array_reverse($chronoLedger);

            // Deduct previously cashed out overtime from running overtime cash
            $cashedCash = round($cashedOtHours * $effectiveOtCashRate, 2);
            $runningOtCash = max(0.0, $runningOtCash - $cashedCash);

            // ── Single Source of Truth: use OvertimeEngine for available_hours / ripe_mangoes.
            // This guarantees Payroll payout modal shows the same OT hours as the Mango Tree,
            // eliminating divergence from per-month floor in the restoration loop.
            $availableOtHours     = $otEngine['available_hours'];   // SSoT
            $availableRipeMangoes = floor($availableOtHours / ($effectiveShiftHours ?: 8.0));
            $availableOtCashValue = round($availableOtHours * $effectiveOtCashRate, 2);

            $summary['overtime_bank'] = [
                'cycle_label' => $cycleLabel,
                'cycle_end_date' => $cycleEndDate,
                'shift_hours' => $shiftHours,
                'hourly_rate' => $effectiveOtCashRate,
                'gross_overtime_hours' => $grossOtHours,
                'total_overtime_hours' => $totalOtHours,
                'total_tiffin_bonus_hours' => $totalTiffinBonusHours,
                'total_short_hours' => $totalShortHours,
                'total_excess_break_hours' => $totalExcessBreakHours,
                'total_in_shift_break_hours' => $inShiftOtHours,
                'cashed_out_hours' => $cashedOtHours,
                'claimed_break_hours' => $claimedOtHours,
                'total_deductions_hours' => $totalDeductions,
                'ot_used_for_base_shortfall' => round($totalOtUsedForBase, 2),
                'available_hours' => $availableOtHours,
                'ripe_mangoes' => intval($availableRipeMangoes),
                'cash_value' => $availableOtCashValue,
                'can_cashout' => ($availableOtHours >= 1.0),
                'monthly_breakdown' => $monthlyOtBreakdown
            ];

            // Recompute withdrawable balance with restored matured earned
            if ($schemeType === 'YEARLY_CONTRACT') {
                $contractTarget = floatval($scheme['contract_amount']);
                $maturedSurplusCalc = max(0.0, $newMaturedEarned - $contractTarget);
                $availableWithdrawableTotal = max(0.0, $maturedSurplusCalc - $totalWithdrawn - $pendingWithdrawn);
                $summary['matured_earned'] = round($newMaturedEarned, 2);
                $summary['matured_surplus_earned'] = $maturedSurplusCalc;
            } else {
                $availableWithdrawableTotal = max(0.0, $newMaturedEarned - $totalWithdrawn - $pendingWithdrawn);
                $summary['matured_earned'] = round($newMaturedEarned, 2);
            }

            $availableWithdrawableInteger = floor($availableWithdrawableTotal);
            $fractionalRollover = round($availableWithdrawableTotal - $availableWithdrawableInteger, 2);

            $summary['available_withdrawable_total'] = round($availableWithdrawableTotal, 2);
            $summary['available_withdrawable'] = $availableWithdrawableInteger;
            $summary['fractional_rollover'] = $fractionalRollover;
        } catch (Throwable $otEx) {
            error_log("Error calculating overtime bank in summary: " . $otEx->getMessage());
            $summary['overtime_bank'] = null;
        }

        // Finalize eligibility: Staff can initiate withdrawal if their base balance + available overtime reaches the salary requirement
        $baseTotalFunds = floatval($summary['available_withdrawable_total'] ?? $summary['available_withdrawable'] ?? 0.0);
        $potentialOtCash = floatval($summary['overtime_bank']['cash_value'] ?? 0.0);
        $totalPotentialWithdrawable = floor($baseTotalFunds + $potentialOtCash);
        $canWithdraw = ($minWithdrawalLimit > 0 && $totalPotentialWithdrawable >= $minWithdrawalLimit);
        $summary['can_withdraw'] = $canWithdraw;
        $summary['total_potential_withdrawable'] = $totalPotentialWithdrawable;

        if (!$canWithdraw) {
            $shortfallAmount = ceil(max(0, $minWithdrawalLimit - $totalPotentialWithdrawable));
            $summary['shortfall_amount'] = $shortfallAmount;
            if ($totalPotentialWithdrawable <= 0) {
                $summary['withdrawal_block_reason'] = 'No matured withdrawable balance available yet.';
            } else {
                $cycleText = ($unlockedCycleCount > 1) ? "{$unlockedCycleCount} মাসের" : "১ মাসের";
                $summary['withdrawal_block_reason'] = "আপনার {$cycleText} নির্ধারিত মোট বেতন লক্ষ্যমাত্রা ৳ " . number_format($minWithdrawalLimit) . "। বর্তমান সমন্বিত ব্যালেন্স ৳ " . number_format($totalPotentialWithdrawable) . " (ঘাটতি: ৳ " . number_format($shortfallAmount) . ")। লক্ষ্যমাত্রা পূরণ না হওয়া পর্যন্ত উইথড্র লক থাকবে।";
            }
        } else {
            $summary['shortfall_amount'] = 0;
            $summary['withdrawal_block_reason'] = null;
        }

        // Security Deposit (জামানত) Integration (Option A living allowance split)
        try {
            require_once __DIR__ . '/../security_deposit/SecurityDepositHelper.php';
            $thisMonthEarned = floatval($summary['periods']['this_month']['earned'] ?? 0.0);
            $depositSummary = SecurityDepositHelper::getDepositSummaryForUser($pdo, $userId, $thisMonthEarned, date('Y-m'));
            $summary['security_deposit'] = $depositSummary;

            // If user has an active, unfulfilled security deposit:
            // Adjust available_withdrawable according to Option A living allowance threshold
            if (!empty($depositSummary['has_deposit']) && empty($depositSummary['is_fulfilled']) && ($depositSummary['status'] ?? '') !== 'exempt' && floatval($depositSummary['target_amount'] ?? 0) > 0) {
                $livingAllowance = floatval($depositSummary['monthly_living_allowance'] ?: 5000.0);
                $curTakeHome = floatval($depositSummary['current_month_split']['take_home_amount'] ?? $livingAllowance);
                $allowedTakeHome = min($summary['available_withdrawable_total'], $curTakeHome);
                $summary['available_withdrawable_total'] = round($allowedTakeHome, 2);
                $summary['available_withdrawable'] = floor($allowedTakeHome);
                $summary['min_withdrawal_limit'] = min($summary['min_withdrawal_limit'], $livingAllowance);
                $summary['can_withdraw'] = ($summary['available_withdrawable'] > 0);
            }
        } catch (Throwable $sdEx) {
            error_log("Error attaching security deposit summary: " . $sdEx->getMessage());
        }

        return $summary;
    }
}
