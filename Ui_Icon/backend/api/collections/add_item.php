<?php
// backend/api/collections/add_item.php
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

// Verify icon exists
$iconCheck = $pdo->prepare("SELECT id FROM icons WHERE id = :id");
$iconCheck->execute([':id' => $iconId]);
if (!$iconCheck->fetch()) {
    jsonResponse(false, null, 'Icon not found', 404);
}

$stmt = $pdo->prepare("INSERT IGNORE INTO collection_items (collection_id, icon_id) VALUES (:cid, :iid)");
$stmt->execute([':cid' => $collectionId, ':iid' => $iconId]);

jsonResponse(true, null, 'Icon added to collection');
