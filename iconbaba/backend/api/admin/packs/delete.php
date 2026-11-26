<?php
// backend/api/admin/packs/delete.php
// Admin API: Delete a pack and safely detach its icons

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$data = getJsonInput();
$id = (int)($data['id'] ?? ($_GET['id'] ?? 0));

if ($id <= 0) {
    jsonResponse(false, null, 'Pack ID is required.', 400);
}

$stmt = $pdo->prepare("SELECT * FROM packs WHERE id = ?");
$stmt->execute([$id]);
$pack = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$pack) {
    jsonResponse(false, null, 'Pack not found.', 404);
}

try {
    $pdo->beginTransaction();

    $categoryId = (int)$pack['category_id'];

    // Detach or delete icons (detach to prevent accidental icon deletion)
    $pdo->prepare("UPDATE icons SET pack_id = NULL WHERE pack_id = ?")->execute([$id]);

    // Delete pack
    $pdo->prepare("DELETE FROM packs WHERE id = ?")->execute([$id]);

    // Update category pack count
    $pdo->prepare("UPDATE categories SET pack_count = (SELECT COUNT(*) FROM packs WHERE category_id = ? AND status = 'published') WHERE id = ?")
        ->execute([$categoryId, $categoryId]);

    $pdo->commit();

    logAdminAction($pdo, $admin['id'], 'delete_pack', 'pack', $id, ['name' => $pack['name']]);

    jsonResponse(true, null, 'Pack deleted successfully.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to delete pack: ' . $e->getMessage(), 500);
}
