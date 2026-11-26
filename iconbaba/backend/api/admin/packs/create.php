<?php
// backend/api/admin/packs/create.php
// Admin API: Create a new pack

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/svg.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed. Only POST accepted.', 405);
}

$data = getJsonInput();

$name = trim($data['name'] ?? '');
$categoryId = (int)($data['category_id'] ?? 0);
$description = trim($data['description'] ?? '');
$tags = trim($data['tags'] ?? '');
$primaryStyle = trim($data['primary_style'] ?? 'outlined');
$authorName = trim($data['author_name'] ?? 'IconBaba Studio');
$isPremium = !empty($data['is_premium']) ? 1 : 0;
$isFeatured = !empty($data['is_featured']) ? 1 : 0;
$status = in_array($data['status'] ?? '', ['published', 'draft', 'archived']) ? $data['status'] : 'published';
$familySlug = trim($data['family_slug'] ?? '');

if (empty($name)) {
    jsonResponse(false, null, 'Pack name is required.', 400);
}

if ($categoryId <= 0) {
    jsonResponse(false, null, 'Please select a valid category.', 400);
}

// Verify category
$catStmt = $pdo->prepare("SELECT id, name FROM categories WHERE id = ?");
$catStmt->execute([$categoryId]);
if (!$catStmt->fetch()) {
    jsonResponse(false, null, 'Category not found.', 404);
}

try {
    $slug = generatePackSafeSlug($pdo, $name);

    $stmt = $pdo->prepare("
        INSERT INTO packs (category_id, family_slug, name, slug, description, tags, primary_style, author_name, is_premium, is_featured, status, created_by, created_at, updated_at)
        VALUES (:cat_id, :fam_slug, :name, :slug, :desc, :tags, :primary_style, :author, :premium, :featured, :status, :created_by, NOW(), NOW())
    ");
    $stmt->execute([
        ':cat_id' => $categoryId,
        ':fam_slug' => !empty($familySlug) ? $familySlug : null,
        ':name' => $name,
        ':slug' => $slug,
        ':desc' => $description,
        ':tags' => $tags,
        ':primary_style' => $primaryStyle,
        ':author' => !empty($authorName) ? $authorName : 'IconBaba Studio',
        ':premium' => $isPremium,
        ':featured' => $isFeatured,
        ':status' => $status,
        ':created_by' => (int)$admin['id']
    ]);

    $packId = (int)$pdo->lastInsertId();

    // Update pack_count on category
    $pdo->prepare("UPDATE categories SET pack_count = (SELECT COUNT(*) FROM packs WHERE category_id = ? AND status = 'published') WHERE id = ?")
        ->execute([$categoryId, $categoryId]);

    logAdminAction($pdo, $admin['id'], 'create_pack', 'pack', $packId, ['name' => $name, 'slug' => $slug]);

    jsonResponse(true, [
        'id' => $packId,
        'name' => $name,
        'slug' => $slug
    ], 'Pack created successfully.', 201);

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to create pack: ' . $e->getMessage(), 500);
}
