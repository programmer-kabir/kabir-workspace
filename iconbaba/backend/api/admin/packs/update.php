<?php
// backend/api/admin/packs/update.php
// Admin API: Update pack details

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/svg.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(false, null, 'Pack ID is required.', 400);
}

$stmt = $pdo->prepare("SELECT * FROM packs WHERE id = ?");
$stmt->execute([$id]);
$pack = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$pack) {
    jsonResponse(false, null, 'Pack not found.', 404);
}

$name = trim($data['name'] ?? $pack['name']);
$categoryId = isset($data['category_id']) ? (int)$data['category_id'] : (int)$pack['category_id'];
$description = trim($data['description'] ?? $pack['description']);
$tags = trim($data['tags'] ?? $pack['tags']);
$primaryStyle = trim($data['primary_style'] ?? $pack['primary_style']);
$authorName = trim($data['author_name'] ?? $pack['author_name']);
$isPremium = isset($data['is_premium']) ? (!empty($data['is_premium']) ? 1 : 0) : (int)$pack['is_premium'];
$isFeatured = isset($data['is_featured']) ? (!empty($data['is_featured']) ? 1 : 0) : (int)$pack['is_featured'];
$status = in_array($data['status'] ?? '', ['published', 'draft', 'archived']) ? $data['status'] : $pack['status'];
$familySlug = trim($data['family_slug'] ?? $pack['family_slug']);

if (empty($name)) {
    jsonResponse(false, null, 'Pack name cannot be empty.', 400);
}

try {
    // Check if name changed; if so, update slug or keep existing if requested
    $slug = $pack['slug'];
    if (isset($data['slug']) && !empty(trim($data['slug']))) {
        $customSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['slug']), '-'));
        if ($customSlug !== $pack['slug']) {
            $slug = generatePackSafeSlug($pdo, $customSlug, $id);
        }
    }

    $updateStmt = $pdo->prepare("
        UPDATE packs SET
            category_id = :cat_id,
            family_slug = :fam_slug,
            name = :name,
            slug = :slug,
            description = :desc,
            tags = :tags,
            primary_style = :primary_style,
            author_name = :author,
            is_premium = :premium,
            is_featured = :featured,
            status = :status,
            updated_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute([
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
        ':id' => $id
    ]);

    // Recalculate icon count in pack
    $pdo->prepare("UPDATE packs SET icon_count = (SELECT COUNT(*) FROM icons WHERE pack_id = ? AND status = 'published') WHERE id = ?")
        ->execute([$id, $id]);

    // Recalculate category pack counts
    $pdo->prepare("UPDATE categories SET pack_count = (SELECT COUNT(*) FROM packs WHERE category_id = ? AND status = 'published') WHERE id = ?")
        ->execute([$categoryId, $categoryId]);

    if ($categoryId !== (int)$pack['category_id']) {
        $pdo->prepare("UPDATE categories SET pack_count = (SELECT COUNT(*) FROM packs WHERE category_id = ? AND status = 'published') WHERE id = ?")
            ->execute([(int)$pack['category_id'], (int)$pack['category_id']]);
    }

    logAdminAction($pdo, $admin['id'], 'update_pack', 'pack', $id, ['name' => $name, 'slug' => $slug]);

    jsonResponse(true, [
        'id' => $id,
        'name' => $name,
        'slug' => $slug
    ], 'Pack updated successfully.');

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to update pack: ' . $e->getMessage(), 500);
}
