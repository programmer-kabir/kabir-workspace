<?php
// backend/api/admin/categories/delete.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? ($_POST['id'] ?? 0));
$reassignTo = isset($data['reassign_to']) ? (int)$data['reassign_to'] : 0;

if ($id <= 0) {
    jsonResponse(false, null, 'Valid Category ID is required.', 400);
}

// Fetch category
$stmt = $pdo->prepare("SELECT * FROM categories WHERE id = :id");
$stmt->execute([':id' => $id]);
$category = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$category) {
    jsonResponse(false, null, 'Category not found.', 404);
}

// Count icons in this category
$iconCountStmt = $pdo->prepare("SELECT COUNT(*) FROM icons WHERE category_id = :id");
$iconCountStmt->execute([':id' => $id]);
$iconCount = (int)$iconCountStmt->fetchColumn();

try {
    $pdo->beginTransaction();

    if ($iconCount > 0) {
        if ($reassignTo > 0 && $reassignTo !== $id) {
            // Verify target exists
            $tCheck = $pdo->prepare("SELECT id FROM categories WHERE id = :id");
            $tCheck->execute([':id' => $reassignTo]);
            if (!$tCheck->fetch()) {
                throw new Exception('Target category for reassignment does not exist.');
            }

            // Reassign icons
            $reassignStmt = $pdo->prepare("UPDATE icons SET category_id = :target WHERE category_id = :old");
            $reassignStmt->execute([':target' => $reassignTo, ':old' => $id]);

            // Update target category icon count
            $recountStmt = $pdo->prepare("
                UPDATE categories 
                SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
                WHERE id = ?
            ");
            $recountStmt->execute([$reassignTo, $reassignTo]);
        } else {
            // Unassign icons (set category_id to NULL if nullable or first existing category)
            $firstOtherCat = (int)$pdo->query("SELECT id FROM categories WHERE id != {$id} ORDER BY id ASC LIMIT 1")->fetchColumn();
            if ($firstOtherCat > 0) {
                $pdo->prepare("UPDATE icons SET category_id = :target WHERE category_id = :old")
                    ->execute([':target' => $firstOtherCat, ':old' => $id]);
                $pdo->prepare("
                    UPDATE categories 
                    SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
                    WHERE id = ?
                ")->execute([$firstOtherCat, $firstOtherCat]);
            }
        }
    }

    // Delete category
    $delStmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
    $delStmt->execute([':id' => $id]);

    // Log audit
    logAdminAction($pdo, $admin['id'], 'delete_category', 'category', $id, [
        'name' => $category['name'],
        'slug' => $category['slug'],
        'reassigned_icons' => $iconCount,
        'reassigned_to' => $reassignTo
    ]);

    $pdo->commit();

    jsonResponse(true, ['id' => $id], 'Category deleted successfully.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to delete category: ' . $e->getMessage(), 500);
}
