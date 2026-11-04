<?php
// server/api/events/delete_expense.php
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
    echo json_encode(["status" => "error", "message" => "Permission denied."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$expenseId = (int)($input['expense_id'] ?? 0);
if (!$expenseId) {
    echo json_encode(["status" => "error", "message" => "Expense ID is required."]);
    exit;
}

try {
    $stmt = $db->prepare("DELETE FROM event_expenses WHERE id = :id");
    $stmt->execute([':id' => $expenseId]);

    echo json_encode([
        "status"  => "success",
        "message" => "Expense record deleted successfully."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

