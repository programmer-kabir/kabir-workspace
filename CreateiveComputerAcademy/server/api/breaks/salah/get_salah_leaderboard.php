<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$today = date('Y-m-d');
$weekStart = date('Y-m-d', strtotime('monday this week'));
$weekEnd = date('Y-m-d', strtotime('sunday this week'));
$monthStart = date('Y-m-01');
$monthEnd = date('Y-m-t');

try {
    // ── 1. Today's Collective Team Goal Score ──
    $attStmt = $db->prepare("SELECT COUNT(DISTINCT a.user_id) FROM attendance a 
                             JOIN users u ON a.user_id = u.id 
                             WHERE a.date = :today AND a.check_in IS NOT NULL");
    $attStmt->execute([':today' => $today]);
    $checkedInCount = (int)$attStmt->fetchColumn();

    // Fallback: If attendance check-ins are 0 (e.g. holiday or early morning), use total active staff
    if ($checkedInCount === 0) {
        $staffCountStmt = $db->query("SELECT COUNT(*) FROM employees WHERE employment_status = 'Active'");
        $activeEmpCount = (int)$staffCountStmt->fetchColumn();
        if ($activeEmpCount === 0) {
            $uStmt = $db->query("SELECT COUNT(*) FROM users WHERE status = 'active'");
            $activeEmpCount = (int)$uStmt->fetchColumn();
        }
        $checkedInCount = max(1, $activeEmpCount);
    }

    $targetWaqtsToday = $checkedInCount * 5;

    $prayedTodayStmt = $db->prepare("SELECT COUNT(*) FROM staff_salah_logs WHERE date = :today");
    $prayedTodayStmt->execute([':today' => $today]);
    $prayedCountToday = (int)$prayedTodayStmt->fetchColumn();

    $teamPercentage = min(100, round(($prayedCountToday / max(1, $targetWaqtsToday)) * 100));

    // ── 2. Today's Star Club (Staff who completed 5/5 today) ──
    $starStmt = $db->prepare("SELECT l.user_id, u.name, u.profile_picture, COUNT(l.id) as prayed_count, MAX(l.logged_at) as last_logged
                             FROM staff_salah_logs l
                             JOIN users u ON l.user_id = u.id
                             WHERE l.date = :today
                             GROUP BY l.user_id
                             HAVING prayed_count >= 5
                             ORDER BY last_logged ASC");
    $starStmt->execute([':today' => $today]);
    $starClub = $starStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── 3. Weekly Consistency Leaderboard ──
    $weekStmt = $db->prepare("SELECT l.user_id, u.name, u.profile_picture, 
                                     COUNT(l.id) as total_prayed, 
                                     COUNT(DISTINCT l.date) as active_days,
                                     COALESCE(SUM(l.reward_minutes + l.bonus_minutes), 0) as total_earned_mins
                              FROM staff_salah_logs l
                              JOIN users u ON l.user_id = u.id
                              WHERE l.date BETWEEN :w_start AND :w_end
                              GROUP BY l.user_id
                              ORDER BY total_prayed DESC, active_days DESC
                              LIMIT 15");
    $weekStmt->execute([':w_start' => $weekStart, ':w_end' => $weekEnd]);
    $weeklyLeaders = $weekStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── 4. Monthly Consistency Leaderboard ──
    $monthStmt = $db->prepare("SELECT l.user_id, u.name, u.profile_picture, 
                                      COUNT(l.id) as total_prayed, 
                                      COUNT(DISTINCT l.date) as active_days,
                                      COALESCE(SUM(l.reward_minutes + l.bonus_minutes), 0) as total_earned_mins
                               FROM staff_salah_logs l
                               JOIN users u ON l.user_id = u.id
                               WHERE l.date BETWEEN :m_start AND :m_end
                               GROUP BY l.user_id
                               ORDER BY total_prayed DESC, active_days DESC
                               LIMIT 15");
    $monthStmt->execute([':m_start' => $monthStart, ':m_end' => $monthEnd]);
    $monthlyLeaders = $monthStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "today_team_goal" => [
                "date" => $today,
                "active_staff_count" => $checkedInCount,
                "target_waqts" => $targetWaqtsToday,
                "prayed_waqts" => $prayedCountToday,
                "percentage" => $teamPercentage
            ],
            "star_club_today" => $starClub,
            "weekly_leaders" => $weeklyLeaders,
            "monthly_leaders" => $monthlyLeaders,
            "week_range" => [
                "start" => $weekStart,
                "end" => $weekEnd
            ],
            "month_name" => date('F Y'),
            "server_time" => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
