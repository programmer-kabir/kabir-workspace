<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../BreakDbHelper.php';

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
    // 1. Incoming requests waiting for my action as Seller
    $stmtInc = $db->prepare("
        SELECT t.*, u_buy.name as buyer_name, u_buy.profile_picture as buyer_picture,
               COALESCE(e.designation, 'Staff') as buyer_designation
        FROM staff_overtime_trades t
        JOIN users u_buy ON t.buyer_id = u_buy.id
        LEFT JOIN employees e ON u_buy.id = e.user_id
        WHERE t.seller_id = :user_id AND t.status = 'pending_seller'
        ORDER BY t.id DESC
    ");
    $stmtInc->execute([':user_id' => $user_id]);
    $incoming = $stmtInc->fetchAll(PDO::FETCH_ASSOC);

    // 2. My Purchases (where I am buyer)
    $stmtBuy = $db->prepare("
        SELECT t.*, u_sel.name as seller_name, u_sel.profile_picture as seller_picture,
               COALESCE(e.designation, 'Staff') as seller_designation
        FROM staff_overtime_trades t
        JOIN users u_sel ON t.seller_id = u_sel.id
        LEFT JOIN employees e ON u_sel.id = e.user_id
        WHERE t.buyer_id = :user_id
        ORDER BY t.id DESC
    ");
    $stmtBuy->execute([':user_id' => $user_id]);
    $purchases = $stmtBuy->fetchAll(PDO::FETCH_ASSOC);

    // 3. My Sales (where I am seller)
    $stmtSale = $db->prepare("
        SELECT t.*, u_buy.name as buyer_name, u_buy.profile_picture as buyer_picture,
               COALESCE(e.designation, 'Staff') as buyer_designation
        FROM staff_overtime_trades t
        JOIN users u_buy ON t.buyer_id = u_buy.id
        LEFT JOIN employees e ON u_buy.id = e.user_id
        WHERE t.seller_id = :user_id
        ORDER BY t.id DESC
    ");
    $stmtSale->execute([':user_id' => $user_id]);
    $sales = $stmtSale->fetchAll(PDO::FETCH_ASSOC);

    // 4. Trade breakdown
    $breakdown = BreakDbHelper::getTradeBreakdown($db, $user_id);
    $currentAvailMins = BreakDbHelper::getAvailableMangoMinutes($db, $user_id);

    echo json_encode([
        "status" => "success",
        "data" => [
            "incoming_requests" => $incoming,
            "purchases" => $purchases,
            "sales" => $sales,
            "summary" => $breakdown,
            "current_available_minutes" => $currentAvailMins,
            "current_available_hours" => round($currentAvailMins / 60, 2)
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
