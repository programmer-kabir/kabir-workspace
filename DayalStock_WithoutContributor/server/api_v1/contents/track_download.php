<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php'; // SECURE: Verify Firebase Token

header("Content-Type: application/json; charset=UTF-8");

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $content_id = intval($data['content_id'] ?? 0);

    if ($content_id <= 0) {
        echo json_encode(["success" => false, "message" => "Content ID is required"]);
        exit;
    }

    // SECURE: Get User ID from validated token
    $user_id = (int) $GLOBALS['user']['id'];
    
    if ($user_id <= 0) {
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit;
    }

    // 2. Track download history (insert into downloads_history)
    $history_stmt = $mysqli->prepare("INSERT INTO downloads_history (user_id, content_id, downloaded_at) VALUES (?, ?, NOW())");
    $history_stmt->bind_param("ii", $user_id, $content_id);
    
    if ($history_stmt->execute()) {
        
        // ৩. Update the downloads_count in contents table (এই অংশটুকু যোগ করা হয়েছে)
        $update_stmt = $mysqli->prepare("UPDATE contents SET downloads_count = downloads_count + 1 WHERE id = ?");
        $update_stmt->bind_param("i", $content_id);
        $update_stmt->execute();

        echo json_encode(["success" => true, "message" => "Download tracked and count updated successfully"]);
    } else {
        throw new Exception("Failed to track download");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
