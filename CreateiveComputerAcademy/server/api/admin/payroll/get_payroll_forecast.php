<?php
// server/api/admin/payroll/get_payroll_forecast.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    PayrollHelper::ensureSchema($pdo);

    // 1. Fetch total historically disbursed
    $stmtDisbursed = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM staff_withdrawals WHERE status = 'approved'");
    $totalDisbursed = floatval($stmtDisbursed->fetchColumn());

    // 2. Fetch all users with active schemes
    $sqlSchemes = "
        SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_picture,
            e.designation,
            d.name AS department_name,
            ps.id AS scheme_id,
            ps.scheme_type,
            ps.salary_amount,
            ps.contract_amount,
            ps.hourly_rate,
            ps.standard_daily_hours
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        INNER JOIN staff_pay_schemes ps ON ps.id = (
            SELECT id FROM staff_pay_schemes WHERE user_id = u.id ORDER BY id DESC LIMIT 1
        )
        WHERE u.status = 'active'
        GROUP BY u.id
        ORDER BY u.name ASC
    ";
    $schemesStmt = $pdo->query($sqlSchemes);
    $usersWithSchemes = $schemesStmt->fetchAll(PDO::FETCH_ASSOC);

    $readyTotal = 0.0;
    $thresholdBlockedTotal = 0.0;
    $pendingTotal = 0.0;
    $projectedNextMonthTotal = 0.0;
    $staffLedger = [];

    // Current date helpers for run-rate projection
    $currentDay = intval(date('j'));
    $daysInCurrentMonth = intval(date('t'));
    $currentMonthKey = date('Y-m');
    $nextMonthKey = date('Y-m', strtotime('+1 month'));
    $nextMonthLabel = date('F Y', strtotime('+1 month'));

    foreach ($usersWithSchemes as $user) {
        $uId = intval($user['user_id']);
        $summary = PayrollHelper::getStaffWalletSummary($pdo, $uId);
        $minLimit = floatval($summary['min_withdrawal_limit'] ?? 0);
        $availInt = floatval($summary['available_withdrawable'] ?? 0);
        $pendingWithdrawn = floatval($summary['pending_withdrawn'] ?? 0);
        $accruingBal = floatval($summary['accruing_balance'] ?? 0);
        $canWithdraw = !empty($summary['can_withdraw']);
        $overtimeBank = $summary['overtime_bank'] ?? null;
        $otCash = floatval($overtimeBank['cash_value'] ?? 0);

        // Analyze monthly cycles: which are paid, which are ready, which are accruing
        $cashedCycles = [];
        $readyCycles = [];
        $blockedCycles = [];

        if (!empty($summary['monthly_cycle_ledger'])) {
            foreach ($summary['monthly_cycle_ledger'] as $cycle) {
                if ($cycle['status'] === 'paid') {
                    $cashedCycles[] = $cycle['month_label'];
                } elseif (!empty($cycle['is_unlocked'])) {
                    if ($canWithdraw) {
                        $readyCycles[] = $cycle['month_label'];
                    } else {
                        $blockedCycles[] = $cycle['month_label'];
                    }
                }
            }
        }

        // Determine diagnostic status & explanation
        $diagCode = 'NO_BALANCE';
        $diagReasonBn = 'বর্তমানে কোনো সক্রিয় বকেয়া নেই।';
        $diagReasonEn = 'No active balance pending.';

        if ($pendingWithdrawn > 0) {
            $diagCode = 'PENDING_APPROVAL';
            $diagReasonBn = 'স্টাফ ৳ ' . number_format($pendingWithdrawn) . ' এর উত্তোলনের আবেদন জমা দিয়েছে, অ্যাডমিন অনুমোদনের অপেক্ষায়।';
            $diagReasonEn = 'Withdrawal request of ৳ ' . number_format($pendingWithdrawn) . ' pending admin approval.';
            $pendingTotal += $pendingWithdrawn;
        } elseif ($availInt > 0 && $canWithdraw) {
            $diagCode = 'READY';
            $readyMonthsStr = !empty($readyCycles) ? implode(' + ', $readyCycles) : 'বকেয়া মাস';
            $diagReasonBn = "{$readyMonthsStr} এর ৳ " . number_format($availInt) . " উত্তোলনের উপযুক্ত হয়ে আছে। স্টাফ যেকোনো সময় তুলতে পারবে।";
            $diagReasonEn = "Matured balance of ৳ " . number_format($availInt) . " ({$readyMonthsStr}) ready for payout.";
            $readyTotal += $availInt;
        } elseif ($availInt > 0 && !$canWithdraw) {
            $diagCode = 'THRESHOLD_BLOCKED';
            $diagReasonBn = "অর্জিত আয় (৳ " . number_format($availInt) . ") নির্ধারিত ন্যূনতম বেতন সীমা (৳ " . number_format($minLimit) . ") পূর্ণ না করায় সাময়িকভাবে রোলওভার রয়েছে।";
            $diagReasonEn = "Earned amount (৳ " . number_format($availInt) . ") is below minimum salary threshold (৳ " . number_format($minLimit) . ").";
            $thresholdBlockedTotal += $availInt;
        } elseif ($accruingBal > 0) {
            $diagCode = 'ACCRUING_ONLY';
            $diagReasonBn = 'পূর্বের কোনো বকেয়া নেই; চলতি মাসের কাজ চলমান রয়েছে (১৫ তারিখে আনলক হবে)।';
            $diagReasonEn = 'No prior backlog; ongoing month is accruing and matures on next cycle.';
        }

        // Projection for upcoming cycle:
        // Rolling forward unwithdrawn balance + projected current month earnings based on daily burn rate
        $projectedOngoingMonth = ($currentDay > 0) ? round(($accruingBal / $currentDay) * $daysInCurrentMonth, 2) : $accruingBal;
        $staffNextForecast = round($availInt + $projectedOngoingMonth, 2);
        $projectedNextMonthTotal += $staffNextForecast;

        $staffLedger[] = [
            'user_id' => $uId,
            'name' => $user['name'],
            'email' => $user['email'],
            'profile_picture' => $user['profile_picture'],
            'designation' => $user['designation'] ?: 'Staff Member',
            'department_name' => $user['department_name'] ?: 'CCA Academy',
            'scheme_type' => $user['scheme_type'],
            'monthly_salary' => floatval($user['salary_amount'] ?: 0),
            'min_limit' => $minLimit,
            'cashed_cycles' => $cashedCycles,
            'ready_cycles' => $readyCycles,
            'ready_balance' => $availInt,
            'pending_balance' => $pendingWithdrawn,
            'accruing_balance' => $accruingBal,
            'overtime_hours' => floatval($overtimeBank['available_hours'] ?? 0),
            'overtime_cash' => $otCash,
            'diagnostic_code' => $diagCode,
            'diagnostic_reason_bn' => $diagReasonBn,
            'diagnostic_reason_en' => $diagReasonEn,
            'next_month_forecast' => $staffNextForecast
        ];
    }

    // 3. Monthly trends data (Past 4 months + Current + Next forecast)
    $trends = [];
    for ($i = -3; $i <= 1; $i++) {
        $mTs = strtotime("{$i} month");
        $mKey = date('Y-m', $mTs);
        $mLabel = date('M Y', $mTs);

        // Disbursed in this month
        $stmtMDis = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM staff_withdrawals WHERE status = 'approved' AND DATE_FORMAT(processed_at, '%Y-%m') = :mkey");
        $stmtMDis->execute([':mkey' => $mKey]);
        $mDisbursed = floatval($stmtMDis->fetchColumn());

        // Accrued earnings in this month from staff_work_earnings
        $stmtMEarn = $pdo->prepare("SELECT COALESCE(SUM(earned_amount), 0) FROM staff_work_earnings WHERE DATE_FORMAT(work_date, '%Y-%m') = :mkey");
        $stmtMEarn->execute([':mkey' => $mKey]);
        $mEarned = floatval($stmtMEarn->fetchColumn());

        $isForecast = ($i === 1);
        $isCurrent = ($i === 0);

        $trends[] = [
            'month_key' => $mKey,
            'month_label' => $mLabel,
            'disbursed' => $mDisbursed,
            'earned' => $isForecast ? round($projectedNextMonthTotal, 2) : $mEarned,
            'is_current' => $isCurrent,
            'is_forecast' => $isForecast
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'metrics' => [
                'total_disbursed' => round($totalDisbursed, 2),
                'ready_to_cashout_total' => round($readyTotal, 2),
                'threshold_blocked_total' => round($thresholdBlockedTotal, 2),
                'pending_approval_total' => round($pendingTotal, 2),
                'projected_next_month_liability' => round($projectedNextMonthTotal, 2),
                'next_maturity_date' => date('F 15, Y', strtotime('+1 month')),
                'active_staff_count' => count($usersWithSchemes)
            ],
            'staff_ledger' => $staffLedger,
            'monthly_trends' => $trends
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>