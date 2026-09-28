<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);
$status = trim($data['status'] ?? '');

if ($id <= 0 || !in_array($status, ['unread', 'read', 'replied'])) {
    jsonResponse(false, null, 'Valid Message ID and status (unread/read/replied) are required.', 400);
}

try {
    $stmt = $pdo->prepare("UPDATE contact_messages SET status = :status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([':status' => $status, ':id' => $id]);

    logAdminAction($pdo, $admin['id'], 'update_contact_message_status', 'contact_message', $id, [
        'status' => $status
    ]);

    jsonResponse(true, ['id' => $id, 'status' => $status], 'Message status updated successfully.');
} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to update message status: ' . $e->getMessage(), 500);
}
