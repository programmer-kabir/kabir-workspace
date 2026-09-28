<?php
// backend/api/admin/faq/delete.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? ($_POST['id'] ?? 0));

if ($id <= 0) {
    jsonResponse(false, null, 'Valid FAQ ID is required.', 400);
}

try {
    $stmt = $pdo->prepare("SELECT question FROM faq_items WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $faq = $stmt->fetch();

    if (!$faq) {
        jsonResponse(false, null, 'FAQ item not found.', 404);
    }

    $pdo->prepare("DELETE FROM faq_items WHERE id = :id")->execute([':id' => $id]);

    logAdminAction($pdo, $admin['id'], 'delete_faq', 'faq', $id, ['question' => $faq['question']]);

    jsonResponse(true, ['id' => $id], 'FAQ item deleted successfully.');
} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to delete FAQ item: ' . $e->getMessage(), 500);
}
