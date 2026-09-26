<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['slug']) || empty($_GET['slug'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Slug is required"]);
        exit;
    }

    $slug = $mysqli->real_escape_string($_GET['slug']);

    $stmt = $mysqli->prepare("SELECT id, title, slug, content_format, content, excerpt, meta_title, meta_description, meta_keywords, canonical_url, og_title, og_description, og_image, is_indexable, updated_at FROM dynamic_pages WHERE slug = ? AND status = 'published'");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error"]);
        exit;
    }

    $stmt->bind_param("s", $slug);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Page not found or not published"]);
        exit;
    }

    $page = $result->fetch_assoc();
    
    echo json_encode(["success" => true, "data" => $page]);
    
    $stmt->close();
    $mysqli->close();
} elseif ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Handle preflight requests
    http_response_code(200);
    exit;
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
