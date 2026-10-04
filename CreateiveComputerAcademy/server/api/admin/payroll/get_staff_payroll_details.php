<?php
// server/api/admin/payroll/get_staff_payroll_details.php
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
        SELECT u.id, u.name, u.email, u.profile_picture, e.designation, d.name AS department_name
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
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

    // All earnings
    $stmtEarnings = $pdo->prepare("
        SELECT * FROM staff_work_earnings WHERE user_id = :user_id ORDER BY id DESC LIMIT 100
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
            'earnings' => $allEarnings,
            'withdrawals' => $allWithdrawals
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
