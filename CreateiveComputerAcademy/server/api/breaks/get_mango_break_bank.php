<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));
$user_id = null;

if (isset($data->user_id)) {
    $user_id = (int)$data->user_id;
} else if (isset($_GET['user_id'])) {
    $user_id = (int)$_GET['user_id'];
}

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

try {
    // 1. Fetch User Info & Shift Hours
    $userStmt = $db->prepare("SELECT u.id, u.name, u.email, u.profile_picture, 
                                     COALESCE(e.shift_hours, 8) as shift_hours,
                                     COALESCE(e.allocated_break_minutes, 60) as allocated_break_minutes
                              FROM users u 
                              LEFT JOIN employees e ON u.id = e.user_id 
                              WHERE u.id = :user_id LIMIT 1");
    $userStmt->execute([':user_id' => $user_id]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    $shift_hours = (float)$user['shift_hours'];
    if ($shift_hours <= 0) $shift_hours = 8.0;

    // 2. Discover available months from attendance history
    $cur_month_key = date('Y-m');
    $monthStmt = $db->prepare("
        SELECT DISTINCT DATE_FORMAT(date, '%Y-%m') as m_key, 
                        DATE_FORMAT(date, '%M %Y') as m_label 
        FROM attendance 
        WHERE user_id = :user_id AND date IS NOT NULL
        ORDER BY m_key DESC
    ");
    $monthStmt->execute([':user_id' => $user_id]);
    $month_rows = $monthStmt->fetchAll(PDO::FETCH_ASSOC);

    $available_months = [];
    $has_cur_month = false;
    foreach ($month_rows as $mr) {
        if ($mr['m_key'] === $cur_month_key) {
            $has_cur_month = true;
        }
        $available_months[] = [
            'month_key' => $mr['m_key'],
            'label' => $mr['m_label']
        ];
    }
    if (!$has_cur_month) {
        array_unshift($available_months, [
            'month_key' => $cur_month_key,
            'label' => date('F Y')
        ]);
    }
    $available_months[] = [
        'month_key' => 'all',
        'label' => '🌐 All Time (সব সময়)'
    ];

    // Determine requested month (default to current ongoing month)
    $requested_month = isset($_GET['month']) ? trim($_GET['month']) : (isset($data->month) ? trim($data->month) : 'current');
    if ($requested_month === 'current') {
        $requested_month = $cur_month_key;
    }

    $is_all_time = ($requested_month === 'all');
    $month_start = null;
    $month_end = null;
    $selected_month_label = 'All Time (সব সময়)';

    if (!$is_all_time) {
        $month_start = date('Y-m-01', strtotime($requested_month . '-01'));
        $month_end = date('Y-m-t', strtotime($requested_month . '-01'));
        $selected_month_label = date('F Y', strtotime($month_start));
    }

    // 3. Fetch completed attendance records for this user (filtered by month if specified)
    $attSql = "SELECT date, check_in, check_out, status 
               FROM attendance 
               WHERE user_id = :user_id AND check_in IS NOT NULL AND check_out IS NOT NULL";
    $attParams = [':user_id' => $user_id];
    if (!$is_all_time) {
        $attSql .= " AND date BETWEEN :m_start AND :m_end";
        $attParams[':m_start'] = $month_start;
        $attParams[':m_end'] = $month_end;
    }
    $attSql .= " ORDER BY date ASC";
    $attStmt = $db->prepare($attSql);
    $attStmt->execute($attParams);
    $attendance_rows = $attStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Fetch Holidays to consider weekend / holiday hours
    $holidays = [];
    $holStmt = $db->query("SELECT date, title, expected_hours FROM holidays");
    if ($holStmt) {
        while ($h = $holStmt->fetch(PDO::FETCH_ASSOC)) {
            $holidays[$h['date']] = (float)$h['expected_hours'];
        }
    }

    // 5. Fetch Mango Breaks (Full Day & In-Shift) directly from central user_breaks table
    $claimsSql = "SELECT id, date, break_type, purpose, duration_minutes, reason, status, created_at 
                  FROM user_breaks 
                  WHERE user_id = :user_id 
                    AND break_type IN ('Mango Full Day', 'Mango Break', 'Mango Overtime') 
                    AND status != 'Rejected'";
    $claimsParams = [':user_id' => $user_id];
    if (!$is_all_time) {
        $claimsSql .= " AND date BETWEEN :m_start AND :m_end";
        $claimsParams[':m_start'] = $month_start;
        $claimsParams[':m_end'] = $month_end;
    }
    $claimsSql .= " ORDER BY date DESC, id DESC";
    $claimsStmt = $db->prepare($claimsSql);
    $claimsStmt->execute($claimsParams);
    $all_mango_breaks = $claimsStmt->fetchAll(PDO::FETCH_ASSOC);

    $total_claimed_hours = 0.0;
    $total_in_shift_mango_hours = 0.0;
    $claimed_break_dates = [];
    $unified_claims = [];
    $in_shift_mango_breaks = [];

    foreach ($all_mango_breaks as $mb) {
        $hrs = round((int)$mb['duration_minutes'] / 60, 2);
        if ($mb['break_type'] === 'Mango Full Day') {
            $total_claimed_hours += $hrs;
            if (!empty($mb['date'])) {
                $claimed_break_dates[$mb['date']] = true;
            }
            $unified_claims[] = [
                'id' => 'break-' . $mb['id'],
                'claim_date' => !empty($mb['created_at']) ? date('Y-m-d', strtotime($mb['created_at'])) : $mb['date'],
                'leave_date' => $mb['date'],
                'hours_claimed' => $hrs,
                'type' => 'Full Day Break (1 Mango 🥭)',
                'purpose' => !empty($mb['purpose']) ? $mb['purpose'] : 'Full Day',
                'reason' => $mb['reason'] ?: 'Full Day Paid Break',
                'status' => $mb['status']
            ];
        } else {
            $total_in_shift_mango_hours += $hrs;
            $in_shift_mango_breaks[] = $mb;
            $unified_claims[] = [
                'id' => 'break-' . $mb['id'],
                'claim_date' => $mb['date'],
                'leave_date' => $mb['date'],
                'hours_claimed' => $hrs,
                'duration_minutes' => (int)$mb['duration_minutes'],
                'type' => 'In-Shift Extra Break ⏱️',
                'purpose' => !empty($mb['purpose']) ? $mb['purpose'] : 'Personal',
                'reason' => $mb['reason'] ?: 'Mango Overtime Break',
                'status' => $mb['status']
            ];
        }
    }

    // 6. Aggregate attendance per calendar day to avoid false gaps on split check-ins
    $daily_worked = [];
    foreach ($attendance_rows as $row) {
        $in_ts = strtotime($row['check_in']);
        $out_ts = strtotime($row['check_out']);
        if ($out_ts <= $in_ts) continue;

        $dt = $row['date'];
        if (!isset($daily_worked[$dt])) {
            $daily_worked[$dt] = 0;
        }
        $daily_worked[$dt] += ($out_ts - $in_ts);
    }

    $total_worked_seconds = 0;
    $total_expected_seconds = 0;
    $total_overtime_seconds = 0;
    $total_short_seconds = 0;
    $contributions = [];
    $gaps = [];

    foreach ($daily_worked as $date_str => $worked_sec) {
        $total_worked_seconds += $worked_sec;

        $is_friday = (date('N', strtotime($date_str)) == 5);
        $expected_sec = $is_friday ? 0 : ($shift_hours * 3600);

        if (isset($holidays[$date_str])) {
            $expected_sec = $holidays[$date_str] * 3600;
        }

        $total_expected_seconds += $expected_sec;
        $diff_sec = $worked_sec - $expected_sec;

        if ($diff_sec > 0) {
            $total_overtime_seconds += $diff_sec;
            $contributions[] = [
                'date' => $date_str,
                'worked_hours' => round($worked_sec / 3600, 2),
                'expected_hours' => round($expected_sec / 3600, 2),
                'overtime_hours' => round($diff_sec / 3600, 2),
                'overtime_seconds' => $diff_sec,
                'type' => 'overtime'
            ];
        } else if ($diff_sec < -900 && !$is_friday) {
            // Gap / Short shift more than 15 minutes
            $short_sec = abs($diff_sec);
            $total_short_seconds += $short_sec;
            $gaps[] = [
                'date' => $date_str,
                'worked_hours' => round($worked_sec / 3600, 2),
                'expected_hours' => round($expected_sec / 3600, 2),
                'short_hours' => round($short_sec / 3600, 2),
                'short_seconds' => $short_sec,
                'type' => 'gap'
            ];
        }
    }

    $total_expected_hours = round($total_expected_seconds / 3600, 2);
    $total_worked_hours = round($total_worked_seconds / 3600, 2);
    $total_overtime_hours = round($total_overtime_seconds / 3600, 2);
    $total_short_hours = round($total_short_seconds / 3600, 2);

    // 7. Fetch Approved Leaves & Absences in selected period
    $leaveDates = [];
    
    // a. From leave_requests table where status = 'Approved'
    try {
        $lrSql = "SELECT id, start_date, end_date, type, reason, status 
                  FROM leave_requests 
                  WHERE user_id = :user_id AND status = 'Approved'";
        $lrParams = [':user_id' => $user_id];
        if (!$is_all_time) {
            $lrSql .= " AND end_date >= :m_start AND start_date <= :m_end";
            $lrParams[':m_start'] = $month_start;
            $lrParams[':m_end'] = $month_end;
        }
        $lrSql .= " ORDER BY start_date DESC";
        $lrStmt = $db->prepare($lrSql);
        $lrStmt->execute($lrParams);
        $approvedLeaves = $lrStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($approvedLeaves as $al) {
            $cur = strtotime($al['start_date']);
            $end = strtotime($al['end_date']);
            while ($cur <= $end) {
                $dt = date('Y-m-d', $cur);
                // Exclude dates outside the selected month
                if (!$is_all_time && ($dt < $month_start || $dt > $month_end)) {
                    $cur = strtotime('+1 day', $cur);
                    continue;
                }
                // Exclude Fridays and dates already paid/covered by claimed mango breaks
                if (date('N', $cur) != 5 && !isset($claimed_break_dates[$dt])) {
                    $leaveDates[$dt] = [
                        'date' => $dt,
                        'type' => $al['type'] ?? 'Approved Leave',
                        'reason' => $al['reason'] ?? 'Approved Leave Request',
                        'hours_deducted' => $shift_hours,
                        'source' => 'Leave Request'
                    ];
                }
                $cur = strtotime('+1 day', $cur);
            }
        }
    } catch (Throwable $e) {}

    // b. From attendance table where status = 'Leave' or status = 'Absent'
    try {
        $attLeaveSql = "SELECT date, status FROM attendance WHERE user_id = :user_id AND status IN ('Leave', 'Absent')";
        $attLeaveParams = [':user_id' => $user_id];
        if (!$is_all_time) {
            $attLeaveSql .= " AND date BETWEEN :m_start AND :m_end";
            $attLeaveParams[':m_start'] = $month_start;
            $attLeaveParams[':m_end'] = $month_end;
        }
        $attLeaveStmt = $db->prepare($attLeaveSql);
        $attLeaveStmt->execute($attLeaveParams);
        while ($attL = $attLeaveStmt->fetch(PDO::FETCH_ASSOC)) {
            $dt = $attL['date'];
            $cur = strtotime($dt);
            if (date('N', $cur) != 5 && !isset($leaveDates[$dt]) && !isset($claimed_break_dates[$dt])) {
                $leaveDates[$dt] = [
                    'date' => $dt,
                    'type' => $attL['status'],
                    'reason' => $attL['status'] === 'Absent' ? 'Absent Day' : 'Recorded Leave Day',
                    'hours_deducted' => $shift_hours,
                    'source' => 'Attendance Record'
                ];
            }
        }
    } catch (Throwable $e) {}

    $total_leave_days = count($leaveDates);
    $total_leave_deducted_hours = round($total_leave_days * $shift_hours, 2);
    $total_gap_hours = round($total_short_hours + $total_leave_deducted_hours, 2);

    $total_absent_days = 0;
    $total_absent_deducted_hours = 0.0;
    foreach ($leaveDates as $ld) {
        if ($ld['type'] === 'Absent') {
            $total_absent_days++;
            $total_absent_deducted_hours += (float)$ld['hours_deducted'];
            $unified_claims[] = [
                'id' => 'absent-' . $ld['date'],
                'claim_date' => $ld['date'],
                'leave_date' => $ld['date'],
                'hours_claimed' => (float)$ld['hours_deducted'],
                'type' => 'Unexcused Absence (Absent ⚠️)',
                'purpose' => 'Absent Penalty',
                'reason' => "Marked Absent on {$ld['date']} (-{$ld['hours_deducted']}h Overtime Debt)",
                'status' => 'Deducted'
            ];
        }
    }

    // 8. Cashed Out Overtime from staff_withdrawals (Money vs Mango Choice)
    $total_cashed_out_overtime_hours = 0.0;
    try {
        $cwSql = "SELECT id, requested_at, overtime_hours_cashed, amount, status 
                  FROM staff_withdrawals 
                  WHERE user_id = :user_id 
                    AND overtime_hours_cashed > 0 
                    AND status != 'rejected'";
        $cwParams = [':user_id' => $user_id];
        if (!$is_all_time) {
            $cwSql .= " AND DATE(requested_at) BETWEEN :m_start AND :m_end";
            $cwParams[':m_start'] = $month_start;
            $cwParams[':m_end'] = $month_end;
        }
        $cwSql .= " ORDER BY requested_at DESC";
        $cwStmt = $db->prepare($cwSql);
        $cwStmt->execute($cwParams);
        $cashed_withdrawals = $cwStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cashed_withdrawals as $cw) {
            $hrs = (float)$cw['overtime_hours_cashed'];
            $total_cashed_out_overtime_hours += $hrs;
            $unified_claims[] = [
                'id' => 'cashout-' . $cw['id'],
                'claim_date' => date('Y-m-d', strtotime($cw['requested_at'])),
                'leave_date' => date('Y-m-d', strtotime($cw['requested_at'])),
                'hours_claimed' => $hrs,
                'type' => 'Cashed Out to Payroll ৳',
                'reason' => 'Withdrawn as cash overtime (৳' . number_format($cw['amount'], 2) . ')',
                'status' => $cw['status']
            ];
        }
    } catch (Throwable $e) {}

    // 9. P2P Overtime Trades from staff_overtime_trades (Bought & Sold Peer Trades)
    $total_bought_overtime_hours = 0.0;
    $total_sold_overtime_hours = 0.0;
    try {
        $tbSql = "SELECT t.id, t.trade_code, t.seller_id, t.hours_traded, t.total_price, t.status, t.created_at, u.name as seller_name
                  FROM staff_overtime_trades t
                  LEFT JOIN users u ON t.seller_id = u.id
                  WHERE t.buyer_id = :user_id AND t.status = 'approved'";
        $tbParams = [':user_id' => $user_id];
        if (!$is_all_time) {
            $tbSql .= " AND DATE(t.created_at) BETWEEN :m_start AND :m_end";
            $tbParams[':m_start'] = $month_start;
            $tbParams[':m_end'] = $month_end;
        }
        $tbSql .= " ORDER BY t.created_at DESC";
        $tbStmt = $db->prepare($tbSql);
        $tbStmt->execute($tbParams);
        $boughtTrades = $tbStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($boughtTrades as $bt) {
            $bHrs = (float)$bt['hours_traded'];
            $total_bought_overtime_hours += $bHrs;
            $sellerName = $bt['seller_name'] ?: "Colleague #{$bt['seller_id']}";
            $unified_claims[] = [
                'id' => 'trade-buy-' . $bt['id'],
                'claim_date' => date('Y-m-d', strtotime($bt['created_at'])),
                'leave_date' => date('Y-m-d', strtotime($bt['created_at'])),
                'hours_claimed' => $bHrs,
                'type' => 'P2P Bought Overtime 🛒',
                'purpose' => 'Bought Overtime',
                'reason' => "Purchased {$bHrs}h overtime from {$sellerName} (৳" . number_format($bt['total_price'], 2) . ")",
                'status' => 'Approved'
            ];
        }

        $tsSql = "SELECT t.id, t.trade_code, t.buyer_id, t.hours_traded, t.total_price, t.status, t.created_at, u.name as buyer_name
                  FROM staff_overtime_trades t
                  LEFT JOIN users u ON t.buyer_id = u.id
                  WHERE t.seller_id = :user_id AND t.status IN ('approved', 'pending_admin', 'pending_seller')";
        $tsParams = [':user_id' => $user_id];
        if (!$is_all_time) {
            $tsSql .= " AND DATE(t.created_at) BETWEEN :m_start AND :m_end";
            $tsParams[':m_start'] = $month_start;
            $tsParams[':m_end'] = $month_end;
        }
        $tsSql .= " ORDER BY t.created_at DESC";
        $tsStmt = $db->prepare($tsSql);
        $tsStmt->execute($tsParams);
        $soldTrades = $tsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($soldTrades as $st) {
            $sHrs = (float)$st['hours_traded'];
            $total_sold_overtime_hours += $sHrs;
            $buyerName = $st['buyer_name'] ?: "Colleague #{$st['buyer_id']}";
            $statusTitle = ($st['status'] === 'approved') ? 'Approved' : 'Pending';
            $unified_claims[] = [
                'id' => 'trade-sell-' . $st['id'],
                'claim_date' => date('Y-m-d', strtotime($st['created_at'])),
                'leave_date' => date('Y-m-d', strtotime($st['created_at'])),
                'hours_claimed' => $sHrs,
                'type' => 'P2P Sold Overtime 💵',
                'purpose' => 'Sold Overtime',
                'reason' => "Sold {$sHrs}h overtime to {$buyerName} (৳" . number_format($st['total_price'], 2) . ")",
                'status' => $statusTitle
            ];
        }
    } catch (Throwable $e) {}

    // 10. Tiffin Efficiency Savings & Penalties
    $tiffin_summary = BreakDbHelper::getTiffinSummary($db, $user_id);
    $total_tiffin_bonus_hours = round($tiffin_summary['bonus_minutes'] / 60, 2);
    $total_tiffin_penalty_hours = round($tiffin_summary['penalty_minutes'] / 60, 2);

    try {
        $tfSql = "SELECT id, date, duration_minutes, tiffin_delta_minutes, created_at 
                  FROM user_breaks 
                  WHERE user_id = :user_id AND break_type = 'Tiffin' AND status = 'Completed' AND tiffin_delta_minutes != 0";
        $tfParams = [':user_id' => $user_id];
        if (!$is_all_time) {
            $tfSql .= " AND date BETWEEN :m_start AND :m_end";
            $tfParams[':m_start'] = $month_start;
            $tfParams[':m_end'] = $month_end;
        }
        $tfSql .= " ORDER BY date DESC";
        $tfStmt = $db->prepare($tfSql);
        $tfStmt->execute($tfParams);
        $tiffinRows = $tfStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tiffinRows as $tf) {
            $tDelta = (int)$tf['tiffin_delta_minutes'];
            // Tiffin savings are kept in tiffin_summary/tiffin_history, not mixed into the Overtime attendance table
            if ($tDelta < 0) {
                $absDelta = abs($tDelta);
                $unified_claims[] = [
                    'id' => 'tiffin-pen-' . $tf['id'],
                    'claim_date' => $tf['date'],
                    'leave_date' => $tf['date'],
                    'hours_claimed' => round($absDelta / 60, 2),
                    'type' => 'Tiffin Over-Break ⚡',
                    'purpose' => 'Over-Break Penalty',
                    'reason' => "Tiffin took {$tf['duration_minutes']}m (Exceeded 40m by {$absDelta}m)",
                    'status' => 'Deducted'
                ];
            }
        }
        $allTfStmt = $db->prepare("SELECT id, date, start_time, end_time, duration_minutes, COALESCE(tiffin_delta_minutes, 0) as tiffin_delta_minutes, status, created_at FROM user_breaks WHERE user_id = :user_id AND break_type = 'Tiffin' AND status = 'Completed' ORDER BY date DESC, id DESC LIMIT 50");
        $allTfStmt->execute([':user_id' => $user_id]);
        $tiffin_history = $allTfStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $etf) {
        $tiffin_history = [];
    }

    usort($unified_claims, function($a, $b) {
        return strcmp($b['claim_date'], $a['claim_date']);
    });

    // Available Net Overtime Balance for this period
    $total_gross_overtime_hours = round($total_overtime_hours + $total_bought_overtime_hours + $total_tiffin_bonus_hours, 2);
    $total_deducted_hours = round($total_claimed_hours + $total_in_shift_mango_hours + $total_cashed_out_overtime_hours + $total_sold_overtime_hours + $total_tiffin_penalty_hours + $total_absent_deducted_hours, 2);
    
    $net_balance_hours = round($total_gross_overtime_hours - $total_deducted_hours, 2);
    $has_overtime_debt = ($net_balance_hours < 0);
    $overtime_debt_hours = $has_overtime_debt ? abs($net_balance_hours) : 0.0;
    $available_hours = max(0, $net_balance_hours);

    // Calculate Ripe Mangoes for this selected period
    $ripe_mango_count = $has_overtime_debt ? 0 : (int)floor($available_hours / $shift_hours);
    $partial_hours = $has_overtime_debt ? 0.0 : fmod($available_hours, $shift_hours);
    $progress_to_next_mango = ($shift_hours > 0 && !$has_overtime_debt) ? round(($partial_hours / $shift_hours) * 100, 1) : 0;
    $remaining_hours_for_next = $has_overtime_debt 
        ? round($overtime_debt_hours + $shift_hours, 2) 
        : round($shift_hours - $partial_hours, 2);

    // 11. All-time cumulative available hours & ripe mangoes (for break booking availability)
    $all_time_balance_minutes = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);
    $all_time_available_hours = round(max(0, $all_time_balance_minutes / 60.0), 2);
    $all_time_ripe_mangoes = (int)floor($all_time_available_hours / $shift_hours);

    // Generate individual Mango items for the tree
    $mango_items = [];
    $posTemplates = [
        ['x' => 42, 'y' => 24, 'branch' => 'crown-left'],
        ['x' => 58, 'y' => 24, 'branch' => 'crown-right'],
        ['x' => 37, 'y' => 34, 'branch' => 'mid-left'],
        ['x' => 63, 'y' => 34, 'branch' => 'mid-right'],
        ['x' => 50, 'y' => 32, 'branch' => 'center-crown'],
        ['x' => 43, 'y' => 42, 'branch' => 'lower-left'],
        ['x' => 57, 'y' => 42, 'branch' => 'lower-right'],
        ['x' => 50, 'y' => 44, 'branch' => 'center-bough'],
        ['x' => 38, 'y' => 40, 'branch' => 'inner-left'],
        ['x' => 62, 'y' => 40, 'branch' => 'inner-right'],
        ['x' => 47, 'y' => 26, 'branch' => 'high-left'],
        ['x' => 53, 'y' => 26, 'branch' => 'high-right']
    ];

    $display_mango_count = (int)$ripe_mango_count;

    for ($i = 0; $i < $display_mango_count; $i++) {
        $pos = $posTemplates[$i % count($posTemplates)];
        $mango_items[] = [
            'id' => $i + 1,
            'title' => "Ripe Mango #" . ($i + 1),
            'type' => 'ripe',
            'status' => 'available',
            'hours' => $shift_hours,
            'description' => "Mature Mango: {$shift_hours}h Overtime Earned & Ready to Redeem as a Full-Day Break or Cash!",
            'position' => [
                'x' => $pos['x'] + (floor($i / count($posTemplates)) * 2),
                'y' => $pos['y'] + (floor($i / count($posTemplates)) * 2)
            ],
            'branch' => $pos['branch']
        ];
    }

    // Growing / Unripe mango (In progress)
    $growing_mango = null;
    if ($partial_hours > 0) {
        $pos = $posTemplates[$display_mango_count % count($posTemplates)];
        $growing_mango = [
            'id' => $display_mango_count + 1,
            'title' => "Growing Mango #" . ($display_mango_count + 1),
            'type' => 'growing',
            'status' => 'in_progress',
            'current_hours' => round($partial_hours, 2),
            'target_hours' => $shift_hours,
            'remaining_hours' => $remaining_hours_for_next,
            'progress_percent' => $progress_to_next_mango,
            'description' => "Ripening: {$partial_hours}h / {$shift_hours}h earned. Need {$remaining_hours_for_next}h more overtime to mature!",
            'position' => [
                'x' => min(64, max(36, $pos['x'] + 2)),
                'y' => min(46, max(22, $pos['y'] + 4))
            ]
        ];
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'shift_hours' => $shift_hours,
                'avatar' => $user['profile_picture']
            ],
            'summary' => [
                'shift_hours' => $shift_hours,
                'selected_month' => $requested_month,
                'selected_month_label' => $selected_month_label,
                'available_months' => $available_months,
                'is_all_time' => $is_all_time,
                'total_expected_hours' => $total_expected_hours,
                'total_worked_hours' => $total_worked_hours,
                'total_gap_hours' => $total_gap_hours,
                'total_overtime_hours' => $total_overtime_hours,
                'total_short_hours' => $total_short_hours,
                'total_leave_days' => $total_leave_days,
                'total_leave_deducted_hours' => $total_leave_deducted_hours,
                'total_claimed_hours' => $total_claimed_hours,
                'total_in_shift_mango_hours' => $total_in_shift_mango_hours,
                'total_cashed_out_overtime_hours' => $total_cashed_out_overtime_hours,
                'total_bought_overtime_hours' => $total_bought_overtime_hours,
                'total_sold_overtime_hours' => $total_sold_overtime_hours,
                'total_gross_overtime_hours' => $total_gross_overtime_hours,
                'total_deducted_hours' => $total_deducted_hours,
                'net_overtime_balance' => $net_balance_hours,
                'has_overtime_debt' => $has_overtime_debt,
                'overtime_debt_hours' => $overtime_debt_hours,
                'total_absent_days' => $total_absent_days,
                'total_absent_deducted_hours' => $total_absent_deducted_hours,
                'available_break_hours' => $available_hours,
                'available_break_days' => round($available_hours / $shift_hours, 2),
                'ripe_mangoes_count' => (int)$ripe_mango_count,
                'all_time_ripe_mangoes_count' => (int)$all_time_ripe_mangoes,
                'all_time_available_hours' => $all_time_available_hours,
                'partial_hours' => round($partial_hours, 2),
                'progress_to_next_mango' => $progress_to_next_mango,
                'remaining_hours_for_next' => $remaining_hours_for_next,
                'total_tiffin_bonus_hours' => $total_tiffin_bonus_hours,
                'total_tiffin_penalty_hours' => $total_tiffin_penalty_hours,
                'tiffin_summary' => $tiffin_summary,
                'total_sessions_counted' => count($attendance_rows)
            ],
            'mangoes' => $mango_items,
            'growing_mango' => $growing_mango,
            'leaves_taken' => array_values($leaveDates),
            'gaps' => array_reverse($gaps),
            'recent_claims' => $unified_claims,
            'in_shift_breaks' => $in_shift_mango_breaks,
            'contributions' => array_reverse($contributions),
            'tiffin_history' => $tiffin_history
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
