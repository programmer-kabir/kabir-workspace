<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

$content_id = isset($_GET['content_id']) ? intval($_GET['content_id']) : 0;

if ($content_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid content ID"]);
    exit;
}

// Fetch content price and sold status
$stmt = $mysqli->prepare("SELECT id, title, slug, author_id, exclusive_price, is_exclusive_sold FROM contents WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $content_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Content not found"]);
    exit;
}

$content = $result->fetch_assoc();

echo json_encode([
    "success" => true,
    "data" => [
        "id" => $content['id'],
        "title" => $content['title'],
        "slug" => $content['slug'],
        "author_id" => $content['author_id'],
        "exclusive_price" => $content['exclusive_price'] ? (float)$content['exclusive_price'] : null,
        "is_exclusive_sold" => (bool)$content['is_exclusive_sold']
    ]
]);
