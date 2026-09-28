<?php
// backend/api/admin/icons/delete.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? ($_POST['id'] ?? 0));

if ($id <= 0) {
    jsonResponse(false, null, 'Valid Icon ID is required.', 400);
}

// Fetch icon
$stmt = $pdo->prepare("SELECT id, name, slug, category_id FROM icons WHERE id = :id");
$stmt->execute([':id' => $id]);
$icon = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$icon) {
    jsonResponse(false, null, 'Icon not found.', 404);
}

try {
    $pdo->beginTransaction();

    $categoryId = (int)$icon['category_id'];
    $slug = $icon['slug'];

    // Delete variants
    $pdo->prepare("DELETE FROM icon_variants WHERE icon_id = :id")->execute([':id' => $id]);

    // Delete favorites & downloads related to this icon
    $pdo->prepare("DELETE FROM favorites WHERE icon_id = :id")->execute([':id' => $id]);
    $pdo->prepare("DELETE FROM downloads WHERE icon_id = :id")->execute([':id' => $id]);

    // Delete icon
    $pdo->prepare("DELETE FROM icons WHERE id = :id")->execute([':id' => $id]);

    // Recalculate category icon count
    if ($categoryId > 0) {
        $pdo->prepare("
            UPDATE categories 
            SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
            WHERE id = ?
        ")->execute([$categoryId, $categoryId]);
    }


    // Audit log
    logAdminAction($pdo, $admin['id'], 'delete_icon', 'icon', $id, [
        'name' => $icon['name'],
        'slug' => $icon['slug'],
        'category_id' => $categoryId
    ]);

    $pdo->commit();

    jsonResponse(true, ['id' => $id], 'Icon deleted successfully.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to delete icon: ' . $e->getMessage(), 500);
}
