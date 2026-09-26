<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

// 🔒 Only admin can delete a user
requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;

if ($userId <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid user ID"]);
    exit;
}

// Cannot delete yourself
$currentAdminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : 0;
if ($userId === $currentAdminId) {
    echo json_encode(["success" => false, "message" => "You cannot delete your own account"]);
    exit;
}

try {
    $mysqli->begin_transaction();

    // Instead of hard deleting, we perform a soft delete by setting status to 'deactivated'
    $stmt3 = $mysqli->prepare("UPDATE users SET status = 'deactivated' WHERE id = ?");
    $stmt3->bind_param("i", $userId);
    $stmt3->execute();
    $deletedRows = $stmt3->affected_rows;
    $stmt3->close();

    $mysqli->commit();

    if ($deletedRows > 0) {
        echo json_encode(["success" => true, "message" => "User deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "User not found"]);
    }

} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete user: " . $e->getMessage()
    ]);
}
?>
