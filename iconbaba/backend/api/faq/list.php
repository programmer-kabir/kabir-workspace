<?php
// backend/api/faq/list.php
// Get published FAQ items grouped by category

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$category = isset($_GET['category']) ? trim($_GET['category']) : '';

if (!empty($category)) {
    $stmt = $pdo->prepare("
        SELECT id, question, answer, category, display_order
        FROM faq_items
        WHERE status = 'published' AND category = :category
        ORDER BY display_order ASC, id ASC
    ");
    $stmt->execute([':category' => $category]);
} else {
    $stmt = $pdo->query("
        SELECT id, question, answer, category, display_order
        FROM faq_items
        WHERE status = 'published'
        ORDER BY category ASC, display_order ASC, id ASC
    ");
}

$items = $stmt->fetchAll();

// Group by category for convenience
$grouped = [];
$categories = [];
foreach ($items as $item) {
    $cat = $item['category'];
    if (!isset($grouped[$cat])) {
        $grouped[$cat] = [];
        $categories[] = $cat;
    }
    $grouped[$cat][] = $item;
}

jsonResponse(true, [
    'items' => $items,
    'grouped' => $grouped,
    'categories' => array_values(array_unique($categories))
], 'FAQ items retrieved successfully.');
