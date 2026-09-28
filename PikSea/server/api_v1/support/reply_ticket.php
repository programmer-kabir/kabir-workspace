<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    $user_id = $user['id'];
    $is_admin = in_array('admin', $user['roles'] ?? []);

    $data = json_decode(file_get_contents("php://input"), true);
    $ticket_id = $data['ticket_id'] ?? null;
    $message = $data['message'] ?? '';
    $attachment_url = $data['attachment_url'] ?? null;
    $is_internal_note = (isset($data['is_internal_note']) && $is_admin) ? (int)$data['is_internal_note'] : 0;

    if (!$ticket_id || (trim($message) === '' && empty($attachment_url))) {
        echo json_encode(["success" => false, "message" => "Ticket ID and message or attachment are required"]);
        exit;
    }

    // Verify ticket exists and user has access
    $stmt = $mysqli->prepare("SELECT user_id, status FROM support_tickets WHERE id = ?");
    $stmt->bind_param("s", $ticket_id);
    $stmt->execute();
    $ticket = $stmt->get_result()->fetch_assoc();

    if (!$ticket) {
        echo json_encode(["success" => false, "message" => "Ticket not found"]);
        exit;
    }

    if (!$is_admin && $ticket['user_id'] !== $user_id) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized access"]);
        exit;
    }

    if ($ticket['status'] === 'Closed' && !$is_admin) {
        echo json_encode(["success" => false, "message" => "This ticket is closed. Please open a new one."]);
        exit;
    }

    $mysqli->begin_transaction();

    // Insert message
    $is_admin_reply = $is_admin ? 1 : 0;
    $ins = $mysqli->prepare("INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment_url, is_admin_reply, is_internal_note) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->bind_param("sissii", $ticket_id, $user_id, $message, $attachment_url, $is_admin_reply, $is_internal_note);
    $ins->execute();

    // Update ticket status
    if (!$is_internal_note) {
        $new_status = $is_admin ? 'Pending_Reply' : 'Open';
        $upd = $mysqli->prepare("UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?");
        $upd->bind_param("ss", $new_status, $ticket_id);
        $upd->execute();
        
        // Notify the other party
        $target_user = $is_admin ? $ticket['user_id'] : 'admin';
        $sender_type = $is_admin ? 'admin' : 'user';
        $target_role = $is_admin ? 'user' : 'admin';
        $title = $is_admin ? 'New Reply on Ticket' : 'Customer Replied to Ticket';
        $msg_preview = substr(strip_tags($message), 0, 50) . '...';
        
        // Find admin user_id if needed, but 'target_role' = 'admin' will show to all admins
        $notif_user_id = $is_admin ? $ticket['user_id'] : $user_id; 
        
        $notif = $mysqli->prepare("
            INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, link, priority) 
            VALUES (?, ?, ?, ?, 'support_reply', ?, ?, ?, 'medium')
        ");
        $link = $is_admin ? "/support-tickets" : "/admin/support/$ticket_id"; 
        $notif->bind_param("iisssss", $notif_user_id, $user_id, $sender_type, $target_role, $title, $msg_preview, $link);
        $notif->execute();
    }

    $mysqli->commit();
    echo json_encode(["success" => true, "message" => "Reply sent successfully"]);

} catch (Exception $e) {
    if (isset($mysqli)) $mysqli->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
