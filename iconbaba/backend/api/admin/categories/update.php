<?php
// backend/api/admin/categories/update.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(false, null, 'Valid Category ID is required.', 400);
}

// Fetch existing category
$stmt = $pdo->prepare("SELECT * FROM categories WHERE id = :id");
$stmt->execute([':id' => $id]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$existing) {
    jsonResponse(false, null, 'Category not found.', 404);
}

$name = isset($data['name']) ? trim($data['name']) : $existing['name'];
$description = isset($data['description']) ? trim($data['description']) : $existing['description'];
$displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : (int)$existing['display_order'];
$status = isset($data['status']) && in_array($data['status'], ['active', 'inactive']) ? $data['status'] : $existing['status'];

// Slug
if (!empty($data['slug'])) {
    $slugCandidate = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['slug']), '-'));
} else {
    $slugCandidate = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
}

if (empty($slugCandidate)) {
    $slugCandidate = 'category-' . $id;
}

// Ensure uniqueness (excluding self)
$candidate = $slugCandidate;
$counter = 1;
while (true) {
    $check = $pdo->prepare("SELECT id FROM categories WHERE slug = :slug AND id != :id");
    $check->execute([':slug' => $candidate, ':id' => $id]);
    if (!$check->fetch()) {
        $slug = $candidate;
        break;
    }
    $candidate = "{$slugCandidate}-{$counter}";
    $counter++;
}

try {
    $updateStmt = $pdo->prepare("
        UPDATE categories 
        SET name = :name, slug = :slug, description = :description, display_order = :display_order, status = :status, updated_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':description' => !empty($description) ? $description : null,
        ':display_order' => $displayOrder,
        ':status' => $status,
        ':id' => $id
    ]);

    // Recalculate icon count
    $recountStmt = $pdo->prepare("
        UPDATE categories 
        SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = :cat_id AND status = 'published')
        WHERE id = :cat_id
    ");
    $recountStmt->execute([':cat_id' => $id]);

    // Log audit
    logAdminAction($pdo, $admin['id'], 'update_category', 'category', $id, [
        'name' => $name,
        'slug' => $slug,
        'status' => $status,
        'display_order' => $displayOrder
    ]);

    jsonResponse(true, [
        'id' => $id,
        'name' => $name,
        'slug' => $slug,
        'description' => $description,
        'display_order' => $displayOrder,
        'status' => $status
    ], 'Category updated successfully.');

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to update category: ' . $e->getMessage(), 500);
}
