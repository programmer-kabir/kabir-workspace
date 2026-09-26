<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/cors.php';

header('Content-Type: application/json; charset=utf-8');

$category_slug = isset($_GET['category']) ? trim(preg_replace('/[\r\n\t]+/', '', $_GET['category'])) : '';
$slug = isset($_GET['slug']) ? trim(preg_replace('/[\r\n\t]+/', '', $_GET['slug'])) : '';

if (empty($category_slug) || empty($slug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing category or slug parameters']);
    exit;
}

// 1. Check if it's a subcategory
// In categories table, we match slug.
$stmt = $mysqli->prepare("SELECT id, name FROM categories WHERE TRIM(slug) = ? LIMIT 1");
$stmt->bind_param("s", $slug);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'type' => 'subcategory'
    ]);
    exit;
}

$stmt->close();

// 2. Check if it's a content/asset
// Need to check if the table is contents or assets.
$table = 'contents';

if ($table) {
    $stmt2 = $mysqli->prepare("SELECT id FROM $table WHERE slug = ? LIMIT 1");
    if ($stmt2) {
        $stmt2->bind_param("s", $slug);
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        
        if ($result2->num_rows > 0) {
            $data = $result2->fetch_assoc();
            echo json_encode([
                'success' => true,
                'type' => 'content'
            ]);
            exit;
        }
        $stmt2->close();
    }
}

// 3. Not found
http_response_code(404);
echo json_encode([
    'success' => false,
    'error' => 'Route not found'
]);
exit;
