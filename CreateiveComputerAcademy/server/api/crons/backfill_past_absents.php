<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$now = date('Y-m-d H:i:s');
$yesterday = date('Y-m-d', strtotime('-1 day'));

// Parameters
$execute = isset($_GET['execute']) && ($_GET['execute'] == '1' || $_GET['execute'] === 'true');
if (isset($argv) && is_array($argv) && (in_array('--execute', $argv) || in_array('execute=1', $argv))) {
    $execute = true;
}

$filter_user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
$override_start = isset($_GET['start_date']) ? trim($_GET['start_date']) : null;
$override_end = isset($_GET['end_date']) ? trim($_GET['end_date']) : $yesterday;
$is_json = isset($_GET['format']) && $_GET['format'] === 'json';

$log_file = __DIR__ . '/backfill_absent_log.txt';

// Fetch global holidays
$holidays = [];
$holidaysHours = [];
try {
    $holStmt = $db->query("SELECT date, title, expected_hours FROM holidays");
    if ($holStmt) {
        while ($h = $holStmt->fetch(PDO::FETCH_ASSOC)) {
            $holidays[$h['date']] = $h['title'] ?: 'Holiday';
            $holidaysHours[$h['date']] = (float)($h['expected_hours'] ?? 0);
        }
    }
} catch (Throwable $e) {}

// Helper function to calculate exact current Mango Bank balance for a staff
function getStaffCurrentBalance($db, $user_id, $shift_hours, $holidaysHours) {
    if (!$db || !$user_id) return ['net_hours' => 0.0, 'ripe_mangoes' => 0, 'debt_hours' => 0.0];

    // 1. Worked Overtime from completed attendance
    $attStmt = $db->prepare("SELECT date, check_in, check_out FROM attendance WHERE user_id = :uid AND check_in IS NOT NULL AND check_out IS NOT NULL");
    $attStmt->execute([':uid' => $user_id]);
    $dailyWorked = [];
    while ($r = $attStmt->fetch(PDO::FETCH_ASSOC)) {
        $in_ts = strtotime($r['check_in']);
        $out_ts = strtotime($r['check_out']);
        if ($out_ts <= $in_ts) continue;
        $d = $r['date'];
        if (!isset($dailyWorked[$d])) $dailyWorked[$d] = 0;
        $dailyWorked[$d] += ($out_ts - $in_ts);
    }
    $totalOtSec = 0;
    foreach ($dailyWorked as $d => $wSec) {
        $isFri = (date('N', strtotime($d)) == 5);
        $expSec = $isFri ? 0 : ($shift_hours * 3600);
        if (isset($holidaysHours[$d])) $expSec = (float)$holidaysHours[$d] * 3600;
        $diff = $wSec - $expSec;
        if ($diff > 0) $totalOtSec += $diff;
    }
    $otHours = round($totalOtSec / 3600, 2);

    // 2. Claimed mango breaks
    $claimStmt = $db->prepare("SELECT SUM(duration_minutes) as m FROM user_breaks WHERE user_id = :uid AND break_type IN ('Mango Full Day', 'Mango Break', 'Mango Overtime') AND status != 'Rejected'");
    $claimStmt->execute([':uid' => $user_id]);
    $claimRow = $claimStmt->fetch(PDO::FETCH_ASSOC);
    $claimedHours = round(((float)($claimRow['m'] ?? 0)) / 60, 2);

    // 3. Cashed out overtime
    $cashHours = 0.0;
    try {
        $cwStmt = $db->prepare("SELECT SUM(overtime_hours_cashed) as h FROM staff_withdrawals WHERE user_id = :uid AND overtime_hours_cashed > 0 AND status != 'rejected'");
        $cwStmt->execute([':uid' => $user_id]);
        $cwRow = $cwStmt->fetch(PDO::FETCH_ASSOC);
        $cashHours = round((float)($cwRow['h'] ?? 0), 2);
    } catch (Throwable $e) {}

    // 4. P2P Trades (Sold & Bought)
    $soldHours = 0.0;
    $boughtHours = 0.0;
    try {
        $trStmt = $db->prepare("SELECT SUM(hours_traded) as h FROM staff_overtime_trades WHERE seller_id = :uid AND status IN ('approved', 'pending_admin', 'pending_seller')");
        $trStmt->execute([':uid' => $user_id]);
        $trRow = $trStmt->fetch(PDO::FETCH_ASSOC);
        $soldHours = round((float)($trRow['h'] ?? 0), 2);

        $tbStmt = $db->prepare("SELECT SUM(hours_traded) as h FROM staff_overtime_trades WHERE buyer_id = :uid AND status = 'approved'");
        $tbStmt->execute([':uid' => $user_id]);
        $tbRow = $tbStmt->fetch(PDO::FETCH_ASSOC);
        $boughtHours = round((float)($tbRow['h'] ?? 0), 2);
    } catch (Throwable $e) {}

    // 5. Tiffin Savings / Penalties
    $tiffinNetHours = 0.0;
    try {
        $tfStmt = $db->prepare("SELECT SUM(tiffin_delta_minutes) as m FROM user_breaks WHERE user_id = :uid AND break_type = 'Tiffin' AND status = 'Completed'");
        $tfStmt->execute([':uid' => $user_id]);
        $tfRow = $tfStmt->fetch(PDO::FETCH_ASSOC);
        $tiffinNetHours = round(((float)($tfRow['m'] ?? 0)) / 60, 2);
    } catch (Throwable $e) {}

    // 6. Existing Absent Days already in attendance table
    $existingAbsentHours = 0.0;
    try {
        $abStmt = $db->prepare("SELECT COUNT(*) as c FROM attendance WHERE user_id = :uid AND status = 'Absent'");
        $abStmt->execute([':uid' => $user_id]);
        $abRow = $abStmt->fetch(PDO::FETCH_ASSOC);
        $existingAbsentHours = round(((int)($abRow['c'] ?? 0)) * $shift_hours, 2);
    } catch (Throwable $e) {}

    $gross = round($otHours + $boughtHours + max(0, $tiffinNetHours), 2);
    $deductions = round($claimedHours + $cashHours + $soldHours + abs(min(0, $tiffinNetHours)) + $existingAbsentHours, 2);
    $net = round($gross - $deductions, 2);
    $ripe = $net > 0 ? (int)floor($net / $shift_hours) : 0;
    $debt = $net < 0 ? abs($net) : 0.0;

    return [
        'net_hours' => $net,
        'ripe_mangoes' => $ripe,
        'debt_hours' => $debt
    ];
}

