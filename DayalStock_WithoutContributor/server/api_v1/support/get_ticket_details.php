<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    $user_id = $user['id'];
    $is_admin = in_array('admin', $user['roles'] ?? []);

    $ticket_id = $_GET['id'] ?? null;
    if (!$ticket_id) {
        echo json_encode(["success" => false, "message" => "Ticket ID is required"]);
        exit;
    }

    // Get ticket info and user online status
    $stmt = $mysqli->prepare("
        SELECT t.*, u.name as user_name, u.email as user_email, u.last_active as user_last_active,
               IF(u.last_active > DATE_SUB(NOW(), INTERVAL 3 MINUTE), 1, 0) as is_user_online 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.id = ?
    ");
    $stmt->bind_param("s", $ticket_id);
    $stmt->execute();
    $ticket = $stmt->get_result()->fetch_assoc();

    // Check if any admin is online and get latest admin activity
    $admin_stmt = $mysqli->query("
        SELECT SUM(IF(u.last_active > DATE_SUB(NOW(), INTERVAL 3 MINUTE), 1, 0)) as online_admins,
               MAX(u.last_active) as admin_last_active
        FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        WHERE ur.role = 'admin'
    ");
    $admin_row = $admin_stmt->fetch_assoc();
    $is_admin_online = $admin_row['online_admins'] > 0;
    $admin_last_active = $admin_row['admin_last_active'];

    if (!$ticket) {
        echo json_encode(["success" => false, "message" => "Ticket not found"]);
        exit;
    }

    // Security check: only admin or the ticket owner can view
    if (!$is_admin && $ticket['user_id'] !== $user_id) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Unauthorized access"]);
        exit;
    }

    // Get messages
    $msg_query = "
        SELECT m.*, u.name as sender_name 
        FROM ticket_messages m 
        LEFT JOIN users u ON m.sender_id = u.id 
        WHERE m.ticket_id = ?
    ";
    
    // If not admin, do not show internal notes
    if (!$is_admin) {
        $msg_query .= " AND m.is_internal_note = 0";
    }
    
    $msg_query .= " ORDER BY m.created_at ASC";

    $msg_stmt = $mysqli->prepare($msg_query);
    $msg_stmt->bind_param("s", $ticket_id);
    $msg_stmt->execute();
    $msg_result = $msg_stmt->get_result();

    $messages = [];
    while ($row = $msg_result->fetch_assoc()) {
        $messages[] = $row;
    }

    echo json_encode([
        "success" => true,
        "ticket" => $ticket,
        "is_admin_online" => $is_admin_online,
        "admin_last_active" => $admin_last_active,
        "messages" => $messages
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
