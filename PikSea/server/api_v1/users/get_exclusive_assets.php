<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php'; // SECURE: Verify Firebase Token

header("Content-Type: application/json");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Invalid request method');
    }

    $userId = $GLOBALS['user']['id'] ?? null;
    if (!$userId) {
        throw new Exception('User not authenticated');
    }

    // Prepare query to fetch exclusive assets for the logged-in user
    $query = "
        SELECT 
            c.id, 
            c.title, 
            c.slug, 
            c.thumbnail_url as thumbnail_path,
            main_file.file_url as file_path, 
            main_file.file_type,
            eb.amount, 
            eb.transaction_id, 
            eb.created_at,
            'piksea' as author_username,
            'PikSea Official' as author_name
        FROM exclusive_buyouts eb
        JOIN contents c ON eb.content_id = c.id
        LEFT JOIN (
            SELECT content_id, MAX(file_url) as file_url, MAX(file_type) as file_type
            FROM content_files
            WHERE is_main_file = 1
            GROUP BY content_id
        ) main_file ON main_file.content_id = c.id
        WHERE eb.user_id = ? AND eb.status = 'completed'
        ORDER BY eb.created_at DESC
    ";

    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception("Database error: " . $mysqli->error);
    }

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $assets = [];
    while ($row = $result->fetch_assoc()) {
        $assets[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $assets
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