// Fetch active staff
$staffQuery = "
    SELECT u.id as user_id, u.name, u.email,
           COALESCE(e.joining_date, r.joining_date, DATE(u.created_at)) as joining_date,
           e.resignation_date,
           COALESCE(e.shift_hours, r.shift_hours, 8) as shift_hours
    FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN employees e ON u.id = e.user_id
    LEFT JOIN reviewers r ON u.id = r.user_id
    WHERE ur.role IN ('staff', 'manager', 'instructor', 'reviewer')
      AND u.status = 'active'
";
if ($filter_user_id) {
    $staffQuery .= " AND u.id = " . (int)$filter_user_id;
}
$staffQuery .= " GROUP BY u.id ORDER BY u.name ASC";

$staffStmt = $db->query($staffQuery);
$allStaff = $staffStmt ? $staffStmt->fetchAll(PDO::FETCH_ASSOC) : [];

$report = [];
$total_missing_absents = 0;
$total_unpaid_leaves = 0;
$total_inserted = 0;
$all_missing_rows = [];

// Simulation counters for Mode 1 (Both Leave + Absent via Mango)
$both_total_days = 0;
$both_total_penalty_hours = 0.0;
$both_total_mangoes_lost = 0;
$both_total_staff_in_debt = 0;
$both_total_staff_safe = 0;

// Simulation counters for Mode 2 (Absent Only)
$absent_total_penalty_hours = 0.0;
$absent_total_mangoes_lost = 0;
$absent_total_staff_in_debt = 0;
$absent_total_staff_safe = 0;

