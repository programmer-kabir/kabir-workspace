<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';
require_once __DIR__ . '/../helper/notification_helper.php';
require_once __DIR__ . '/../helper/email_helper.php';

header("Content-Type: application/json; charset=UTF-8");

// 🔒 Only admin can update applications
requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$appId = isset($input['application_id']) ? (int)$input['application_id'] : 0;
$status = isset($input['status']) ? strtolower(trim($input['status'])) : '';

if ($appId <= 0 || !in_array($status, ['approved', 'rejected'])) {
    echo json_encode(["success" => false, "message" => "Invalid application ID or status"]);
    exit;
}

try {
    $mysqli->begin_transaction();

    // 1. Fetch application details
    $stmtApp = $mysqli->prepare("SELECT email, full_name FROM contributor_applications WHERE id = ?");
    $stmtApp->bind_param("i", $appId);
    $stmtApp->execute();
    $resApp = $stmtApp->get_result();
    
    if ($resApp->num_rows === 0) {
        throw new Exception("Application not found.");
    }
    $appData = $resApp->fetch_assoc();
    $stmtApp->close();

    $email = $appData['email'];
    $fullName = $appData['full_name'];

    // 2. Fetch User ID by Email
    $userId = 0;
    $stmtUser = $mysqli->prepare("SELECT id FROM users WHERE email = ?");
    $stmtUser->bind_param("s", $email);
    $stmtUser->execute();
    $resUser = $stmtUser->get_result();
    if ($row = $resUser->fetch_assoc()) {
        $userId = (int)$row['id'];
    }
    $stmtUser->close();

    if ($userId === 0) {
        throw new Exception("User account associated with this email not found.");
    }

    // 3. Update Application Status
    $stmtUpdate = $mysqli->prepare("UPDATE contributor_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmtUpdate->bind_param("si", $status, $appId);
    if (!$stmtUpdate->execute()) {
        throw new Exception("Failed to update application status.");
    }
    $stmtUpdate->close();

    if ($status === 'approved') {
        // 4. Add 'author' role to user_roles if they don't have it
        $stmtCheckRole = $mysqli->prepare("SELECT id FROM user_roles WHERE user_id = ? AND role = 'author'");
        $stmtCheckRole->bind_param("i", $userId);
        $stmtCheckRole->execute();
        $resRole = $stmtCheckRole->get_result();
        $hasAuthorRole = ($resRole->num_rows > 0);
        $stmtCheckRole->close();

        if (!$hasAuthorRole) {
            $stmtInsertRole = $mysqli->prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'author')");
            $stmtInsertRole->bind_param("i", $userId);
            if (!$stmtInsertRole->execute()) {
                throw new Exception("Failed to assign author role.");
            }
            $stmtInsertRole->close();
        }

        // 5. Create author profile in authors table if doesn't exist
        $stmtCheckAuthor = $mysqli->prepare("SELECT id FROM authors WHERE user_id = ?");
        $stmtCheckAuthor->bind_param("i", $userId);
        $stmtCheckAuthor->execute();
        $resAuthor = $stmtCheckAuthor->get_result();
        $hasAuthorProfile = ($resAuthor->num_rows > 0);
        $stmtCheckAuthor->close();

        if (!$hasAuthorProfile) {
            $stmtInsertAuthor = $mysqli->prepare("INSERT INTO authors (user_id) VALUES (?)");
            $stmtInsertAuthor->bind_param("i", $userId);
            if (!$stmtInsertAuthor->execute()) {
                throw new Exception("Failed to create author profile.");
            }
            $newAuthorId = $stmtInsertAuthor->insert_id;
            $stmtInsertAuthor->close();
            
            // Set default limits to 50
            $stmtInsertLimit = $mysqli->prepare("INSERT INTO author_upload_limits (author_id, permission_type, weekly_upload_limit, max_file_size_mb) VALUES (?, 'limited', 10, 10)");
            $stmtInsertLimit->bind_param("i", $newAuthorId);
            $stmtInsertLimit->execute();
            $stmtInsertLimit->close();
        }

        // 6. Send Approval Notification & Email
        $adminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : null;
        sendNotification($mysqli, [
            'user_id'     => $userId,
            'sender_id'   => $adminId,
            'sender_type' => 'admin',
            'target_role' => 'user',
            'type'        => 'general',
            'title'       => 'Application Approved! 🎉',
            'message'     => "Congratulations $fullName! Your contributor application has been approved. You have been granted the Author role and can now start uploading content.",
            'link'        => 'https://contributor.dayalstock.com/login',
            'priority'    => 'high'
        ]);

        sendEmail($mysqli, $email, $fullName, 'contributor_application_approved', [], $userId, $adminId, 'Admin');
    } else {
        // Send Rejection Notification & Email
        $adminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : null;
        sendNotification($mysqli, [
            'user_id'     => $userId,
            'sender_id'   => $adminId,
            'sender_type' => 'admin',
            'target_role' => 'user',
            'type'        => 'alert',
            'title'       => 'Application Rejected',
            'message'     => "Hello $fullName, we have reviewed your contributor application. Unfortunately, we cannot approve it at this time. Thank you for your interest in Dayal Stock.",
            'priority'    => 'high'
        ]);

        sendEmail($mysqli, $email, $fullName, 'contributor_application_rejected', [], $userId, $adminId, 'Admin');
    }

    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "Application has been " . $status . " successfully."
    ]);

} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
