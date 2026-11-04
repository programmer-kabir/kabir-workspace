<?php
// server/api/events/log_expense.php
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

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$eventId     = (int)($input['event_id'] ?? 0);
$itemName    = trim($input['item_name'] ?? '');
$category    = trim($input['category'] ?? 'food');
$amount      = (float)($input['amount'] ?? 0);
$paidBy      = !empty($input['paid_by']) ? (int)$input['paid_by'] : $user['id'];
$receiptUrl  = trim($input['receipt_url'] ?? '');
$isSelfVouch = isset($input['is_self_vouched']) ? (int)$input['is_self_vouched'] : 0;
$notes       = trim($input['notes'] ?? '');

if (!$eventId || empty($itemName) || $amount <= 0) {
    echo json_encode(["status" => "error", "message" => "Event ID, item name, and valid amount are required."]);
    exit;
}

try {
    $canManage = EventAuthHelper::canManage($user);
    $status    = $canManage ? 'approved' : 'submitted';
    $appBy     = $canManage ? $user['id'] : null;

    $stmt = $db->prepare("INSERT INTO event_expenses (
        event_id, paid_by, item_name, category, amount, 
        receipt_url, is_self_vouched, status, approved_by, notes
    ) VALUES (
        :eid, :paid_by, :item, :cat, :amount,
        :receipt, :vouched, :status, :app_by, :notes
    )");

    $stmt->execute([
        ':eid'     => $eventId,
        ':paid_by' => $paidBy,
        ':item'    => $itemName,
        ':cat'     => $category,
        ':amount'  => $amount,
        ':receipt' => $receiptUrl,
        ':vouched' => $isSelfVouch,
        ':status'  => $status,
        ':app_by'  => $appBy,
        ':notes'   => $notes
    ]);

    echo json_encode([
        "status"  => "success",
        "message" => "Expense logged successfully!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

