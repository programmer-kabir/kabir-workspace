<?php
// backend/api/collections/remove_item.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$user = requireAuth($pdo);
$input = getJsonInput();
$collectionId = isset($input['collection_id']) ? (int)$input['collection_id'] : 0;
$iconId = isset($input['icon_id']) ? (int)$input['icon_id'] : 0;

if ($collectionId <= 0 || $iconId <= 0) {
    jsonResponse(false, null, 'Valid collection_id and icon_id are required', 400);
}

// Verify ownership
$colCheck = $pdo->prepare("SELECT id FROM collections WHERE id = :cid AND user_id = :uid");
$colCheck->execute([':cid' => $collectionId, ':uid' => $user['id']]);
if (!$colCheck->fetch()) {
    jsonResponse(false, null, 'Collection not found or unauthorized', 403);
}

$stmt = $pdo->prepare("DELETE FROM collection_items WHERE collection_id = :cid AND icon_id = :iid");
$stmt->execute([':cid' => $collectionId, ':iid' => $iconId]);

jsonResponse(true, null, 'Icon removed from collection');
