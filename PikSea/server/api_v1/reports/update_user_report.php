<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

// Protect endpoint: Only admin role can access
requireRole('admin');

/**
 * Helper function to send HTML emails to users
 */
function sendReportEmail($toEmail, $toName, $subject, $messageTitle, $messageBody, $targetUserId = null, $emailType = 'general') {
    global $mysqli;
    if (empty($toEmail)) return false;

    $mailConfig = @include __DIR__ . '/../config/smtp_config.php';
    $fromEmail = $mailConfig['from_email'] ?? "support@dayalstock.com";
    $fromName = $mailConfig['from_name'] ?? "DayalStock Support";

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: $fromName <$fromEmail>" . "\r\n";
    $headers .= "Reply-To: $fromEmail" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $htmlContent = '
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .logo { font-size: 24px; font-weight: 800; color: #6C4FE0; margin-bottom: 24px; text-align: center; }
        .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; }
        .content { font-size: 15px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
        .footer { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">DayalStock</div>
        <div class="title">' . htmlspecialchars($messageTitle) . '</div>
        <div class="content">
          <p>Dear <strong>' . htmlspecialchars($toName) . '</strong>,</p>
          <p>' . nl2br(htmlspecialchars($messageBody)) . '</p>
        </div>
        <div class="footer">
          &copy; ' . date("Y") . ' DayalStock. All rights reserved.<br>
          If you have any questions, please contact support at ' . htmlspecialchars($fromEmail) . '
        </div>
      </div>
    </body>
    </html>
    ';

    $mailSent = @mail($toEmail, $subject, $htmlContent, $headers);
    $status = $mailSent ? 'sent' : 'failed';

    // Admin identity
    $adminUser = $GLOBALS['user'] ?? [];
    $adminId = (int)($adminUser['id'] ?? 0);
    $adminName = $adminUser['name'] ?? ($adminUser['email'] ?? 'Admin');

    // Auto log email record into DB
    if ($mysqli) {
        $stmtLog = $mysqli->prepare("
            INSERT INTO email_logs (recipient_user_id, recipient_name, recipient_email, email_type, subject, message_title, message_body, status, sent_by_id, sent_by_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        if ($stmtLog) {
            $stmtLog->bind_param("isssssssis", $targetUserId, $toName, $toEmail, $emailType, $subject, $messageTitle, $messageBody, $status, $adminId, $adminName);
            $stmtLog->execute();
            $stmtLog->close();
        }
    }

    return $mailSent;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
        throw new Exception("Invalid request method");
    }

    $data = json_decode(file_get_contents("php://input"), true);

    $ids = [];
    if (!empty($data['ids']) && is_array($data['ids'])) {
        $ids = array_map('intval', $data['ids']);
    } elseif (!empty($data['id'])) {
        $ids = [(int)$data['id']];
    }

    if (empty($ids)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "At least one report ID is required"]);
        exit;
    }

    $status = isset($data['status']) ? trim($data['status']) : 'resolved';
    $actionTaken = isset($data['action_taken']) ? trim($data['action_taken']) : 'status_update';
    $adminNote = isset($data['admin_note']) ? trim($data['admin_note']) : '';

    // Admin identity from auth token
    $adminUser = $GLOBALS['user'] ?? [];
    $adminId = (int)($adminUser['id'] ?? 0);
    $adminName = $adminUser['name'] ?? ($adminUser['email'] ?? 'Admin');

    $idList = implode(",", $ids);

    // Execute Warn User Action (Send In-App Notification & Email)
    if ($actionTaken === 'warn_user') {
        $usersRes = $mysqli->query("
            SELECT ur.target_user_id, ur.reason, ur.description, u.name, u.email
            FROM user_reports ur
            LEFT JOIN users u ON u.id = ur.target_user_id
            WHERE ur.id IN ($idList)
        ");

        if ($usersRes) {
            while ($uRow = $usersRes->fetch_assoc()) {
                $targetUserId = (int)$uRow['target_user_id'];
                if ($targetUserId > 0) {
                    $userName = !empty($uRow['name']) ? $uRow['name'] : 'User';
                    $userEmail = !empty($uRow['email']) ? $uRow['email'] : '';
                    $reasonText = !empty($uRow['reason']) ? $uRow['reason'] : 'Terms Violation';
                    $noteText = !empty($adminNote) ? $adminNote : (!empty($uRow['description']) ? $uRow['description'] : 'Please review our platform guidelines to ensure compliance.');
                    
                    $warnMsg = "Your account has received an official policy warning regarding: '$reasonText'. Details: $noteText. Please ensure future compliance to avoid further account restrictions.";

                    // 1. Insert In-App Notification
                    $notifStmt = $mysqli->prepare("
                        INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, priority, is_read, is_deleted, created_at)
                        VALUES (?, ?, 'admin', 'user', 'warning', 'Official Policy Warning', ?, 'high', 0, 0, NOW())
                    ");
                    $notifStmt->bind_param("iis", $targetUserId, $adminId, $warnMsg);
                    $notifStmt->execute();
                    $notifStmt->close();

                    // 2. Send Real Email Notification & Log
                    if (!empty($userEmail)) {
                        sendReportEmail($userEmail, $userName, "Official Policy Warning - DayalStock", "Official Policy Warning", $warnMsg, $targetUserId, "warning");
                    }
                }
            }
        }
        $status = 'resolved';

    // Execute Suspend User Action (Set role to suspended, set users.status = 'suspended' & send notification)
    } elseif ($actionTaken === 'suspend_user') {
        // Ensure status column exists in users table
        $checkCol = $mysqli->query("SHOW COLUMNS FROM users LIKE 'status'");
        if ($checkCol && $checkCol->num_rows == 0) {
            $mysqli->query("ALTER TABLE users ADD COLUMN status ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active'");
        }

        $usersRes = $mysqli->query("
            SELECT ur.target_user_id, ur.reason, ur.description, u.name, u.email
            FROM user_reports ur
            LEFT JOIN users u ON u.id = ur.target_user_id
            WHERE ur.id IN ($idList)
        ");

        if ($usersRes) {
            while ($uRow = $usersRes->fetch_assoc()) {
                $targetUserId = (int)$uRow['target_user_id'];
                if ($targetUserId > 0) {
                    $userName = !empty($uRow['name']) ? $uRow['name'] : 'User';
                    $userEmail = !empty($uRow['email']) ? $uRow['email'] : '';
                    $reasonText = !empty($uRow['reason']) ? $uRow['reason'] : 'Terms Violation';
                    $noteText = !empty($adminNote) ? $adminNote : (!empty($uRow['description']) ? $uRow['description'] : 'Serious terms of service violation.');
                    
                    // 1. Update user account status in users table
                    $mysqli->query("UPDATE users SET status = 'suspended' WHERE id = $targetUserId");

                    // 2. Add suspended role to user
                    $mysqli->query("INSERT IGNORE INTO user_roles (user_id, role) VALUES ($targetUserId, 'suspended')");
                    
                    $suspendMsg = "Dear $userName, your account has been suspended due to violations of DayalStock Terms of Service. Primary Reason: '$reasonText'. Action Details: $noteText. Contact Support if you believe this is an error.";

                    // 3. Insert In-App Notification
                    $notifStmt = $mysqli->prepare("
                        INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, priority, is_read, is_deleted, created_at)
                        VALUES (?, ?, 'admin', 'user', 'account_suspended', 'Account Suspension Notice', ?, 'high', 0, 0, NOW())
                    ");
                    $notifStmt->bind_param("iis", $targetUserId, $adminId, $suspendMsg);
                    $notifStmt->execute();
                    $notifStmt->close();

                    // 4. Send Real Email Notification & Log
                    if (!empty($userEmail)) {
                        sendReportEmail($userEmail, $userName, "Account Suspension Notice - DayalStock", "Account Suspension Notice", $suspendMsg, $targetUserId, "suspension");
                    }
                }
            }
        }
        $status = 'resolved';

    // Execute Unsuspend User Action (Lift warning & restore status to active)
    } elseif ($actionTaken === 'unsuspend_user' || $actionTaken === 'activate_user') {
        $usersRes = $mysqli->query("
            SELECT ur.target_user_id
            FROM user_reports ur
            WHERE ur.id IN ($idList)
        ");

        if ($usersRes) {
            while ($uRow = $usersRes->fetch_assoc()) {
                $targetUserId = (int)$uRow['target_user_id'];
                if ($targetUserId > 0) {
                    $mysqli->query("UPDATE users SET status = 'active' WHERE id = $targetUserId");
                    $mysqli->query("DELETE FROM user_roles WHERE user_id = $targetUserId AND role IN ('suspended', 'banned')");
                }
            }
        }
        $status = 'resolved';

    // Execute Permanent Ban User Action
    } elseif ($actionTaken === 'ban_user') {
        $usersRes = $mysqli->query("
            SELECT ur.target_user_id, ur.reason, ur.description, u.name, u.email
            FROM user_reports ur
            LEFT JOIN users u ON u.id = ur.target_user_id
            WHERE ur.id IN ($idList)
        ");

        if ($usersRes) {
            while ($uRow = $usersRes->fetch_assoc()) {
                $targetUserId = (int)$uRow['target_user_id'];
                if ($targetUserId > 0) {
                    $userName = !empty($uRow['name']) ? $uRow['name'] : 'User';
                    $userEmail = !empty($uRow['email']) ? $uRow['email'] : '';
                    $reasonText = !empty($uRow['reason']) ? $uRow['reason'] : 'Multiple Policy Violations';
                    $noteText = !empty($adminNote) ? $adminNote : 'Account permanently banned due to repeated warnings.';
                    
                    // Set status = 'banned' in users table
                    $mysqli->query("UPDATE users SET status = 'banned' WHERE id = $targetUserId");
                    $mysqli->query("INSERT IGNORE INTO user_roles (user_id, role) VALUES ($targetUserId, 'banned')");
                    
                    $banMsg = "Dear $userName, your account has been permanently banned from DayalStock due to repeated policy violations and warnings. Primary Reason: '$reasonText'. Details: $noteText.";

                    if (!empty($userEmail)) {
                        sendReportEmail($userEmail, $userName, "Account Permanently Banned - DayalStock", "Permanent Account Ban Notice", $banMsg, $targetUserId, "ban");
                    }
                }
            }
        }
        $status = 'resolved';
    }

    // Update user report records with status and audit logs
    $stmt = $mysqli->prepare("
        UPDATE user_reports
        SET 
            status = ?,
            admin_note = IF(? != '', ?, admin_note),
            reviewed_by = ?,
            reviewed_by_name = ?,
            reviewed_at = NOW(),
            action_taken = ?
        WHERE id IN ($idList)
    ");

    $stmt->bind_param("sssiss", $status, $adminNote, $adminNote, $adminId, $adminName, $actionTaken);

    if ($stmt->execute()) {
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        echo json_encode([
            "success" => true,
            "message" => "Successfully updated " . count($ids) . " user report(s) & sent notification/email",
            "affected_count" => $affectedRows
        ]);
    } else {
        throw new Exception("Database error: " . $mysqli->error);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update user report",
        "error" => $e->getMessage()
    ]);
}
