<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    $status = $_GET['status'] ?? 'all';
    
    $query = "
        SELECT 
            ai.id, ai.author_id, ai.document_type, ai.nid_number, ai.date_of_birth,
            ai.front_image_path as front_image_url, ai.back_image_path as back_image_url, ai.selfie_image_path as selfie_image_url,
            ai.status, ai.rejection_reason, ai.created_at,
            ai.full_name, u.username, u.email
        FROM author_identities ai
        JOIN authors a ON ai.author_id = a.id
        JOIN users u ON a.user_id = u.id
    ";
    
    if ($status !== 'all') {
        $query .= " WHERE ai.status = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("s", $status);
    } else {
        $stmt = $mysqli->prepare($query);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $data]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
