<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    $data = json_decode(file_get_contents("php://input"), true);
    $ticket_id = $data['ticket_id'] ?? null;
    $status = $data['status'] ?? null;

    if (!$ticket_id || !$status) {
        echo json_encode(["success" => false, "message" => "Ticket ID and status are required"]);
        exit;
    }

    $valid_statuses = ['Open', 'Pending_Reply', 'Resolved', 'Closed'];
    if (!in_array($status, $valid_statuses)) {
        echo json_encode(["success" => false, "message" => "Invalid status"]);
        exit;
    }

    $upd = $mysqli->prepare("UPDATE support_tickets SET status = ?, updated_at = NOW() WHERE id = ?");
    $upd->bind_param("ss", $status, $ticket_id);
    
    if ($upd->execute()) {
        echo json_encode(["success" => true, "message" => "Ticket status updated to $status"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update status"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
