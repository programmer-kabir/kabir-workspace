<?php
// backend/api/admin/pricing/delete.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? ($_POST['id'] ?? 0));

if ($id <= 0) {
    jsonResponse(false, null, 'Valid plan ID is required.', 400);
}

$stmt = $pdo->prepare("SELECT name FROM pricing_plans WHERE id = :id");
$stmt->execute([':id' => $id]);
$plan = $stmt->fetch();

if (!$plan) {
    jsonResponse(false, null, 'Pricing plan not found.', 404);
}

try {
    $pdo->prepare("DELETE FROM pricing_plans WHERE id = :id")->execute([':id' => $id]);

    logAdminAction($pdo, $admin['id'], 'delete_pricing_plan', 'pricing_plan', $id, [
        'name' => $plan['name']
    ]);

    jsonResponse(true, ['id' => $id], 'Pricing plan deleted successfully.');
} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to delete pricing plan: ' . $e->getMessage(), 500);
}
