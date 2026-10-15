<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../../config/PusherHelper.php';
require_once '../BreakDbHelper.php';
require_once '../../payroll/PayrollHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$input = json_decode(file_get_contents("php://input"), true);
$trade_id = isset($input['trade_id']) ? (int)$input['trade_id'] : 0;
$admin_id = isset($input['admin_id']) ? (int)$input['admin_id'] : 0;
$action = isset($input['action']) ? strtolower(trim($input['action'])) : '';
$reason = isset($input['reason']) ? trim($input['reason']) : '';

if (!$trade_id || !in_array($action, ['approve', 'reject'])) {
    echo json_encode(["status" => "error", "message" => "trade_id and action ('approve' or 'reject') are required."]);
    exit;
}

try {
    $db->beginTransaction();

    $stmt = $db->prepare("
        SELECT t.*, u_buy.name as buyer_name, u_sel.name as seller_name 
        FROM staff_overtime_trades t
        JOIN users u_buy ON t.buyer_id = u_buy.id
        JOIN users u_sel ON t.seller_id = u_sel.id
        WHERE t.id = :id FOR UPDATE
    ");
    $stmt->execute([':id' => $trade_id]);
    $trade = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trade) {
        $db->rollBack();
        echo json_encode(["status" => "error", "message" => "Trade record not found."]);
        exit;
    }

    if ($trade['status'] !== 'pending_admin') {
        $db->rollBack();
        echo json_encode(["status" => "error", "message" => "This trade is already " . $trade['status'] . "."]);
        exit;
    }

    $now = date('Y-m-d H:i:s');
    $today = date('Y-m-d');
    $hours = (float)$trade['hours_traded'];
    $minutes = (int)$trade['minutes_traded'];
    $totalPrice = (float)$trade['total_price'];
    $hourlyRate = (float)$trade['hourly_rate'];
    $sellerId = (int)$trade['seller_id'];
    $buyerId = (int)$trade['buyer_id'];
    $tradeCode = $trade['trade_code'];
    $buyerName = $trade['buyer_name'];
    $sellerName = $trade['seller_name'];

    if ($action === 'approve') {
        // 1. Update trade status
        $upd = $db->prepare("
            UPDATE staff_overtime_trades 
            SET status = 'approved', 
                approved_by = :admin_id, 
                approved_at = :now, 
                updated_at = :now 
            WHERE id = :id
        ");
        $upd->execute([':admin_id' => $admin_id, ':now' => $now, ':id' => $trade_id]);

        // 2. Fetch active pay schemes for payroll sync
        $sellerScheme = PayrollHelper::getActiveScheme($db, $sellerId);
        $buyerScheme = PayrollHelper::getActiveScheme($db, $buyerId);

        $sellerSchemeId = $sellerScheme ? (int)$sellerScheme['id'] : null;
        $buyerSchemeId = $buyerScheme ? (int)$buyerScheme['id'] : null;

        // 3. Insert Seller Earnings (+ Bonus for selling overtime)
        $sellerEarnStmt = $db->prepare("
            INSERT INTO staff_work_earnings (
                user_id, scheme_id, work_date, approved_minutes, applied_rate, 
                earned_amount, is_surplus, source_type, reference_id, notes, created_at
            ) VALUES (
                :user_id, :scheme_id, :work_date, :approved_minutes, :applied_rate, 
                :earned_amount, 0, 'overtime_trade_sale', :reference_id, :notes, :created_at
            )
        ");
        $sellerEarnStmt->execute([
            ':user_id' => $sellerId,
            ':scheme_id' => $sellerSchemeId,
            ':work_date' => $today,
            ':approved_minutes' => $minutes,
            ':applied_rate' => $hourlyRate,
            ':earned_amount' => $totalPrice,
            ':reference_id' => $trade_id,
            ':notes' => "Sold {$hours} hrs overtime to {$buyerName} ({$tradeCode})",
            ':created_at' => $now
        ]);

        // 4. Insert Buyer Deduction (- Cost for buying break hours)
        $buyerEarnStmt = $db->prepare("
            INSERT INTO staff_work_earnings (
                user_id, scheme_id, work_date, approved_minutes, applied_rate, 
                earned_amount, is_surplus, source_type, reference_id, notes, created_at
            ) VALUES (
                :user_id, :scheme_id, :work_date, :approved_minutes, :applied_rate, 
                :earned_amount, 0, 'overtime_trade_purchase', :reference_id, :notes, :created_at
            )
        ");
        $buyerEarnStmt->execute([
            ':user_id' => $buyerId,
            ':scheme_id' => $buyerSchemeId,
            ':work_date' => $today,
            ':approved_minutes' => $minutes,
            ':applied_rate' => $hourlyRate,
            ':earned_amount' => -$totalPrice,
            ':reference_id' => $trade_id,
            ':notes' => "Purchased {$hours} hrs break overtime from {$sellerName} ({$tradeCode})",
            ':created_at' => $now
        ]);

        $db->commit();

        // Pusher Realtime Sync
        try {
            $pusher = new PusherHelper();
            $payload = [
                "trade_id" => $trade_id,
                "trade_code" => $tradeCode,
                "buyer_id" => $buyerId,
                "seller_id" => $sellerId,
                "status" => "approved",
                "hours" => $hours,
                "total_price" => $totalPrice
            ];
            $pusher->trigger("user-channel-{$buyerId}", 'overtime-trade-approved', $payload);
            $pusher->trigger("user-channel-{$sellerId}", 'overtime-trade-approved', $payload);
            $pusher->trigger('staff-breaks', 'overtime-trade-approved', $payload);
        } catch (Throwable $pe) {}

        // In-app notifications
        if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
            require_once __DIR__ . '/../../notifications/notification_helper.php';
            NotificationHelper::sendToUser(
                $db, $buyerId, $admin_id, "✅ Overtime Trade Approved!",
                "Admin approved your purchase of {$hours} hrs overtime from {$sellerName}. Your break balance is updated (+{$hours}h) and ৳{$totalPrice} adjusted in salary.",
                "overtime_trade", "staff", "/breaks", "high"
            );
            NotificationHelper::sendToUser(
                $db, $sellerId, $admin_id, "💵 Overtime Sale Approved!",
                "Admin approved your sale of {$hours} hrs overtime to {$buyerName}. +৳{$totalPrice} has been credited to your salary wallet.",
                "overtime_trade", "staff", "/payroll", "high"
            );
        }

        echo json_encode([
            "status" => "success",
            "message" => "Trade approved successfully! +৳{$totalPrice} credited to {$sellerName} and -৳{$totalPrice} deducted from {$buyerName}. Break hours updated.",
            "data" => ["trade_id" => $trade_id, "status" => "approved"]
        ]);

    } else {
        // Reject
        $upd = $db->prepare("
            UPDATE staff_overtime_trades 
            SET status = 'rejected_admin', 
                approved_by = :admin_id, 
                rejection_reason = :reason, 
                updated_at = :now 
            WHERE id = :id
        ");
        $upd->execute([':admin_id' => $admin_id, ':reason' => ($reason ?: 'Rejected by Admin'), ':now' => $now, ':id' => $trade_id]);

        $db->commit();

        try {
            $pusher = new PusherHelper();
            $payload = ["trade_id" => $trade_id, "status" => "rejected_admin"];
            $pusher->trigger("user-channel-{$buyerId}", 'overtime-trade-updated', $payload);
            $pusher->trigger("user-channel-{$sellerId}", 'overtime-trade-updated', $payload);
            $pusher->trigger('staff-breaks', 'overtime-trade-updated', $payload);
        } catch (Throwable $pe) {}

        echo json_encode([
            "status" => "success",
            "message" => "Trade request rejected by Admin. Locked hours returned to seller.",
            "data" => ["trade_id" => $trade_id, "status" => "rejected_admin"]
        ]);
    }

} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
