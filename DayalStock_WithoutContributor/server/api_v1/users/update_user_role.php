<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';
require_once __DIR__ . '/../helper/notification_helper.php';

header("Content-Type: application/json; charset=UTF-8");

// 🔒 Only admin can change user roles
requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
$roles = isset($input['roles']) && is_array($input['roles']) ? $input['roles'] : [];

if ($userId <= 0 || empty($roles)) {
    echo json_encode(["success" => false, "message" => "Invalid user ID or roles must not be empty"]);
    exit;
}

$allowedRoles = ['admin', 'manager', 'author', 'contributor', 'user', 'pro', 'premium'];
$validRoles = [];

foreach ($roles as $r) {
    $rClean = strtolower(trim($r));
    if (in_array($rClean, $allowedRoles)) {
        $validRoles[] = $rClean;
    }
}

// Remove duplicates
$validRoles = array_unique($validRoles);

if (empty($validRoles)) {
    echo json_encode(["success" => false, "message" => "No valid roles provided"]);
    exit;
}

// Cannot change own role
$currentAdminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : 0;
if ($userId === $currentAdminId) {
    echo json_encode(["success" => false, "message" => "You cannot change your own role"]);
    exit;
}

try {
    $mysqli->begin_transaction();

    // 1. Delete existing roles
    $stmt1 = $mysqli->prepare("DELETE FROM user_roles WHERE user_id = ?");
    $stmt1->bind_param("i", $userId);
    $stmt1->execute();
    $stmt1->close();

    // 2. Insert new roles
    $stmt2 = $mysqli->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, ?)");
    foreach ($validRoles as $roleToInsert) {
        $stmt2->bind_param("is", $userId, $roleToInsert);
        if (!$stmt2->execute()) {
            throw new Exception("Failed to insert role: " . $stmt2->error);
        }
    }
    $stmt2->close();

    // 3. If any role is author/contributor, ensure they exist in authors table
    if (in_array('author', $validRoles) || in_array('contributor', $validRoles)) {
        $stmtAuthorCheck = $mysqli->prepare("SELECT id FROM authors WHERE user_id = ?");
        $stmtAuthorCheck->bind_param("i", $userId);
        $stmtAuthorCheck->execute();
        $resAuthorCheck = $stmtAuthorCheck->get_result();
        
        if ($resAuthorCheck->num_rows === 0) {
            // Does not exist, create an empty profile
            $stmtInsertAuthor = $mysqli->prepare("INSERT INTO authors (user_id) VALUES (?)");
            $stmtInsertAuthor->bind_param("i", $userId);
            if (!$stmtInsertAuthor->execute()) {
                throw new Exception("Failed to insert author: " . $stmtInsertAuthor->error);
            }
            $newAuthorId = $stmtInsertAuthor->insert_id;
            $stmtInsertAuthor->close();
            
            // Set default limits to 50
            $stmtInsertLimit = $mysqli->prepare("INSERT INTO author_upload_limits (author_id, permission_type, weekly_upload_limit, max_file_size_mb) VALUES (?, 'limited', 50, 10)");
            $stmtInsertLimit->bind_param("i", $newAuthorId);
            $stmtInsertLimit->execute();
            $stmtInsertLimit->close();
        }
        $stmtAuthorCheck->close();
    }

    $mysqli->commit();

    // Send Notification to the User
    $rolesStr = implode(', ', $validRoles);
    sendNotification($mysqli, [
        'user_id'     => $userId,
        'sender_id'   => $currentAdminId,
        'sender_type' => 'admin',
        'target_role' => 'user',
        'type'        => 'general',
        'title'       => 'Role Updated',
        'message'     => "Your account role has been updated. You are now: $rolesStr.",
        'link'        => 'https://contributor.dayalstock.com/login', // optional link
        'priority'    => 'normal'
    ]);

    echo json_encode([
        "success" => true, 
        "message" => "User roles updated successfully"
    ]);

} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to update role: " . $e->getMessage()
    ]);
}
?>
