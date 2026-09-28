<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    $user_id = $user['id'];

    $data = json_decode(file_get_contents("php://input"), true);
    $ticket_id = $data['ticket_id'] ?? null;

    if (!$ticket_id) {
        echo json_encode(["success" => false, "message" => "Ticket ID is required"]);
        exit;
    }

    // Verify ticket belongs to user
    $check = $mysqli->prepare("SELECT id FROM support_tickets WHERE id = ? AND user_id = ?");
    $check->bind_param("si", $ticket_id, $user_id);
    $check->execute();
    if ($check->get_result()->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Ticket not found or unauthorized"]);
        exit;
    }

    $upd = $mysqli->prepare("UPDATE support_tickets SET status = 'Closed', updated_at = NOW() WHERE id = ?");
    $upd->bind_param("s", $ticket_id);
    
    if ($upd->execute()) {
        echo json_encode(["success" => true, "message" => "Ticket closed successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to close ticket"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
