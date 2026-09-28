<?php
// backend/api/admin/categories/reorder.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$orders = $data['orders'] ?? [];

if (!is_array($orders) || empty($orders)) {
    jsonResponse(false, null, 'An array of categories with display_order is required.', 400);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("UPDATE categories SET display_order = :order, updated_at = NOW() WHERE id = :id");

    foreach ($orders as $item) {
        $id = (int)($item['id'] ?? 0);
        $displayOrder = (int)($item['display_order'] ?? 0);
        if ($id > 0) {
            $stmt->execute([':order' => $displayOrder, ':id' => $id]);
        }
    }

    logAdminAction($pdo, $admin['id'], 'reorder_categories', 'category', null, [
        'count' => count($orders)
    ]);

    $pdo->commit();

    jsonResponse(true, null, 'Category order updated successfully.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, 'Failed to reorder categories: ' . $e->getMessage(), 500);
}
