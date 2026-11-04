<?php
// server/api/events/verify_payment.php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'EventDbHelper.php';
require_once 'EventAuthHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
EventDbHelper::ensureSchema($db);

$user = EventAuthHelper::getAuthenticatedUser($db);
if (!$user) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Authentication required."]);
    exit;
}

if (!EventAuthHelper::canManage($user)) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Permission denied. Only Developer or Admin can verify payments."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$contributionId = (int)($input['contribution_id'] ?? 0);
$action         = trim($input['action'] ?? 'verify'); // 'verify' or 'reject'

if (!$contributionId) {
    echo json_encode(["status" => "error", "message" => "Contribution ID is required."]);
    exit;
}

try {
    $chk = $db->prepare("SELECT event_id, user_id, amount FROM event_contributions WHERE id = :cid LIMIT 1");
    $chk->execute([':cid' => $contributionId]);
    $con = $chk->fetch(PDO::FETCH_ASSOC);

    if (!$con) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Contribution record not found."]);
        exit;
    }

    $newStatus = ($action === 'verify') ? 'verified' : 'rejected';

    $stmt = $db->prepare("UPDATE event_contributions 
        SET status = :st, verified_by = :vby, verified_at = NOW() 
        WHERE id = :cid");
    $stmt->execute([
        ':st'  => $newStatus,
        ':vby' => $user['id'],
        ':cid' => $contributionId
    ]);

    // Recalculate participant total_paid
    $upd = $db->prepare("UPDATE event_participants 
        SET total_paid = (SELECT COALESCE(SUM(amount), 0) FROM event_contributions WHERE event_id = :eid AND user_id = :uid AND status = 'verified')
        WHERE event_id = :eid AND user_id = :uid");
    $upd->execute([':eid' => $con['event_id'], ':uid' => $con['user_id']]);

    echo json_encode([
        "status"  => "success",
        "message" => "Contribution status updated to " . ucfirst($newStatus)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

