<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

try {
    $stmt = $db->query("
        SELECT t.*, 
               u_sel.name as seller_name, u_sel.profile_picture as seller_picture,
               u_buy.name as buyer_name, u_buy.profile_picture as buyer_picture
        FROM staff_overtime_trades t
        JOIN users u_sel ON t.seller_id = u_sel.id
        JOIN users u_buy ON t.buyer_id = u_buy.id
        WHERE t.status = 'pending_admin'
        ORDER BY t.seller_action_at ASC, t.id ASC
    ");
    $pendingTrades = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Recent approved trades
    $stmtRecent = $db->query("
        SELECT t.*, 
               u_sel.name as seller_name, u_sel.profile_picture as seller_picture,
               u_buy.name as buyer_name, u_buy.profile_picture as buyer_picture,
               u_adm.name as approver_name
        FROM staff_overtime_trades t
        JOIN users u_sel ON t.seller_id = u_sel.id
        JOIN users u_buy ON t.buyer_id = u_buy.id
        LEFT JOIN users u_adm ON t.approved_by = u_adm.id
        WHERE t.status IN ('approved', 'rejected_admin')
        ORDER BY t.updated_at DESC LIMIT 15
    ");
    $recentTrades = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "pending_trades" => $pendingTrades,
            "recent_trades" => $recentTrades,
            "pending_count" => count($pendingTrades)
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
