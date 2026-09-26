<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    $user_id = $user['id'];

    $data = json_decode(file_get_contents("php://input"), true);
    
    $subject = $data['subject'] ?? '';
    $department = $data['department'] ?? 'General';
    // Automatically set priority based on department
    if ($department === 'Billing' || $department === 'Copyright') {
        $priority = 'High';
    } elseif ($department === 'Technical') {
        $priority = 'Medium';
    } else {
        $priority = 'Low';
    }
    $message = $data['message'] ?? '';
    $attachment_url = $data['attachment_url'] ?? null;
    $ticket_source = $data['ticket_source'] ?? 'user';

    if (trim($subject) === '' || trim($message) === '') {
        echo json_encode(["success" => false, "message" => "Subject and message are required"]);
        exit;
    }

    // Check daily limit (max 3 tickets per day per user)
    $limit_check = $mysqli->prepare("SELECT COUNT(*) as ticket_count FROM support_tickets WHERE user_id = ? AND DATE(created_at) = CURDATE()");
    $limit_check->bind_param("i", $user_id);
    $limit_check->execute();
    $limit_result = $limit_check->get_result()->fetch_assoc();
    
    if ($limit_result['ticket_count'] >= 3) {
        echo json_encode(["success" => false, "message" => "You have reached the limit of 3 tickets per day. Please try again tomorrow."]);
        exit;
    }

    $mysqli->begin_transaction();

    // Generate Ticket ID
    $ticket_id = 'TKT-' . strtoupper(substr(uniqid(), -6));

    // Insert Ticket
    $ins = $mysqli->prepare("
        INSERT INTO support_tickets (id, user_id, department, subject, priority, status, created_at, ticket_source)
        VALUES (?, ?, ?, ?, ?, 'Open', NOW(), ?)
    ");
    $ins->bind_param("sissss", $ticket_id, $user_id, $department, $subject, $priority, $ticket_source);
    $ins->execute();

    // Insert First Message
    $msg_ins = $mysqli->prepare("
        INSERT INTO ticket_messages (ticket_id, sender_id, message, attachment_url, is_admin_reply)
        VALUES (?, ?, ?, ?, 0)
    ");
    $msg_ins->bind_param("siss", $ticket_id, $user_id, $message, $attachment_url);
    $msg_ins->execute();

    // Notify Admin
    $title = "New Ticket: " . $subject;
    $msg_preview = substr(strip_tags($message), 0, 50) . '...';
    $notif = $mysqli->prepare("
        INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, link, priority) 
        VALUES (1, ?, 'user', 'admin', 'new_ticket', ?, ?, ?, 'high')
    ");
    $link = "/support-tickets";
    $notif->bind_param("isss", $user_id, $title, $msg_preview, $link);
    $notif->execute();

    $mysqli->commit();
    echo json_encode([
        "success" => true, 
        "message" => "Ticket created successfully",
        "ticket_id" => $ticket_id
    ]);

} catch (Exception $e) {
    if (isset($mysqli)) $mysqli->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
