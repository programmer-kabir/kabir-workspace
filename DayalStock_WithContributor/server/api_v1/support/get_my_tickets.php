<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    $user_id = $user['id'];

    $status = $_GET['status'] ?? 'all';
    $source = $_GET['source'] ?? null;
    
    $query = "SELECT * FROM support_tickets WHERE user_id = ?";
    
    $params = [$user_id];
    $types = "i";
    
    if ($source) {
        $query .= " AND ticket_source = ?";
        $params[] = $source;
        $types .= "s";
    }

    if ($status !== 'all') {
        $query .= " AND status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    $query .= " ORDER BY updated_at DESC";
    
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $data
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
