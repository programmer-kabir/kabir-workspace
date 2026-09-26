<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';
require_once __DIR__ . '/../helper/notification_helper.php';
require_once __DIR__ . '/../helper/email_helper.php';
header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;
    $reason = $data['rejection_reason'] ?? null;

    // Map frontend 'approved' to database ENUM 'verified'
    if ($status === 'approved') {
        $status = 'verified';
    }

    if (!$id || !$status) {
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit;
    }

    $stmt = $mysqli->prepare("UPDATE author_identities SET status = ?, rejection_reason = ? WHERE id = ?");
    $stmt->bind_param("ssi", $status, $reason, $id);
    
    if ($stmt->execute()) {
        // Fetch User Info for Email/Notification
        $stmtUser = $mysqli->prepare("
            SELECT u.id as user_id, u.email, u.name 
            FROM author_identities ai
            JOIN authors a ON ai.author_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE ai.id = ?
        ");
        $stmtUser->bind_param("i", $id);
        $stmtUser->execute();
        $resUser = $stmtUser->get_result();
        
        if ($row = $resUser->fetch_assoc()) {
            $userId = (int)$row['user_id'];
            $email = $row['email'];
            $fullName = $row['name'];
            $adminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : null;

            if ($status === 'verified') {
                sendNotification($mysqli, [
                    'user_id'     => $userId,
                    'sender_id'   => $adminId,
                    'sender_type' => 'admin',
                    'target_role' => 'user',
                    'type'        => 'general',
                    'title'       => 'Identity Verified ✅',
                    'message'     => 'Your identity document has been approved.',
                    'priority'    => 'normal'
                ]);
                sendEmail($mysqli, $email, $fullName, 'identity_approved', [], $userId, $adminId, 'Admin');
            } else if ($status === 'rejected') {
                sendNotification($mysqli, [
                    'user_id'     => $userId,
                    'sender_id'   => $adminId,
                    'sender_type' => 'admin',
                    'target_role' => 'user',
                    'type'        => 'alert',
                    'title'       => 'Identity Verification Failed ⚠️',
                    'message'     => 'Your submitted identity document was rejected. Reason: ' . $reason,
                    'priority'    => 'high'
                ]);
                sendEmail($mysqli, $email, $fullName, 'identity_rejected', ['reason' => $reason], $userId, $adminId, 'Admin');
            }
        }
        $stmtUser->close();

        echo json_encode(["success" => true, "message" => "Verification status updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update status."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
