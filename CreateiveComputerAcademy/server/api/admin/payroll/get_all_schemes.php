<?php
// server/api/admin/payroll/get_all_schemes.php
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
    // Fetch all users who currently have a pay scheme assigned
    $sql = "
        SELECT 
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_picture,
            GROUP_CONCAT(DISTINCT ur.role SEPARATOR ', ') AS roles,
            e.designation,
            d.name AS department_name,
            s.student_code,
            ps.id AS scheme_id,
            ps.scheme_type,
            ps.salary_amount,
            ps.contract_amount,
            ps.contract_duration_months,
            ps.working_days_per_month,
            ps.standard_daily_hours,
            ps.total_contract_hours,
            ps.hourly_rate,
            ps.contract_start_date,
            ps.contract_end_date,
            ps.status AS scheme_status,
            ps.created_at AS scheme_created_at
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN students s ON u.id = s.user_id
        INNER JOIN staff_pay_schemes ps ON ps.id = (
            SELECT id FROM staff_pay_schemes WHERE user_id = u.id ORDER BY id DESC LIMIT 1
        )
        WHERE u.status = 'active'
        GROUP BY u.id
        ORDER BY ps.id DESC
    ";

    $stmt = $pdo->query($sql);
    $userList = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Compute live progress & wallet summary for each user in scheme
    $enrichedList = [];
    foreach ($userList as $user) {
        $summary = PayrollHelper::getStaffWalletSummary($pdo, $user['user_id']);
        $user['wallet_summary'] = $summary;
        $enrichedList[] = $user;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $enrichedList
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
