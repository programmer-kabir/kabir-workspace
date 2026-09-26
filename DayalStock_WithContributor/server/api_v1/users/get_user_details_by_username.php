<?php
require_once '../config/cors.php';
header('Content-Type: application/json');
require_once '../config/db.php';

$username = isset($_GET['username']) ? trim($_GET['username']) : '';

if (!$username) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username is required']);
    exit();
}

try {
    // Fetch public user fields
    $stmt = $mysqli->prepare("SELECT id, name, username, photo, country, created_at FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "User not found"
        ]);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "data" => $user
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
