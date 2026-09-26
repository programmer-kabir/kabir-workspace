<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;
    $reason = $data['rejection_reason'] ?? null; // Optionally used if there is a rejection reason field

    if (!$id || !$status) {
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit;
    }

    // Ensure rejection_reason column exists in the database
    try {
        $mysqli->query("ALTER TABLE author_payout_methods ADD COLUMN rejection_reason TEXT DEFAULT NULL");
    } catch (Exception $ex) {
        // Ignore exception, column likely already exists
    }

    $stmt = $mysqli->prepare("UPDATE author_payout_methods SET status = ?, rejection_reason = ? WHERE id = ?");
    $stmt->bind_param("ssi", $status, $reason, $id);
    $res = $stmt->execute();
    
    if ($res) {
        echo json_encode(["success" => true, "message" => "Payment verification status updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update status."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
