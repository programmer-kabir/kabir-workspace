<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../../config/PusherHelper.php';
require_once '../BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$input = json_decode(file_get_contents("php://input"), true);
$trade_id = isset($input['trade_id']) ? (int)$input['trade_id'] : 0;
$seller_id = isset($input['seller_id']) ? (int)$input['seller_id'] : 0;
$action = isset($input['action']) ? strtolower(trim($input['action'])) : '';
$reason = isset($input['reason']) ? trim($input['reason']) : '';

if (!$trade_id || !$seller_id || !in_array($action, ['accept', 'reject'])) {
    echo json_encode(["status" => "error", "message" => "trade_id, seller_id, and action ('accept' or 'reject') are required."]);
    exit;
}

try {
    $stmt = $db->prepare("
        SELECT t.*, u_buy.name as buyer_name, u_sel.name as seller_name 
        FROM staff_overtime_trades t
        JOIN users u_buy ON t.buyer_id = u_buy.id
        JOIN users u_sel ON t.seller_id = u_sel.id
        WHERE t.id = :id AND t.seller_id = :seller_id LIMIT 1
    ");
    $stmt->execute([':id' => $trade_id, ':seller_id' => $seller_id]);
    $trade = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trade) {
        echo json_encode(["status" => "error", "message" => "Trade request not found or unauthorized."]);
        exit;
    }

    if ($trade['status'] !== 'pending_seller') {
        echo json_encode(["status" => "error", "message" => "This trade request is already " . $trade['status'] . "."]);
        exit;
    }

    $now = date('Y-m-d H:i:s');
    $newStatus = ($action === 'accept') ? 'pending_admin' : 'rejected_seller';

    $updStmt = $db->prepare("
        UPDATE staff_overtime_trades 
        SET status = :status, 
            seller_action_at = :now, 
            rejection_reason = :rejection_reason,
            updated_at = :now 
        WHERE id = :id
    ");
    $updStmt->execute([
        ':status' => $newStatus,
        ':now' => $now,
        ':rejection_reason' => ($action === 'reject' ? ($reason ?: 'Declined by seller') : null),
        ':id' => $trade_id
    ]);

    // Pusher notifications
    try {
        $pusher = new PusherHelper();
        $payload = [
            "trade_id" => $trade_id,
            "trade_code" => $trade['trade_code'],
            "buyer_id" => (int)$trade['buyer_id'],
            "buyer_name" => $trade['buyer_name'],
            "seller_id" => $seller_id,
            "seller_name" => $trade['seller_name'],
            "status" => $newStatus,
            "hours" => (float)$trade['hours_traded'],
            "total_price" => (float)$trade['total_price']
        ];
        $pusher->trigger("user-channel-{$trade['buyer_id']}", 'overtime-trade-updated', $payload);
        $pusher->trigger('staff-breaks', 'overtime-trade-updated', $payload);
        $pusher->trigger('staff-breaks', 'overtime-trade-seller-responded', $payload);
    } catch (Throwable $pe) {}

    // In-app notifications
    if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
        require_once __DIR__ . '/../../notifications/notification_helper.php';
        
        // 1. Notify Buyer
        $buyerTitle = ($action === 'accept') ? "🥭 Seller Accepted Overtime Trade!" : "❌ Overtime Trade Declined";
        $buyerBody = ($action === 'accept') 
            ? "{$trade['seller_name']} accepted your request for {$trade['hours_traded']} hrs overtime (৳{$trade['total_price']}). Awaiting Admin final approval & payroll sync."
            : "{$trade['seller_name']} declined your request for {$trade['hours_traded']} hrs overtime.";
        
        NotificationHelper::sendToUser(
            $db,
            $trade['buyer_id'],
            $seller_id,
            $buyerTitle,
            $buyerBody,
            "overtime_trade",
            "staff",
            "/mango-tree",
            "normal",
            ["trade_id" => $trade_id, "status" => $newStatus]
        );

        // 2. If accepted by seller, notify all Admins!
        if ($action === 'accept') {
            NotificationHelper::sendToRole(
                $db,
                'admin',
                $seller_id,
                "🛒 Overtime Trade Needs Approval",
                "{$trade['seller_name']} accepted {$trade['buyer_name']}'s trade for {$trade['hours_traded']} hrs overtime (৳{$trade['total_price']}). Please review and approve in Live Break Monitor.",
                "overtime_trade",
                "admin",
                "/",
                "high",
                ["trade_id" => $trade_id, "status" => "pending_admin"]
            );
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => ($action === 'accept') ? "Trade accepted! Forwarded to Admin for final approval & payroll sync." : "Trade declined.",
        "data" => ["trade_id" => $trade_id, "status" => $newStatus]
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
