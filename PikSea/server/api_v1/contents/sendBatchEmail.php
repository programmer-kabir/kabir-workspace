<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helper/email_helper.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    if (!isset($mysqli) || !$mysqli) {
        throw new Exception('Database connection error.');
    }

    $userEmail = $GLOBALS['user']['email'];
    if (!$userEmail) throw new Exception("Unauthorized. Please log in.");
    
    $input = json_decode(file_get_contents('php://input'), true);
    $count = (int)($input['count'] ?? 1);
    
    $authStmt = $mysqli->prepare("SELECT id, name AS full_name FROM users WHERE email = ? LIMIT 1");
    $authStmt->bind_param("s", $userEmail);
    $authStmt->execute();
    $authRes = $authStmt->get_result();
    
    if ($authRes->num_rows > 0) {
        $row = $authRes->fetch_assoc();
        $authorUserId = (int)$row['id'];
        $authorDisplayName = $row['full_name'] ?? 'Admin';
        
        file_put_contents(__DIR__ . '/debug_log.txt', date('Y-m-d H:i:s') . " - Calling sendEmail for $userEmail with count $count\n", FILE_APPEND);
        
        $emailResult = sendEmail($mysqli, $userEmail, $authorDisplayName, 'content_submitted', [
            'file_count' => $count
        ], $authorUserId);
        
        file_put_contents(__DIR__ . '/debug_log.txt', date('Y-m-d H:i:s') . " - sendEmail result: " . var_export($emailResult, true) . "\n", FILE_APPEND);
    } else {
        file_put_contents(__DIR__ . '/debug_log.txt', date('Y-m-d H:i:s') . " - No user found for email $userEmail\n", FILE_APPEND);
    }
    $authStmt->close();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    file_put_contents(__DIR__ . '/debug_log.txt', date('Y-m-d H:i:s') . " - Exception: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