$insertStmt = $db->prepare("
    INSERT INTO attendance (user_id, date, status, check_in, check_out, is_forgotten_checkout) 
    VALUES (:user_id, :date, 'Absent', NULL, NULL, 0)
");

foreach ($allStaff as $staff) {
    $uid = (int)$staff['user_id'];
    $name = $staff['name'];
    $shiftHours = (float)$staff['shift_hours'];
    if ($shiftHours <= 0) $shiftHours = 8.0;
    
    // Determine start date from joining date
    $joinDate = !empty($staff['joining_date']) ? $staff['joining_date'] : date('Y-m-d', strtotime('-60 days'));
    $startDate = $override_start ? $override_start : $joinDate;
    
    // Determine end date
    $resignationDate = !empty($staff['resignation_date']) ? $staff['resignation_date'] : null;
    $endDate = $override_end;
    if ($resignationDate && strtotime($resignationDate) < strtotime($endDate)) {
        $endDate = $resignationDate;
    }
    
    // Safety guard on date range
    if (strtotime($startDate) > strtotime($endDate)) {
        continue;
    }

    // 1. Fetch user attendance records in range
    $attStmt = $db->prepare("SELECT date, check_in, check_out, status FROM attendance WHERE user_id = :uid AND date BETWEEN :start AND :end");
    $attStmt->execute([':uid' => $uid, ':start' => $startDate, ':end' => $endDate]);
    $attendanceMap = [];
    while ($att = $attStmt->fetch(PDO::FETCH_ASSOC)) {
        $attendanceMap[$att['date']] = $att;
    }

    // 2. Fetch approved leaves in range
    $leaveStmt = $db->prepare("SELECT start_date, end_date, type FROM leave_requests WHERE user_id = :uid AND status = 'Approved' AND end_date >= :start AND start_date <= :end");
    $leaveStmt->execute([':uid' => $uid, ':start' => $startDate, ':end' => $endDate]);
    $approvedLeavesMap = [];
    while ($lr = $leaveStmt->fetch(PDO::FETCH_ASSOC)) {
        $curL = strtotime($lr['start_date']);
        $endL = strtotime($lr['end_date']);
        while ($curL <= $endL) {
            $approvedLeavesMap[date('Y-m-d', $curL)] = $lr['type'] ?: 'Approved Leave';
            $curL = strtotime('+1 day', $curL);
        }
    }

    // 3. Fetch claimed Mango Full Day breaks
    $mangoStmt = $db->prepare("SELECT date FROM user_breaks WHERE user_id = :uid AND break_type = 'Mango Full Day' AND status != 'Rejected'");
    $mangoStmt->execute([':uid' => $uid]);
    $claimedMangoMap = [];
    while ($mb = $mangoStmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($mb['date'])) {
            $claimedMangoMap[$mb['date']] = true;
        }
    }

    // Iterate day by day
    $cur = strtotime($startDate);
    $endTs = strtotime($endDate);

    $workingDaysChecked = 0;
    $presentDays = 0;
    $existingLeaveDays = 0;
    $existingAbsentDays = 0;
    $weekendDays = 0;
    $holidayDays = 0;
    $missingAbsentDates = [];
    $unpaidLeaveDates = [];

    while ($cur <= $endTs) {
        $dt = date('Y-m-d', $cur);
        $dayOfWeek = (int)date('N', $cur);

        // Friday check
        if ($dayOfWeek === 5) {
            $weekendDays++;
            $cur = strtotime('+1 day', $cur);
            continue;
        }

        // Holiday check
        if (isset($holidays[$dt])) {
            $holidayDays++;
            $cur = strtotime('+1 day', $cur);
            continue;
        }

        // Already paid Mango Full Day break check
        if (isset($claimedMangoMap[$dt])) {
            $existingLeaveDays++;
            $cur = strtotime('+1 day', $cur);
            continue;
        }

        // Approved Leave from leave_requests
        if (isset($approvedLeavesMap[$dt])) {
            $existingLeaveDays++;
            $unpaidLeaveDates[] = [
                'date' => $dt,
                'type' => $approvedLeavesMap[$dt]
            ];
            $cur = strtotime('+1 day', $cur);
            continue;
        }

        $workingDaysChecked++;

        // Attendance Record check
        if (isset($attendanceMap[$dt])) {
            $rec = $attendanceMap[$dt];
            $st = strtolower($rec['status'] ?? '');
            if (!empty($rec['check_in']) || in_array($st, ['present', 'late', 'half day', 'in_progress', 'completed'])) {
                $presentDays++;
            } elseif ($st === 'leave') {
                $existingLeaveDays++;
                $unpaidLeaveDates[] = [
                    'date' => $dt,
                    'type' => 'Attendance Leave'
                ];
            } elseif ($st === 'absent') {
                $existingAbsentDays++;
            } else {
                $missingAbsentDates[] = $dt;
            }
        } else {
            $missingAbsentDates[] = $dt;
        }

        $cur = strtotime('+1 day', $cur);
    }

    // If execution mode is ON, insert missing records into attendance table
    if ($execute && count($missingAbsentDates) > 0) {
        foreach ($missingAbsentDates as $absDt) {
            try {
                $insertStmt->execute([
                    ':user_id' => $uid,
                    ':date' => $absDt
                ]);
                $total_inserted++;
            } catch (Throwable $ie) {}
        }
    }

    $missingCount = count($missingAbsentDates);
    $unpaidLeaveCount = count($unpaidLeaveDates);
    $total_missing_absents += $missingCount;
    $total_unpaid_leaves += $unpaidLeaveCount;

    // Current Mango Tree status
    $currentBank = getStaffCurrentBalance($db, $uid, $shiftHours, $holidaysHours);

    // ── SCENARIO 1: BOTH LEAVE + ABSENT VIA MANGO (ইউজারের নতুন পলিসি) ────────
    $bothDeductibleDays = $missingCount + $unpaidLeaveCount;
    $bothPenaltyHours = round($bothDeductibleDays * $shiftHours, 2);
    $bothProjectedNet = round($currentBank['net_hours'] - $bothPenaltyHours, 2);
    $bothProjectedRipe = $bothProjectedNet > 0 ? (int)floor($bothProjectedNet / $shiftHours) : 0;
    $bothProjectedDebt = $bothProjectedNet < 0 ? abs($bothProjectedNet) : 0.0;
    $bothMangoesLost = max(0, $currentBank['ripe_mangoes'] - $bothProjectedRipe);

    $both_total_days += $bothDeductibleDays;
    $both_total_penalty_hours += $bothPenaltyHours;
    $both_total_mangoes_lost += $bothMangoesLost;
    if ($bothProjectedNet < 0) {
        $both_total_staff_in_debt++;
    } elseif ($bothDeductibleDays === 0) {
        $both_total_staff_safe++;
    }

    // ── SCENARIO 2: ABSENT ONLY (শুধুমাত্র অনুপস্থিতি) ────────────────────────
    $absentPenaltyHours = round($missingCount * $shiftHours, 2);
    $absentProjectedNet = round($currentBank['net_hours'] - $absentPenaltyHours, 2);
    $absentProjectedRipe = $absentProjectedNet > 0 ? (int)floor($absentProjectedNet / $shiftHours) : 0;
    $absentProjectedDebt = $absentProjectedNet < 0 ? abs($absentProjectedNet) : 0.0;
    $absentMangoesLost = max(0, $currentBank['ripe_mangoes'] - $absentProjectedRipe);

    $absent_total_penalty_hours += $absentPenaltyHours;
    $absent_total_mangoes_lost += $absentMangoesLost;
    if ($absentProjectedNet < 0) {
        $absent_total_staff_in_debt++;
    } elseif ($missingCount === 0) {
        $absent_total_staff_safe++;
    }

    // Detailed missing absent rows
    foreach ($missingAbsentDates as $absDt) {
        $all_missing_rows[] = [
            'user_id' => $uid,
            'name' => $name,
            'date' => $absDt,
            'day_name' => date('l', strtotime($absDt)),
            'type' => 'Absent',
            'type_badge' => 'Absent ⚠️',
            'penalty_hours' => $shiftHours,
            'formatted_date' => date('d M, Y', strtotime($absDt))
        ];
    }

    // Detailed leave rows
    foreach ($unpaidLeaveDates as $ul) {
        $all_missing_rows[] = [
            'user_id' => $uid,
            'name' => $name,
            'date' => $ul['date'],
            'day_name' => date('l', strtotime($ul['date'])),
            'type' => 'Leave',
            'type_badge' => 'Approved Leave 📝',
            'penalty_hours' => $shiftHours,
            'formatted_date' => date('d M, Y', strtotime($ul['date']))
        ];
    }

    $report[] = [
        'user_id' => $uid,
        'name' => $name,
        'joining_date' => $joinDate,
        'shift_hours' => $shiftHours,
        'scanned_period' => "{$startDate} to {$endDate}",
        'working_days' => $workingDaysChecked,
        'present_days' => $presentDays,
        'existing_leaves' => $existingLeaveDays,
        'existing_absents' => $existingAbsentDays,
        'unpaid_leave_count' => $unpaidLeaveCount,
        'unpaid_leave_dates' => array_column($unpaidLeaveDates, 'date'),
        'unexcused_absent_count' => $missingCount,
        'unexcused_dates' => $missingAbsentDates,
        'both_total_days' => $bothDeductibleDays,
        // Current Bank
        'current_net_hours' => $currentBank['net_hours'],
        'current_ripe_mangoes' => $currentBank['ripe_mangoes'],
        'current_debt_hours' => $currentBank['debt_hours'],
        // Scenario 1: Both Leave & Absent
        'both_penalty_hours' => $bothPenaltyHours,
        'both_projected_net' => $bothProjectedNet,
        'both_projected_ripe' => $bothProjectedRipe,
        'both_projected_debt' => $bothProjectedDebt,
        'both_mangoes_lost' => $bothMangoesLost,
        // Scenario 2: Absent Only
        'absent_penalty_hours' => $absentPenaltyHours,
        'absent_projected_net' => $absentProjectedNet,
        'absent_projected_ripe' => $absentProjectedRipe,
        'absent_projected_debt' => $absentProjectedDebt,
        'absent_mangoes_lost' => $absentMangoesLost
    ];
}

