<?php
// backend/api/admin/categories/create.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$name = trim($data['name'] ?? '');
$description = trim($data['description'] ?? '');
$displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : 0;
$status = in_array($data['status'] ?? '', ['active', 'inactive']) ? $data['status'] : 'active';

if (empty($name)) {
    jsonResponse(false, null, 'Category name is required.', 400);
}

// Generate or sanitize slug
if (!empty($data['slug'])) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['slug']), '-'));
} else {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
}

if (empty($slug)) {
    $slug = 'category-' . time();
}

// Ensure slug uniqueness
$candidate = $slug;
$counter = 1;
while (true) {
    $check = $pdo->prepare("SELECT id FROM categories WHERE slug = :slug");
    $check->execute([':slug' => $candidate]);
    if (!$check->fetch()) {
        $slug = $candidate;
        break;
    }
    $candidate = "{$slug}-{$counter}";
    $counter++;
}

// If display_order was 0, put it at the end
if ($displayOrder <= 0) {
    $maxOrder = (int)$pdo->query("SELECT MAX(display_order) FROM categories")->fetchColumn();
    $displayOrder = $maxOrder + 1;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO categories (name, slug, icon_count, display_order, status, description, created_at, updated_at)
        VALUES (:name, :slug, 0, :display_order, :status, :description, NOW(), NOW())
    ");
    $stmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':display_order' => $displayOrder,
        ':status' => $status,
        ':description' => !empty($description) ? $description : null
    ]);
    $catId = (int)$pdo->lastInsertId();

    // Log audit
    logAdminAction($pdo, $admin['id'], 'create_category', 'category', $catId, [
        'name' => $name,
        'slug' => $slug,
        'status' => $status,
        'display_order' => $displayOrder
    ]);

    jsonResponse(true, [
        'id' => $catId,
        'name' => $name,
        'slug' => $slug,
        'icon_count' => 0,
        'display_order' => $displayOrder,
        'status' => $status,
        'description' => $description
    ], 'Category created successfully.', 201);

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to create category: ' . $e->getMessage(), 500);
}
