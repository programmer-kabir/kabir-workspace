<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

// Ensure mango claims table exists
try {
    $db->exec("CREATE TABLE IF NOT EXISTS mango_break_claims (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        mango_index INT NOT NULL,
        hours_claimed DECIMAL(5,2) NOT NULL DEFAULT 8.00,
        claim_date DATE NOT NULL,
        leave_date DATE NOT NULL,
        reason VARCHAR(255) NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(user_id),
        INDEX(claim_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
} catch (Throwable $e) {}

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

    // 2. Fetch all completed attendance records for this user (past 90 days or all)
    $attStmt = $db->prepare("SELECT date, check_in, check_out, status 
                             FROM attendance 
                             WHERE user_id = :user_id AND check_in IS NOT NULL AND check_out IS NOT NULL 
                             ORDER BY date ASC");
    $attStmt->execute([':user_id' => $user_id]);
    $attendance_rows = $attStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Holidays to consider weekend / holiday hours
    $holidays = [];
    $holStmt = $db->query("SELECT date, title, expected_hours FROM holidays");
    if ($holStmt) {
        while ($h = $holStmt->fetch(PDO::FETCH_ASSOC)) {
            $holidays[$h['date']] = (float)$h['expected_hours'];
        }
    }

    // 4. Fetch Mango Break Claims first so claimed dates are not deducted twice as leaves
    $claimsStmt = $db->prepare("SELECT id, mango_index, hours_claimed, claim_date, leave_date, reason, status 
                                FROM mango_break_claims 
                                WHERE user_id = :user_id 
                                ORDER BY claim_date DESC");
    $claimsStmt->execute([':user_id' => $user_id]);
    $claims = $claimsStmt->fetchAll(PDO::FETCH_ASSOC);

    $total_claimed_hours = 0.0;
    $claimed_break_dates = [];
    foreach ($claims as $c) {
        if ($c['status'] !== 'Rejected') {
            $total_claimed_hours += (float)$c['hours_claimed'];
            if (!empty($c['leave_date'])) {
                $claimed_break_dates[$c['leave_date']] = true;
            }
        }
    }

    // 5. Aggregate attendance per calendar day to avoid false gaps on split check-ins
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

    // 6. Fetch Approved Leaves & Absences (excluding dates covered by claimed mango breaks)
    $leaveDates = [];
    
    // a. From leave_requests table where status = 'Approved'
    try {
        $lrStmt = $db->prepare("SELECT id, start_date, end_date, type, reason, status 
                                FROM leave_requests 
                                WHERE user_id = :user_id AND status = 'Approved' 
                                ORDER BY start_date DESC");
        $lrStmt->execute([':user_id' => $user_id]);
        $approvedLeaves = $lrStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($approvedLeaves as $al) {
            $cur = strtotime($al['start_date']);
            $end = strtotime($al['end_date']);
            while ($cur <= $end) {
                $dt = date('Y-m-d', $cur);
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
        $attLeaveStmt = $db->prepare("SELECT date, status FROM attendance WHERE user_id = :user_id AND status IN ('Leave', 'Absent')");
        $attLeaveStmt->execute([':user_id' => $user_id]);
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

    // 7. Fetch In-Shift Mango Breaks from user_breaks (e.g. 30m, 45m extra breaks during work)
    $inShiftStmt = $db->prepare("SELECT id, date, break_type, duration_minutes, start_time, end_time, reason, status 
                                FROM user_breaks 
                                WHERE user_id = :user_id 
                                AND break_type IN ('Mango Break', 'Mango Overtime') 
                                AND status != 'Rejected' 
                                ORDER BY date DESC, id DESC");
    $inShiftStmt->execute([':user_id' => $user_id]);
    $in_shift_mango_breaks = $inShiftStmt->fetchAll(PDO::FETCH_ASSOC);

    $total_in_shift_mango_minutes = 0;
    foreach ($in_shift_mango_breaks as $isb) {
        $total_in_shift_mango_minutes += (int)$isb['duration_minutes'];
    }
    $total_in_shift_mango_hours = round($total_in_shift_mango_minutes / 60, 2);

    // Combine recent claims (Full Day claims + In-Shift Mango breaks) for unified ledger
    $unified_claims = [];
    foreach ($claims as $c) {
        $unified_claims[] = [
            'id' => 'full-' . $c['id'],
            'claim_date' => $c['claim_date'],
            'leave_date' => $c['leave_date'],
            'hours_claimed' => (float)$c['hours_claimed'],
            'type' => 'Full Day Break (1 Mango 🥭)',
            'reason' => $c['reason'] ?: 'Full Day Paid Break',
            'status' => $c['status']
        ];
    }
    foreach ($in_shift_mango_breaks as $isb) {
        $unified_claims[] = [
            'id' => 'shift-' . $isb['id'],
            'claim_date' => $isb['date'],
            'leave_date' => $isb['date'],
            'hours_claimed' => round((int)$isb['duration_minutes'] / 60, 2),
            'duration_minutes' => (int)$isb['duration_minutes'],
            'type' => 'In-Shift Extra Break ⏱️',
            'reason' => $isb['reason'] ?: 'Mango Overtime Break',
            'status' => $isb['status']
        ];
    }
    usort($unified_claims, function($a, $b) {
        return strcmp($b['claim_date'], $a['claim_date']);
    });

    // Available Net Overtime Balance after deducting:
    // - Total Gap (Shift shortfalls + leaves taken)
    // - Full-day claimed mango breaks
    // - In-shift mango overtime breaks
    $total_deducted_hours = round($total_gap_hours + $total_claimed_hours + $total_in_shift_mango_hours, 2);
    $available_hours = max(0, round($total_overtime_hours - $total_deducted_hours, 2));

    // Calculate Mangoes: Each standard shift (e.g. 8 hours) = 1 ripe mango
    $ripe_mango_count = floor($available_hours / $shift_hours);
    $partial_hours = fmod($available_hours, $shift_hours);
    $progress_to_next_mango = $shift_hours > 0 ? round(($partial_hours / $shift_hours) * 100, 1) : 0;
    $remaining_hours_for_next = round($shift_hours - $partial_hours, 2);

    // Generate individual Mango items for the tree
    $mango_items = [];
    $posTemplates = [
        ['x' => 38, 'y' => 28, 'branch' => 'top-left'],
        ['x' => 58, 'y' => 26, 'branch' => 'top-right'],
        ['x' => 26, 'y' => 42, 'branch' => 'mid-left'],
        ['x' => 48, 'y' => 40, 'branch' => 'center'],
        ['x' => 70, 'y' => 44, 'branch' => 'mid-right'],
        ['x' => 34, 'y' => 58, 'branch' => 'lower-left'],
        ['x' => 62, 'y' => 56, 'branch' => 'lower-right'],
        ['x' => 48, 'y' => 68, 'branch' => 'bottom-center'],
        ['x' => 20, 'y' => 52, 'branch' => 'outer-left'],
        ['x' => 78, 'y' => 50, 'branch' => 'outer-right'],
        ['x' => 42, 'y' => 18, 'branch' => 'crown-left'],
        ['x' => 56, 'y' => 18, 'branch' => 'crown-right']
    ];

    // Ripe mangoes (Available to take as full day break)
    for ($i = 1; $i <= $ripe_mango_count; $i++) {
        $pos = $posTemplates[($i - 1) % count($posTemplates)];
        // Add subtle natural jitter
        $jitterX = (($i * 7) % 7) - 3;
        $jitterY = (($i * 11) % 7) - 3;

        $mango_items[] = [
            'id' => $i,
            'title' => "Ripe Mango #{$i}",
            'type' => 'ripe',
            'status' => 'available',
            'hours' => $shift_hours,
            'days_equivalent' => 1,
            'description' => "1 Full Day Break ({$shift_hours} Hours Paid Off)",
            'sweetness' => '100% Ripe & Sweet',
            'position' => [
                'x' => min(85, max(15, $pos['x'] + $jitterX)),
                'y' => min(75, max(18, $pos['y'] + $jitterY))
            ],
            'branch' => $pos['branch']
        ];
    }

    // Growing / Unripe mango (In progress)
    $growing_mango = null;
    if ($partial_hours > 0) {
        $pos = $posTemplates[$ripe_mango_count % count($posTemplates)];
        $growing_mango = [
            'id' => $ripe_mango_count + 1,
            'title' => "Growing Mango #" . ($ripe_mango_count + 1),
            'type' => 'growing',
            'status' => 'in_progress',
            'current_hours' => round($partial_hours, 2),
            'target_hours' => $shift_hours,
            'remaining_hours' => $remaining_hours_for_next,
            'progress_percent' => $progress_to_next_mango,
            'description' => "Ripening: {$partial_hours}h / {$shift_hours}h earned. Need {$remaining_hours_for_next}h more overtime to mature!",
            'position' => [
                'x' => min(85, max(15, $pos['x'] + 4)),
                'y' => min(75, max(20, $pos['y'] + 3))
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
                'total_expected_hours' => $total_expected_hours,
                'total_worked_hours' => $total_worked_hours,
                'total_gap_hours' => $total_gap_hours,
                'total_overtime_hours' => $total_overtime_hours,
                'total_short_hours' => $total_short_hours,
                'total_leave_days' => $total_leave_days,
                'total_leave_deducted_hours' => $total_leave_deducted_hours,
                'total_claimed_hours' => $total_claimed_hours,
                'total_in_shift_mango_hours' => $total_in_shift_mango_hours,
                'total_deducted_hours' => $total_deducted_hours,
                'available_break_hours' => $available_hours,
                'available_break_days' => round($available_hours / $shift_hours, 2),
                'ripe_mangoes_count' => (int)$ripe_mango_count,
                'partial_hours' => round($partial_hours, 2),
                'progress_to_next_mango' => $progress_to_next_mango,
                'remaining_hours_for_next' => $remaining_hours_for_next,
                'total_sessions_counted' => count($attendance_rows)
            ],
            'mangoes' => $mango_items,
            'growing_mango' => $growing_mango,
            'leaves_taken' => array_values($leaveDates),
            'gaps' => array_reverse($gaps),
            'recent_claims' => $unified_claims,
            'in_shift_breaks' => $in_shift_mango_breaks,
            'contributions' => array_reverse($contributions)
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
