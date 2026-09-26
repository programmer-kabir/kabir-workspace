<?php
require_once '../config/cors.php';
header('Content-Type: application/json');

require_once '../config/db.php';
require_once '../middleware/auth.php';

$email = $GLOBALS['user']['email'];
if (!$email) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    // Fetch all user fields
    $stmt = $mysqli->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "User not found with this email"
        ]);
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Fetch user roles
    $stmt = $mysqli->prepare("SELECT role FROM user_roles WHERE user_id = ?");
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    $role_result = $stmt->get_result();
    $roles = [];
    while($r = $role_result->fetch_assoc()) {
        $roles[] = $r['role'];
    }
    $user['roles'] = $roles;
    $stmt->close();
    
    // (Optional) You can fetch other history here like downloads, collections, etc.
    
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
