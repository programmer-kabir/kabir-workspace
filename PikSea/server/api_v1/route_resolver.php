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

// 1. Check if it's a subcategory under the given parent category or globally
$stmt = $mysqli->prepare("
    SELECT c.id, c.name, p.slug as parent_slug
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE TRIM(c.slug) = ? AND c.parent_id IS NOT NULL
    LIMIT 1
");
$stmt->bind_param("s", $slug);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'type' => 'subcategory',
        'data' => $data
    ]);
    $stmt->close();
    exit;
}
$stmt->close();

// 2. Check if it's a content/asset in contents table
$stmt2 = $mysqli->prepare("SELECT id, slug, title FROM contents WHERE slug = ? LIMIT 1");
if ($stmt2) {
    $stmt2->bind_param("s", $slug);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    
    if ($result2->num_rows > 0) {
        $data = $result2->fetch_assoc();
        echo json_encode([
            'success' => true,
            'type' => 'content',
            'data' => $data
        ]);
        $stmt2->close();
        exit;
    }
    $stmt2->close();
}

// 3. Not found
http_response_code(404);
echo json_encode([
    'success' => false,
    'error' => 'Route not found'
]);
exit;

