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
$buyer_id = isset($input['buyer_id']) ? (int)$input['buyer_id'] : 0;
$seller_id = isset($input['seller_id']) ? (int)$input['seller_id'] : 0;
$hours = isset($input['hours']) ? (float)$input['hours'] : 0.0;
$buyer_note = isset($input['buyer_note']) ? trim($input['buyer_note']) : '';

if (!$buyer_id || !$seller_id || $hours <= 0) {
    echo json_encode(["status" => "error", "message" => "buyer_id, seller_id, and hours (> 0) are required."]);
    exit;
}

if ($buyer_id === $seller_id) {
    echo json_encode(["status" => "error", "message" => "You cannot trade overtime with yourself."]);
    exit;
}

if ($hours > 8.0) {
    echo json_encode(["status" => "error", "message" => "Maximum 8 hours (1 Mango) can be traded per request."]);
    exit;
}

$minutes = (int)round($hours * 60);

try {
    $db->beginTransaction();

    // 1. Check seller available overtime
    $sellerAvailMins = BreakDbHelper::getAvailableMangoMinutes($db, $seller_id);
    if ($sellerAvailMins < $minutes) {
        $db->rollBack();
        echo json_encode([
            "status" => "error",
            "message" => "Seller only has " . round($sellerAvailMins / 60, 1) . " hours available, which is less than requested {$hours} hours."
        ]);
        exit;
    }

    // 2. Fetch seller's hourly rate from active pay scheme
    $sellerScheme = PayrollHelper::getActiveScheme($db, $seller_id);
    $hourlyRate = $sellerScheme ? (float)($sellerScheme['hourly_rate'] ?? 100.0) : 100.0;
    if ($hourlyRate <= 0) $hourlyRate = 100.0;

    $totalPrice = round($hours * $hourlyRate, 2);

    // 3. Generate unique trade code
    $tradeCode = 'TRD-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 4));

    // 4. Insert into staff_overtime_trades
    $stmt = $db->prepare("
        INSERT INTO staff_overtime_trades (
            trade_code, seller_id, buyer_id, hours_traded, minutes_traded,
            hourly_rate, total_price, status, buyer_note, created_at
        ) VALUES (
            :trade_code, :seller_id, :buyer_id, :hours_traded, :minutes_traded,
            :hourly_rate, :total_price, 'pending_seller', :buyer_note, NOW()
        )
    ");
    $stmt->execute([
        ':trade_code' => $tradeCode,
        ':seller_id' => $seller_id,
        ':buyer_id' => $buyer_id,
        ':hours_traded' => $hours,
        ':minutes_traded' => $minutes,
        ':hourly_rate' => $hourlyRate,
        ':total_price' => $totalPrice,
        ':buyer_note' => $buyer_note
    ]);

    $tradeId = (int)$db->lastInsertId();
    $db->commit();

    // 5. Fetch buyer & seller names for notifications
    $bNameStmt = $db->prepare("SELECT name FROM users WHERE id = :id LIMIT 1");
    $bNameStmt->execute([':id' => $buyer_id]);
    $buyerName = $bNameStmt->fetchColumn() ?: "Colleague #{$buyer_id}";

    // Realtime Pusher notification to seller
    try {
        $pusher = new PusherHelper();
        $payload = [
            "trade_id" => $tradeId,
            "trade_code" => $tradeCode,
            "buyer_id" => $buyer_id,
            "buyer_name" => $buyerName,
            "seller_id" => $seller_id,
            "hours" => $hours,
            "total_price" => $totalPrice,
            "status" => "pending_seller"
        ];
        $pusher->trigger("user-channel-{$seller_id}", 'overtime-trade-requested', $payload);
        $pusher->trigger('staff-breaks', 'overtime-trade-updated', $payload);
    } catch (Throwable $pt) {}

    // In-app notification
    if (file_exists(__DIR__ . '/../../notifications/notification_helper.php')) {
        require_once __DIR__ . '/../../notifications/notification_helper.php';
        NotificationHelper::sendToUser(
            $db,
            $seller_id,
            $buyer_id,
            "🥭 Overtime Purchase Request",
            "{$buyerName} requested to buy {$hours} hrs overtime for ৳{$totalPrice}. Review and accept/decline.",
            "overtime_trade",
            "staff",
            "/mango-tree",
            "high",
            ["trade_id" => $tradeId, "trade_code" => $tradeCode]
        );
    }

    echo json_encode([
        "status" => "success",
        "message" => "Trade request sent to seller! Waiting for acceptance.",
        "data" => [
            "trade_id" => $tradeId,
            "trade_code" => $tradeCode,
            "hours" => $hours,
            "total_price" => $totalPrice
        ]
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
