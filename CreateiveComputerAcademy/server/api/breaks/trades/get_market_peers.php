<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../BreakDbHelper.php';
require_once '../../payroll/PayrollHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : (isset($_POST['user_id']) ? (int)$_POST['user_id'] : null);

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

try {
    // 1. Fetch current user (buyer) details
    $buyerMins = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);
    $buyerScheme = PayrollHelper::getActiveScheme($db, $user_id);
    $buyerRate = $buyerScheme ? (float)($buyerScheme['hourly_rate'] ?? 100.0) : 100.0;

    // 2. Fetch all other active staff members
    $stmtUsers = $db->prepare("
        SELECT u.id, u.name, u.email, u.profile_picture, 
               COALESCE(e.designation, 'Staff Member') as designation,
               COALESCE(e.shift_hours, 8) as shift_hours
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id AND ur.role IN ('staff', 'employee')
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.status = 'active' AND u.id != :buyer_id
        GROUP BY u.id
        ORDER BY u.name ASC
    ");
    $stmtUsers->execute([':buyer_id' => $user_id]);
    $candidates = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

    $peers = [];

    foreach ($candidates as $cand) {
        $cId = (int)$cand['id'];
        $availMins = BreakDbHelper::getAvailableMangoMinutes($db, $cId);

        // Only include peers who have at least 60 minutes (1 hour) of tradeable overtime
        if ($availMins >= 60) {
            $scheme = PayrollHelper::getActiveScheme($db, $cId);
            $hourlyRate = $scheme ? (float)($scheme['hourly_rate'] ?? 100.0) : 100.0;
            if ($hourlyRate <= 0) $hourlyRate = 100.0; // Standard fallback rate

            $availHours = round($availMins / 60, 2);

            $peers[] = [
                'id' => $cId,
                'name' => $cand['name'],
                'email' => $cand['email'],
                'profile_picture' => $cand['profile_picture'],
                'designation' => $cand['designation'],
                'available_minutes' => $availMins,
                'available_hours' => $availHours,
                'hourly_rate' => round($hourlyRate, 2),
                'max_tradeable_hours' => min(8.0, $availHours) // Cap at 8 hrs (1 Mango) per trade
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "peers" => $peers,
            "buyer_info" => [
                "user_id" => $user_id,
                "available_mango_minutes" => $buyerMins,
                "hourly_rate" => round($buyerRate, 2)
            ]
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
