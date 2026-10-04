<?php
// server/api/admin/payroll/get_withdrawals.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

    $query = "
        SELECT 
            w.id,
            w.user_id,
            u.name AS staff_name,
            u.email AS staff_email,
            u.profile_picture,
            e.designation,
            d.name AS department_name,
            w.scheme_id,
            ps.scheme_type,
            ps.contract_amount,
            ps.salary_amount,
            w.amount,
            w.withdrawal_type,
            w.status,
            w.payment_method,
            w.account_details,
            w.transaction_reference,
            w.admin_notes,
            w.requested_at,
            w.processed_at,
            w.processed_by,
            admin.name AS processed_by_name
        FROM staff_withdrawals w
        JOIN users u ON w.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN staff_pay_schemes ps ON w.scheme_id = ps.id
        LEFT JOIN users admin ON w.processed_by = admin.id
        WHERE 1=1
    ";

    $params = [];
    if (!empty($status)) {
        $query .= " AND w.status = :status";
        $params[':status'] = $status;
    }
    if ($userId > 0) {
        $query .= " AND w.user_id = :user_id";
        $params[':user_id'] = $userId;
    }

    $query .= " ORDER BY w.id DESC LIMIT 200";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $withdrawals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $withdrawals
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
