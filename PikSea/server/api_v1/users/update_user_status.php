<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

// 🔒 Only admin can change user status
requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$status = isset($input['status']) ? trim($input['status']) : '';

if ($userId <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid user ID"]);
    exit;
}

$validStatuses = ['active', 'suspended', 'banned', 'deactivated'];
if (!in_array($status, $validStatuses)) {
    echo json_encode(["success" => false, "message" => "Invalid status provided"]);
    exit;
}

// Cannot change status of yourself
$currentAdminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : 0;
if ($userId === $currentAdminId) {
    echo json_encode(["success" => false, "message" => "You cannot change your own status"]);
    exit;
}

try {
    $stmt = $mysqli->prepare("UPDATE users SET status = ? WHERE id = ?");
    $stmt->bind_param("si", $status, $userId);
    $stmt->execute();
    $updatedRows = $stmt->affected_rows;
    $stmt->close();

    if ($updatedRows > 0) {
        echo json_encode(["success" => true, "message" => "User status updated to " . $status]);
    } else {
        // It could be that the user wasn't found, or the status was already set to this value.
        // Let's verify if user exists
        $check = $mysqli->query("SELECT id FROM users WHERE id = $userId");
        if ($check->num_rows > 0) {
            echo json_encode(["success" => true, "message" => "Status is already " . $status]);
        } else {
            echo json_encode(["success" => false, "message" => "User not found"]);
        }
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update user status: " . $e->getMessage()
    ]);
}
?>
