<?php
// backend/api/admin/icons/bulk.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$action = trim($data['action'] ?? '');
$ids = $data['ids'] ?? [];

if (empty($action) || !is_array($ids) || empty($ids)) {
    jsonResponse(false, null, 'Action and a non-empty list of IDs are required.', 400);
}

// Clean and filter IDs
$iconIds = array_values(array_unique(array_filter(array_map('intval', $ids))));
if (empty($iconIds)) {
    jsonResponse(false, null, 'No valid icon IDs provided.', 400);
}

$allowedActions = ['publish', 'unpublish', 'archive', 'delete', 'assign_category'];
if (!in_array($action, $allowedActions)) {
    jsonResponse(false, null, "Invalid action. Allowed: " . implode(', ', $allowedActions), 400);
}

$placeholders = implode(',', array_fill(0, count($iconIds), '?'));

try {
    $pdo->beginTransaction();

    // Fetch existing categories of these icons to recalculate counts later
    $catStmt = $pdo->prepare("SELECT DISTINCT category_id FROM icons WHERE id IN ({$placeholders})");
    $catStmt->execute($iconIds);
    $affectedCategories = $catStmt->fetchAll(PDO::FETCH_COLUMN);

    switch ($action) {
        case 'publish':
            $stmt = $pdo->prepare("UPDATE icons SET status = 'published', updated_at = NOW() WHERE id IN ({$placeholders})");
            $stmt->execute($iconIds);
            break;

        case 'unpublish':
            $stmt = $pdo->prepare("UPDATE icons SET status = 'draft', updated_at = NOW() WHERE id IN ({$placeholders})");
            $stmt->execute($iconIds);
            break;

        case 'archive':
            $stmt = $pdo->prepare("UPDATE icons SET status = 'archived', updated_at = NOW() WHERE id IN ({$placeholders})");
            $stmt->execute($iconIds);
            break;

        case 'assign_category':
            $newCategoryId = (int)($data['category_id'] ?? 0);
            if ($newCategoryId <= 0) {
                throw new Exception('A valid target category_id is required for assign_category.');
            }
            $catCheck = $pdo->prepare("SELECT id FROM categories WHERE id = :id");
            $catCheck->execute([':id' => $newCategoryId]);
            if (!$catCheck->fetch()) {
                throw new Exception('Target category does not exist.');
            }

            $params = array_merge([$newCategoryId], $iconIds);
            $stmt = $pdo->prepare("UPDATE icons SET category_id = ?, updated_at = NOW() WHERE id IN ({$placeholders})");
            $stmt->execute($params);
            $affectedCategories[] = $newCategoryId;
            break;

        case 'delete':
            // Delete variants
            $pdo->prepare("DELETE FROM icon_variants WHERE icon_id IN ({$placeholders})")->execute($iconIds);
            $pdo->prepare("DELETE FROM favorites WHERE icon_id IN ({$placeholders})")->execute($iconIds);
            $pdo->prepare("DELETE FROM downloads WHERE icon_id IN ({$placeholders})")->execute($iconIds);
            $pdo->prepare("DELETE FROM icons WHERE id IN ({$placeholders})")->execute($iconIds);
            break;
    }

    // Recalculate icon_count for all affected categories
    $affectedCategories = array_values(array_unique(array_filter($affectedCategories)));
    if (!empty($affectedCategories)) {
        $recountStmt = $pdo->prepare("
            UPDATE categories 
            SET icon_count = (SELECT COUNT(*) FROM icons WHERE category_id = ? AND status = 'published')
            WHERE id = ?
        ");
        foreach ($affectedCategories as $catId) {
            $recountStmt->execute([$catId, $catId]);
        }
    }

    // Audit log
    logAdminAction($pdo, $admin['id'], 'bulk_' . $action, 'icons', null, [
        'count' => count($iconIds),
        'icon_ids' => $iconIds,
        'action' => $action
    ]);

    $pdo->commit();

    jsonResponse(true, [
        'action' => $action,
        'affected_count' => count($iconIds)
    ], "Bulk {$action} completed successfully.");

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Bulk operation failed: ' . $e->getMessage(), 500);
}
