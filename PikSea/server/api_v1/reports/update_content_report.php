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

    // Execute unpublish content action & send notification to content author
    if ($actionTaken === 'unpublish_content') {
        $contentsRes = $mysqli->query("
            SELECT c.id, c.title, c.author_id, COALESCE(a.user_id, c.author_id) AS user_id, u.name, u.email 
            FROM contents c 
            LEFT JOIN authors a ON a.id = c.author_id 
            LEFT JOIN users u ON u.id = COALESCE(a.user_id, c.author_id)
            INNER JOIN content_reports cr ON cr.content_id = c.id 
            WHERE cr.id IN ($idList)
        ");

        if ($contentsRes) {
            while ($cRow = $contentsRes->fetch_assoc()) {
                $authorUserId = (int)$cRow['user_id'];
                $authorName = !empty($cRow['name']) ? $cRow['name'] : 'Contributor';
                $authorEmail = !empty($cRow['email']) ? $cRow['email'] : '';
                $contentTitle = $cRow['title'];
                
                if ($authorUserId > 0) {
                    $detailsText = !empty($adminNote) ? $adminNote : 'Violation of content licensing guidelines';
                    $notifMsg = "Dear Contributor, your submission '$contentTitle' has been unpublished following a compliance review. Reason/Details: $detailsText. Please ensure future submissions adhere strictly to platform standards.";
                    
                    // 1. In-App Notification
                    $notifStmt = $mysqli->prepare("
                        INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, priority, is_read, is_deleted, created_at)
                        VALUES (?, ?, 'admin', 'user', 'content_unpublished', 'Asset Removal Notice', ?, 'high', 0, 0, NOW())
                    ");
                    $notifStmt->bind_param("iis", $authorUserId, $adminId, $notifMsg);
                    $notifStmt->execute();
                    $notifStmt->close();

                    // 2. Real Email Notification & DB Logging
                    if (!empty($authorEmail)) {
                        sendReportEmail($authorEmail, $authorName, "Asset Removal Notice - DayalStock", "Asset Removal Notice", $notifMsg, $authorUserId, "content_unpublished");
                    }
                }
            }
        }

        $mysqli->query("
            UPDATE contents c
            INNER JOIN content_reports cr ON cr.content_id = c.id
            SET c.status = 'rejected', c.rejection_reason = 'Unpublished due to user report'
            WHERE cr.id IN ($idList)
        ");
        $status = 'resolved';
    }

    // Update report records with status and audit logs
    $stmt = $mysqli->prepare("
        UPDATE content_reports
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
            "message" => "Successfully updated " . count($ids) . " report(s)",
            "affected_count" => $affectedRows
        ]);
    } else {
        throw new Exception("Database error: " . $mysqli->error);
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update content report",
        "error" => $e->getMessage()
    ]);
}
