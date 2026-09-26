<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    // tags টেবিলের সাথে content_tags কে LEFT JOIN করা হয়েছে এবং COUNT করা হয়েছে
    $sql = "
        SELECT 
            t.id, 
            t.name, 
            t.slug, 
            t.status, 
            t.created_at, 
            COUNT(ct.tag_id) AS usage_count
        FROM tags t
        LEFT JOIN content_tags ct ON t.id = ct.tag_id
        GROUP BY t.id
        ORDER BY usage_count DESC, t.id DESC
    ";
    
    $result = $mysqli->query($sql);

    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }

    echo json_encode(["success" => true, "data" => $tags]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
