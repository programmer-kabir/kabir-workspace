<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id is required.']);
        exit();
    }

    $summary = PayrollHelper::getStaffWalletSummary($pdo, $userId);

    // Fetch user profile info
    $stmtUser = $pdo->prepare("
        SELECT u.id, u.name, u.email, u.phone, u.profile_picture, u.status,
               e.employee_code, e.designation, d.name AS department_name,
               s.student_code,
               (SELECT GROUP_CONCAT(ur.role SEPARATOR ', ') FROM user_roles ur WHERE ur.user_id = u.id) AS roles
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.id = :id
    ");
    $stmtUser->execute([':id' => $userId]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    // All pay schemes history
    $stmtSchemes = $pdo->prepare("
        SELECT * FROM staff_pay_schemes WHERE user_id = :user_id ORDER BY id DESC
    ");
    $stmtSchemes->execute([':user_id' => $userId]);
    $allSchemes = $stmtSchemes->fetchAll(PDO::FETCH_ASSOC);

    // Monthly breakdown
    $stmtMonthly = $pdo->prepare("
        SELECT 
            DATE_FORMAT(work_date, '%Y-%m') AS month_key,
            DATE_FORMAT(work_date, '%M %Y') AS month_label,
            COUNT(DISTINCT work_date) AS total_days,
            COUNT(id) AS total_sessions,
            COALESCE(SUM(approved_minutes), 0) AS total_minutes,
            ROUND(COALESCE(SUM(approved_minutes), 0) / 60.0, 2) AS total_hours,
            COALESCE(SUM(earned_amount), 0) AS total_earned,
            COALESCE(SUM(CASE WHEN is_surplus = 1 THEN earned_amount ELSE 0 END), 0) AS surplus_earned
        FROM staff_work_earnings
        WHERE user_id = :user_id
        GROUP BY DATE_FORMAT(work_date, '%Y-%m'), DATE_FORMAT(work_date, '%M %Y')
        ORDER BY month_key DESC
    ");
    $stmtMonthly->execute([':user_id' => $userId]);
    $monthlyBreakdown = $stmtMonthly->fetchAll(PDO::FETCH_ASSOC);

    // Daily breakdown
    $stmtDaily = $pdo->prepare("
        SELECT 
            work_date,
            COUNT(id) AS total_sessions,
            COALESCE(SUM(approved_minutes), 0) AS total_minutes,
            ROUND(COALESCE(SUM(approved_minutes), 0) / 60.0, 2) AS total_hours,
            COALESCE(SUM(earned_amount), 0) AS total_earned,
            COALESCE(SUM(CASE WHEN is_surplus = 1 THEN earned_amount ELSE 0 END), 0) AS surplus_earned,
            MIN(session_start) AS first_session_start,
            MAX(session_end) AS last_session_end
        FROM staff_work_earnings
        WHERE user_id = :user_id
        GROUP BY work_date
        ORDER BY work_date DESC
        LIMIT 90
    ");
    $stmtDaily->execute([':user_id' => $userId]);
    $dailyBreakdown = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);

    // All earnings sessions
    $stmtEarnings = $pdo->prepare("
        SELECT * FROM staff_work_earnings 
        WHERE user_id = :user_id 
        ORDER BY work_date DESC, session_start DESC, id DESC 
        LIMIT 300
    ");
    $stmtEarnings->execute([':user_id' => $userId]);
    $allEarnings = $stmtEarnings->fetchAll(PDO::FETCH_ASSOC);

    // All withdrawals
    $stmtWithdrawals = $pdo->prepare("
        SELECT w.*, admin.name AS processed_by_name 
        FROM staff_withdrawals w
        LEFT JOIN users admin ON w.processed_by = admin.id
        WHERE w.user_id = :user_id 
        ORDER BY w.id DESC
    ");
    $stmtWithdrawals->execute([':user_id' => $userId]);
    $allWithdrawals = $stmtWithdrawals->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => [
            'user' => $user,
            'summary' => $summary,
            'schemes' => $allSchemes,
            'monthly_breakdown' => $monthlyBreakdown,
            'daily_breakdown' => $dailyBreakdown,
            'earnings' => $allEarnings,
            'withdrawals' => $allWithdrawals
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