// Sort detailed rows by date descending
usort($all_missing_rows, function($a, $b) {
    return strcmp($b['date'], $a['date']);
});

// Log execution
if ($execute) {
    $logMsg = "[{$now}] Backfill executed: {$total_inserted} absent records inserted across " . count($allStaff) . " staff.\n";
    file_put_contents($log_file, $logMsg, FILE_APPEND);
}

// JSON Output if requested
if ($is_json) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'status' => 'success',
        'execute' => $execute,
        'scanned_staff_count' => count($allStaff),
        'total_missing_absents' => $total_missing_absents,
        'total_unpaid_leaves' => $total_unpaid_leaves,
        'both_total_deductible_days' => $both_total_days,
        'both_total_penalty_hours' => $both_total_penalty_hours,
        'both_total_mangoes_lost' => $both_total_mangoes_lost,
        'both_total_staff_in_debt' => $both_total_staff_in_debt,
        'report' => $report
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Explicit text/html header to ensure rich browser rendering
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>CCA Attendance Auto-Backfill & Mango Impact Simulator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0a0f1d;
            --card-bg: #111827;
            --border-color: #1f2937;
            --text-main: #f9fafb;
            --text-muted: #9ca3af;
            --primary: #3b82f6;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --purple: #8b5cf6;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif;
            background: var(--bg-dark);
            color: var(--text-main);
            margin: 0;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }
        .container { max-width: 1400px; margin: 0 auto; }

        .top-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
        }
        .brand-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 0 0 6px 0;
        }
        .subtitle {
            font-size: 13px;
            color: var(--text-muted);
            margin: 0;
        }

        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .badge-dry { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
        .badge-exec { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
        .badge-absent { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-leave { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-present { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 22px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
            border: none;
        }
        .btn-execute {
            background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
            color: #fff;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }
        .btn-execute:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
        }
        .btn-secondary {
            background: #1f2937;
            color: #cbd5e1;
            border: 1px solid #374151;
        }
        .btn-secondary:hover { background: #374151; }

        /* POLICY MODE SELECTOR BANNER */
        .policy-switcher {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 2px solid #3b82f6;
            border-radius: 18px;
            padding: 18px 24px;
            margin-bottom: 24px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
        }
        .policy-title {
            font-size: 16px;
            font-weight: 800;
            color: #fff;
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .policy-desc {
            font-size: 13px;
            color: #94a3b8;
            margin: 0;
        }
        .policy-toggle-group {
            display: inline-flex;
            background: #0b1120;
            padding: 4px;
            border-radius: 14px;
            border: 1px solid #334155;
            gap: 4px;
        }
        .policy-toggle-btn {
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 700;
            border: none;
            background: transparent;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .policy-toggle-btn.active {
            background: #3b82f6;
            color: #fff;
            box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
        }

        /* METRICS GRID */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 18px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            position: relative;
            overflow: hidden;
        }
        .stat-card::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 3px;
        }
        .stat-card.blue::after { background: #3b82f6; }
        .stat-card.red::after { background: #ef4444; }
        .stat-card.amber::after { background: #f59e0b; }
        .stat-card.orange::after { background: #fb923c; }
        .stat-card.purple::after { background: #a855f7; }
        .stat-card.green::after { background: #10b981; }

        .stat-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            margin-bottom: 6px;
        }
        .stat-value {
            font-size: 26px;
            font-weight: 800;
            line-height: 1.1;
        }
        .stat-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
        }

        .main-card {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            margin-bottom: 24px;
        }

        .tab-ribbon {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 12px;
        }
        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 14px;
            font-weight: 700;
            padding: 8px 16px;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .tab-btn.active {
            background: #1f2937;
            color: #fff;
        }

        .filter-bar {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .search-input {
            flex: 1;
            min-width: 260px;
            background: #0f172a;
            border: 1px solid #334155;
            color: #fff;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            outline: none;
        }
        .search-input:focus { border-color: #3b82f6; }
        .filter-select {
            background: #0f172a;
            border: 1px solid #334155;
            color: #fff;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            cursor: pointer;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th {
            text-align: left;
            padding: 12px 14px;
            background: #0b1120;
            color: var(--text-muted);
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 800;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--border-color);
        }
        td {
            padding: 14px;
            border-bottom: 1px solid #1e293b;
            vertical-align: middle;
        }
        tr:hover td { background: rgba(255,255,255,0.02); }

        .user-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 15px;
            color: #fff;
        }

        .chip-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            max-width: 320px;
        }
        .date-chip {
            background: rgba(239, 68, 68, 0.12);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.25);
            padding: 2px 7px;
            border-radius: 6px;
            font-size: 10px;
            font-family: monospace;
            font-weight: 600;
        }
        .leave-chip {
            background: rgba(245, 158, 11, 0.12);
            color: #fde68a;
            border: 1px solid rgba(245, 158, 11, 0.25);
            padding: 2px 7px;
            border-radius: 6px;
            font-size: 10px;
            font-family: monospace;
            font-weight: 600;
        }

        .balance-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
        }
        .balance-pill.positive {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .balance-pill.zero {
            background: rgba(156, 163, 175, 0.15);
            color: #d1d5db;
            border: 1px solid rgba(156, 163, 175, 0.3);
        }
        .balance-pill.debt {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .impact-card {
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 12px;
            line-height: 1.4;
        }
        .impact-card.safe {
            background: rgba(16, 185, 129, 0.1);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            font-weight: 700;
        }
        .impact-card.warning {
            background: rgba(245, 158, 11, 0.12);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .impact-card.debt {
            background: rgba(239, 68, 68, 0.15);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .impact-card .sub { font-size: 11px; opacity: 0.85; margin-top: 2px; }

        .exec-success-box {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.2));
            border: 1px solid #10b981;
            padding: 20px 24px;
            border-radius: 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            color: #a7f3d0;
        }
        .exec-success-box h3 { margin: 0; font-size: 16px; font-weight: 800; color: #fff; }
        .exec-success-box p { margin: 4px 0 0; font-size: 13px; color: #d1fae5; }
    </style>
</head>
<body>
<div class="container">

    <div class="top-nav">
        <div>
            <div style="margin-bottom: 8px;">
                <span class="badge <?php echo $execute ? 'badge-exec' : 'badge-dry'; ?>">
                    <?php echo $execute ? '✓ EXECUTED MODE (ডাটাবেজে সংরক্ষিত হয়েছে)' : '🔍 LIVE SIMULATION & PREVIEW MODE'; ?>
                </span>
            </div>
            <h1 class="brand-title">
                <span>🏛️ CCA Attendance Auto-Backfill & Mango Impact Simulator</span>
            </h1>
            <p class="subtitle">
                প্রতিটি স্টাফের যোগদানের তারিখ থেকে গতকাল পর্যন্ত অনুপস্থিত দিন ও ছুটি এবং <strong>আম গাছে কার কী অবস্থা ও ঋণ (Gap) হবে</strong> তার লাইভ প্রিভিউ।
            </p>
        </div>
        <div>
            <?php if (!$execute): ?>
                <a href="?execute=1" class="btn btn-execute" onclick="return confirm('আপনি কি নিশ্চিত যে পেছনের অনুপস্থিত দিনে সবার Attendance টেবিলে status = Absent যুক্ত করতে চান?\n\nএটি সাথে সাথে তাদের আম গাছে ওভারটাইম ঋণ (-৮ ঘণ্টা) কার্যকর করবে।');">
                    ⚡ এক ক্লিকে সব Absent ব্যাকফিল করুন (Execute)
                </a>
            <?php else: ?>
                <a href="?dry_run=1" class="btn btn-secondary">
                    🔄 পুনরায় ড্রাইভান (Preview) দেখুন
                </a>
            <?php endif; ?>
        </div>
    </div>

    <!-- POLICY MODE TOGGLE BAR -->
    <div class="policy-switcher">
        <div>
            <div class="policy-title">
                <span>⚙️ পলিসি মোড নির্বাচন (Simulation Mode)</span>
            </div>
            <p class="policy-desc">
                নিচের বাটন দিয়ে দেখুন: <strong>ছুটি ও অনুপস্থিতি উভয়ই আম দিয়ে কাটলে অবস্থা কী হবে</strong> বনাম <strong>শুধু অনুপস্থিতি কাটলে অবস্থা কী হবে</strong>।
            </p>
        </div>
        <div class="policy-toggle-group">
            <button class="policy-toggle-btn active" id="btnModeBoth" onclick="switchPolicyMode('both')">
                🥭 ছুটি + অনুপস্থিতি উভয়ই আম দিয়ে (নতুন নিয়ম)
            </button>
            <button class="policy-toggle-btn" id="btnModeAbsent" onclick="switchPolicyMode('absent')">
                ⚠️ শুধুমাত্র অনুপস্থিতি (Absent Only)
            </button>
        </div>
    </div>

    <?php if ($execute): ?>
        <div class="exec-success-box">
            <div style="font-size: 32px;">🎉</div>
            <div>
                <h3>সব অনুপস্থিত রেকর্ড সফলভাবে ডেটাবেজে যুক্ত হয়েছে!</h3>
                <p>পেছনের মোট <strong><?php echo $total_inserted; ?></strong> টি অনুপস্থিত রেকর্ড আপনার ডাটাবেজের `attendance` টেবিলে `status = 'Absent'` হিসেবে ইনসার্ট করা হয়েছে। এখন স্টাফ পোর্টালে তাদের আম গাছে স্বয়ংক্রিয়ভাবে ঘাটতি ঋণ (Overtime Debt) কার্যকর হয়ে গেছে।</p>
            </div>
        </div>
    <?php endif; ?>

    <!-- 6 METRIC CARDS (DYNAMICALLY UPDATED BY JS) -->
    <div class="stats-grid">
        <div class="stat-card blue">
            <div class="stat-label">মোট স্ক্যানকৃত স্টাফ</div>
            <div class="stat-value" style="color: #60a5fa;"><?php echo count($allStaff); ?> <span style="font-size: 14px; color: var(--text-muted);">জন</span></div>
            <div class="stat-sub">সক্রিয় সকল স্টাফ অডিটকৃত</div>
        </div>
        <div class="stat-card red">
            <div class="stat-label">অনুপস্থিত কর্মদিবস (ABSENT)</div>
            <div class="stat-value" style="color: #f87171;"><?php echo $total_missing_absents; ?> <span style="font-size: 14px; color: var(--text-muted);">দিন</span></div>
            <div class="stat-sub">বিনা অনুমতিতে অনুপস্থিত দিন</div>
        </div>
        <div class="stat-card amber">
            <div class="stat-label">অনুমোদিত ছুটি (LEAVE)</div>
            <div class="stat-value" style="color: #fbbf24;"><?php echo $total_unpaid_leaves; ?> <span style="font-size: 14px; color: var(--text-muted);">দিন</span></div>
            <div class="stat-sub">আবেদনকৃত অনুমোদিত ছুটি</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-label" id="cardPenaltyLabel">মোট কর্তনযোগ্য ঘণ্টা</div>
            <div class="stat-value" id="cardPenaltyValue" style="color: #fb923c;">-<?php echo $both_total_penalty_hours; ?> <span style="font-size: 14px; color: var(--text-muted);">ঘণ্টা</span></div>
            <div class="stat-sub" id="cardPenaltySub">মোট <?php echo $both_total_days; ?> দিনের জন্য (-৮h প্রতি দিন)</div>
        </div>
        <div class="stat-card purple">
            <div class="stat-label">পাকা আম কাটা পড়বে</div>
            <div class="stat-value" id="cardMangoLostValue" style="color: #c084fc;">-<?php echo $both_total_mangoes_lost; ?> <span style="font-size: 14px; color: var(--text-muted);">টি 🥭</span></div>
            <div class="stat-sub">জমানো পাকা আম নষ্ট হবে</div>
        </div>
        <div class="stat-card green">
            <div class="stat-label">ওভারটাইম ঋণে পড়বে (GAP)</div>
            <div class="stat-value" id="cardDebtStaffValue" style="color: #f87171;">⚠️ <?php echo $both_total_staff_in_debt; ?> <span style="font-size: 14px; color: var(--text-muted);">জন</span></div>
            <div class="stat-sub" id="cardSafeStaffSub">নিরাপদ থাকবে: <?php echo $both_total_staff_safe; ?> জন স্টাফ</div>
        </div>
    </div>

    <div class="main-card">
        <div class="tab-ribbon">
            <button class="tab-btn active" id="tabSummaryBtn" onclick="switchTab('summary')">
                <span>👤 স্টাফভিত্তিক প্রভাব ও সারসংক্ষেপ (Staff Impact Analysis)</span>
                <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 999px; font-size: 11px;"><?php echo count($allStaff); ?></span>
            </button>
            <button class="tab-btn" id="tabRowsBtn" onclick="switchTab('rows')">
                <span>📋 প্রতিটি অনুপস্থিত ও ছুটির রো আলাদাভাবে দেখুন (All Rows)</span>
                <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 2px 8px; border-radius: 999px; font-size: 11px;"><?php echo count($all_missing_rows); ?></span>
            </button>
        </div>

        <div class="filter-bar">
            <input type="text" id="searchInput" class="search-input" placeholder="🔍 স্টাফের নাম দিয়ে ফিল্টার করুন..." onkeyup="filterTables()">
            <select id="statusFilter" class="filter-select" onchange="filterTables()">
                <option value="all">সব স্টাফ দেখান</option>
                <option value="debt_only">⚠️ যারা ওভারটাইম ঋণে পড়বে (Debt / Gap Only)</option>
                <option value="mango_loss">🥭 যাদের আম কাটা পড়বে (Mangoes Lost)</option>
                <option value="clean_only">✓ শুধু যারা সম্পূর্ণ নিরাপদ (Safe)</option>
            </select>
        </div>

        <!-- VIEW 1: STAFF SUMMARY & MANGO IMPACT SIMULATION TABLE -->
        <div id="summaryView">
            <table>
                <thead>
                    <tr>
                        <th>স্টাফের নাম ও আইডি</th>
                        <th>যোগদানের তারিখ</th>
                        <th>উপস্থিত দিন</th>
                        <th>অনুপস্থিত দিন</th>
                        <th>অনুমোদিত ছুটি</th>
                        <th style="background: rgba(59, 130, 246, 0.08); color: #93c5fd;">বর্তমান আম ব্যালেন্স</th>
                        <th style="background: rgba(245, 158, 11, 0.08); color: #fcd34d;" id="thPenalty">মোট কর্তন</th>
                        <th style="background: rgba(239, 68, 68, 0.1); color: #fca5a5;" id="thImpact">আম গাছে চূড়ান্ত প্রভাব ও গ্যাপ</th>
                    </tr>
                </thead>
                <tbody id="summaryTableBody">
                    <?php foreach ($report as $r): ?>
                    <tr class="staff-row" 
                        data-name="<?php echo strtolower($r['name']); ?>" 
                        data-both-debt="<?php echo $r['both_projected_net'] < 0 ? '1' : '0'; ?>"
                        data-both-loss="<?php echo $r['both_mangoes_lost'] > 0 ? '1' : '0'; ?>"
                        data-both-clean="<?php echo $r['both_total_days'] === 0 ? '1' : '0'; ?>"
                        data-absent-debt="<?php echo $r['absent_projected_net'] < 0 ? '1' : '0'; ?>"
                        data-absent-loss="<?php echo $r['absent_mangoes_lost'] > 0 ? '1' : '0'; ?>"
                        data-absent-clean="<?php echo $r['unexcused_absent_count'] === 0 ? '1' : '0'; ?>"
                    >
                        <td>
                            <div class="user-cell">
                                <div class="avatar"><?php echo mb_substr($r['name'], 0, 1, 'UTF-8'); ?></div>
                                <div>
                                    <div style="font-weight: 800; font-size: 14px; color: #fff;"><?php echo htmlspecialchars($r['name']); ?></div>
                                    <div style="font-size: 11px; color: #6b7280;">User ID #<?php echo $r['user_id']; ?> &bull; শিফট: <?php echo $r['shift_hours']; ?>h</div>
                                </div>
                            </div>
                        </td>
                        <td style="color: #cbd5e1; font-weight: 600; font-family: monospace; font-size: 12px;">
                            <?php echo $r['joining_date']; ?>
                        </td>
                        <td>
                            <span style="color: #34d399; font-weight: 700;"><?php echo $r['present_days']; ?> দিন উপস্থিত</span>
                        </td>
                        <td>
                            <?php if ($r['unexcused_absent_count'] > 0): ?>
                                <span class="badge badge-absent"><?php echo $r['unexcused_absent_count']; ?> দিন Absent</span>
                                <div class="chip-container" style="margin-top: 4px;">
                                    <?php foreach ($r['unexcused_dates'] as $d): ?>
                                        <span class="date-chip"><?php echo $d; ?></span>
                                    <?php endforeach; ?>
                                </div>
                            <?php else: ?>
                                <span class="badge badge-present">✓ ০ দিন Absent</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if ($r['unpaid_leave_count'] > 0): ?>
                                <span class="badge badge-leave"><?php echo $r['unpaid_leave_count']; ?> দিন ছুটি</span>
                                <div class="chip-container" style="margin-top: 4px;">
                                    <?php foreach ($r['unpaid_leave_dates'] as $ld): ?>
                                        <span class="leave-chip"><?php echo $ld; ?></span>
                                    <?php endforeach; ?>
                                </div>
                            <?php else: ?>
                                <span style="color: #64748b; font-size: 12px;">০ দিন ছুটি</span>
                            <?php endif; ?>
                        </td>

                        <!-- Column 6: Current Mango Bank -->
                        <td style="background: rgba(59, 130, 246, 0.03);">
                            <?php if ($r['current_net_hours'] > 0): ?>
                                <div class="balance-pill positive">
                                    <span>🥭 <?php echo $r['current_ripe_mangoes']; ?> আম</span>
                                    <span>(+<?php echo $r['current_net_hours']; ?>h)</span>
                                </div>
                            <?php elseif ($r['current_net_hours'] == 0): ?>
                                <div class="balance-pill zero">
                                    <span>০ আম</span>
                                    <span>(০.০h)</span>
                                </div>
                            <?php else: ?>
                                <div class="balance-pill debt">
                                    <span>⚠️ -<?php echo $r['current_debt_hours']; ?>h ঋণ</span>
                                </div>
                            <?php endif; ?>
                        </td>

                        <!-- Column 7: Penalty Hours (Dynamically replaced by JS depending on mode) -->
                        <td style="background: rgba(245, 158, 11, 0.03);" class="penalty-cell">
                            <!-- Content rendered by updateTableCells() -->
                        </td>

                        <!-- Column 8: Final Projected Impact on Mango Tree -->
                        <td style="background: rgba(239, 68, 68, 0.03);" class="impact-cell">
                            <!-- Content rendered by updateTableCells() -->
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- VIEW 2: DETAILED ROW-BY-ROW TABLE -->
        <div id="rowsView" style="display: none;">
            <div style="padding: 12px 16px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; margin-bottom: 16px; font-size: 13px; color: #93c5fd;">
                ℹ️ <strong>নিচের তালিকায় সকল অনুপস্থিত দিন এবং অনুমোদিত ছুটির দিন দেখানো হচ্ছে:</strong> প্রতিটি দিনের জন্য -৮ ঘণ্টা হারে আম গাছ থেকে কর্তন বা ওভারটাইম ঋণ হিসাব করা হয়েছে।
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>User ID</th>
                        <th>স্টাফের নাম</th>
                        <th>তারিখ</th>
                        <th>বার (Day)</th>
                        <th>ধরন (Type)</th>
                        <th>আম কর্তন জরিমানা</th>
                    </tr>
                </thead>
                <tbody id="rowsTableBody">
                    <?php 
                    $rowIdx = 1;
                    foreach ($all_missing_rows as $mr): 
                    ?>
                    <tr class="missing-row" data-name="<?php echo strtolower($mr['name']); ?>">
                        <td style="color: var(--text-muted); font-family: monospace;"><?php echo $rowIdx++; ?></td>
                        <td style="color: #64748b; font-family: monospace;">#<?php echo $mr['user_id']; ?></td>
                        <td style="font-weight: 700; color: #fff;"><?php echo htmlspecialchars($mr['name']); ?></td>
                        <td style="font-family: monospace; color: #cbd5e1; font-weight: 600;"><?php echo $mr['date']; ?></td>
                        <td style="color: #94a3b8;"><?php echo $mr['day_name']; ?></td>
                        <td>
                            <span class="badge <?php echo $mr['type'] === 'Absent' ? 'badge-absent' : 'badge-leave'; ?>">
                                <?php echo $mr['type_badge']; ?>
                            </span>
                        </td>
                        <td>
                            <span style="color: #f87171; font-weight: 800; font-family: monospace;">
                                -<?php echo $mr['penalty_hours']; ?> ঘণ্টা (১ আম)
                            </span>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

    </div>
</div>

<script>
// Raw Report Data serialized from PHP for instantaneous client-side recalculation
const reportData = <?php echo json_encode($report); ?>;

let currentMode = 'both'; // 'both' or 'absent'

function switchPolicyMode(mode) {
    currentMode = mode;
    const btnBoth = document.getElementById('btnModeBoth');
    const btnAbsent = document.getElementById('btnModeAbsent');

    if (mode === 'both') {
        btnBoth.classList.add('active');
        btnAbsent.classList.remove('active');

        document.getElementById('cardPenaltyLabel').innerText = 'মোট কর্তনযোগ্য ঘণ্টা';
        document.getElementById('cardPenaltyValue').innerHTML = '-<?php echo $both_total_penalty_hours; ?> <span style="font-size: 14px; color: var(--text-muted);">ঘণ্টা</span>';
        document.getElementById('cardPenaltySub').innerText = 'মোট <?php echo $both_total_days; ?> দিনের জন্য (-৮h প্রতি দিন)';

        document.getElementById('cardMangoLostValue').innerHTML = '-<?php echo $both_total_mangoes_lost; ?> <span style="font-size: 14px; color: var(--text-muted);">টি 🥭</span>';
        document.getElementById('cardDebtStaffValue').innerHTML = '⚠️ <?php echo $both_total_staff_in_debt; ?> <span style="font-size: 14px; color: var(--text-muted);">জন</span>';
        document.getElementById('cardSafeStaffSub').innerText = 'নিরাপদ থাকবে: <?php echo $both_total_staff_safe; ?> জন স্টাফ';

        document.getElementById('thPenalty').innerText = 'মোট কর্তন (ছুটি + অনুপস্থিতি)';
        document.getElementById('thImpact').innerText = 'আম গাছে চূড়ান্ত প্রভাব ও গ্যাপ';
    } else {
        btnAbsent.classList.add('active');
        btnBoth.classList.remove('active');

        document.getElementById('cardPenaltyLabel').innerText = 'অনুপস্থিতি জরিমানা ঘণ্টা';
        document.getElementById('cardPenaltyValue').innerHTML = '-<?php echo $absent_total_penalty_hours; ?> <span style="font-size: 14px; color: var(--text-muted);">ঘণ্টা</span>';
        document.getElementById('cardPenaltySub').innerText = 'মোট <?php echo $total_missing_absents; ?> দিনের জন্য (-৮h প্রতি দিন)';

        document.getElementById('cardMangoLostValue').innerHTML = '-<?php echo $absent_total_mangoes_lost; ?> <span style="font-size: 14px; color: var(--text-muted);">টি 🥭</span>';
        document.getElementById('cardDebtStaffValue').innerHTML = '⚠️ <?php echo $absent_total_staff_in_debt; ?> <span style="font-size: 14px; color: var(--text-muted);">জন</span>';
        document.getElementById('cardSafeStaffSub').innerText = 'নিরাপদ থাকবে: <?php echo $absent_total_staff_safe; ?> জন স্টাফ';

        document.getElementById('thPenalty').innerText = 'অনুপস্থিতি জরিমানা (Absent Only)';
        document.getElementById('thImpact').innerText = 'আম গাছে চূড়ান্ত প্রভাব (Absent Only)';
    }

    renderTableCells();
    filterTables();
}

function renderTableCells() {
    const rows = document.querySelectorAll('.staff-row');
    rows.forEach((row, idx) => {
        const item = reportData[idx];
        const penaltyCell = row.querySelector('.penalty-cell');
        const impactCell = row.querySelector('.impact-cell');

        if (currentMode === 'both') {
            // Mode 1: Both Leave & Absent
            const days = item.both_total_days;
            const penaltyH = item.both_penalty_hours;
            const netH = item.both_projected_net;
            const ripe = item.both_projected_ripe;
            const debt = item.both_projected_debt;
            const lost = item.both_mangoes_lost;

            if (days > 0) {
                penaltyCell.innerHTML = `
                    <span style="color: #f87171; font-weight: 800; font-family: monospace; font-size: 13px;">
                        -${penaltyH} ঘণ্টা
                    </span>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        (${days} দিন &times; ${item.shift_hours}h)
                    </div>
                `;
            } else {
                penaltyCell.innerHTML = `<span style="color: #9ca3af; font-size: 12px;">০ ঘণ্টা (কোনো কর্তন নেই)</span>`;
            }

            if (days === 0) {
                impactCell.innerHTML = `
                    <div class="impact-card safe">
                        ✓ সম্পূর্ণ নিরাপদ (০ কর্তন)
                        <div class="sub">আম গাছে কোনো জরিমানা নেই</div>
                    </div>
                `;
            } else if (netH >= 0) {
                impactCell.innerHTML = `
                    <div class="impact-card warning">
                        <strong>🥭 ${ripe} পাকা আম থাকবে</strong>
                        <div class="sub">
                            অবশিষ্ট ব্যালেন্স: <strong>+${netH}h</strong>
                            ${lost > 0 ? `&bull; (-${lost} আম কাটা যাবে)` : ''}
                        </div>
                    </div>
                `;
            } else {
                impactCell.innerHTML = `
                    <div class="impact-card debt">
                        <strong>⚠️ -${debt}h ওভারটাইম ঋণ (Gap) হবে</strong>
                        <div class="sub">
                            ০ পাকা আম &bull; পরবর্তী ওভারটাইম থেকে ঋণ শোধ হবে
                        </div>
                    </div>
                `;
            }

        } else {
            // Mode 2: Absent Only
            const days = item.unexcused_absent_count;
            const penaltyH = item.absent_penalty_hours;
            const netH = item.absent_projected_net;
            const ripe = item.absent_projected_ripe;
            const debt = item.absent_projected_debt;
            const lost = item.absent_mangoes_lost;

            if (days > 0) {
                penaltyCell.innerHTML = `
                    <span style="color: #f87171; font-weight: 800; font-family: monospace; font-size: 13px;">
                        -${penaltyH} ঘণ্টা
                    </span>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        (${days} দিন &times; ${item.shift_hours}h)
                    </div>
                `;
            } else {
                penaltyCell.innerHTML = `<span style="color: #9ca3af; font-size: 12px;">০ ঘণ্টা (কোনো অনুপস্থিতি নেই)</span>`;
            }

            if (days === 0) {
                impactCell.innerHTML = `
                    <div class="impact-card safe">
                        ✓ সম্পূর্ণ নিরাপদ (০ Absent)
                        <div class="sub">অনুপস্থিতির কোনো জরিমানা নেই</div>
                    </div>
                `;
            } else if (netH >= 0) {
                impactCell.innerHTML = `
                    <div class="impact-card warning">
                        <strong>🥭 ${ripe} পাকা আম থাকবে</strong>
                        <div class="sub">
                            অবশিষ্ট ব্যালেন্স: <strong>+${netH}h</strong>
                            ${lost > 0 ? `&bull; (-${lost} আম কাটা যাবে)` : ''}
                        </div>
                    </div>
                `;
            } else {
                impactCell.innerHTML = `
                    <div class="impact-card debt">
                        <strong>⚠️ -${debt}h ওভারটাইম ঋণ (Gap) হবে</strong>
                        <div class="sub">
                            ০ পাকা আম &bull; পরবর্তী ওভারটাইম থেকে ঋণ শোধ হবে
                        </div>
                    </div>
                `;
            }
        }
    });
}

function switchTab(tab) {
    const summaryView = document.getElementById('summaryView');
    const rowsView = document.getElementById('rowsView');
    const summaryBtn = document.getElementById('tabSummaryBtn');
    const rowsBtn = document.getElementById('tabRowsBtn');

    if (tab === 'summary') {
        summaryView.style.display = 'block';
        rowsView.style.display = 'none';
        summaryBtn.classList.add('active');
        rowsBtn.classList.remove('active');
    } else {
        summaryView.style.display = 'none';
        rowsView.style.display = 'block';
        rowsBtn.classList.add('active');
        summaryBtn.classList.remove('active');
    }
}

function filterTables() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter').value;

    const summaryRows = document.querySelectorAll('.staff-row');
    summaryRows.forEach(row => {
        const name = row.getAttribute('data-name');
        const matchSearch = name.includes(searchVal);

        let matchStatus = true;
        if (currentMode === 'both') {
            const debt = row.getAttribute('data-both-debt');
            const loss = row.getAttribute('data-both-loss');
            const clean = row.getAttribute('data-both-clean');
            if (statusVal === 'debt_only') matchStatus = debt === '1';
            else if (statusVal === 'mango_loss') matchStatus = loss === '1';
            else if (statusVal === 'clean_only') matchStatus = clean === '1';
        } else {
            const debt = row.getAttribute('data-absent-debt');
            const loss = row.getAttribute('data-absent-loss');
            const clean = row.getAttribute('data-absent-clean');
            if (statusVal === 'debt_only') matchStatus = debt === '1';
            else if (statusVal === 'mango_loss') matchStatus = loss === '1';
            else if (statusVal === 'clean_only') matchStatus = clean === '1';
        }

        if (matchSearch && matchStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    const missingRows = document.querySelectorAll('.missing-row');
    missingRows.forEach(row => {
        const name = row.getAttribute('data-name');
        if (name.includes(searchVal)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initial render on page load
document.addEventListener('DOMContentLoaded', () => {
    renderTableCells();
});
renderTableCells();
</script>
</body>
</html>
