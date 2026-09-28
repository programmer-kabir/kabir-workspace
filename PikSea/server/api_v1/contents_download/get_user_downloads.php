<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = trim($data['email'] ?? '');

    if (!$email) {
        echo json_encode(["success" => false, "message" => "Email is required"]);
        exit;
    }

    // 1. Get User ID
    $user_stmt = $mysqli->prepare("SELECT id FROM users WHERE email = ?");
    $user_stmt->bind_param("s", $email);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    
    if ($user_res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }
    $user_id = $user_res->fetch_assoc()['id'];

    // 2. Fetch Download History
    $downloads_sql = "
        SELECT 
            dh.id,
            dh.downloaded_at,
            c.title as content_title,
            c.slug as content_slug,
            c.is_premium,
            (
                SELECT sp.name
                FROM user_subscriptions us
                JOIN subscription_plans sp ON sp.id = us.plan_id
                WHERE us.user_id = dh.user_id 
                  AND dh.downloaded_at BETWEEN us.start_date AND us.end_date
                ORDER BY sp.price DESC
                LIMIT 1
            ) as plan_name
        FROM downloads_history dh
        JOIN contents c ON c.id = dh.content_id
        WHERE dh.user_id = ?
        ORDER BY dh.downloaded_at DESC
    ";
    
    $downloads_stmt = $mysqli->prepare($downloads_sql);
    $downloads_stmt->bind_param("i", $user_id);
    $downloads_stmt->execute();
    $downloads_result = $downloads_stmt->get_result();
    
    $downloads_history = [];
    while ($row = $downloads_result->fetch_assoc()) {
        $downloads_history[] = $row;
    }

    echo json_encode([
        "success" => true, 
        "data" => $downloads_history
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
