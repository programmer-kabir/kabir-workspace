<?php
// backend/api/collections/delete.php
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

if ($collectionId <= 0) {
    jsonResponse(false, null, 'Valid collection_id is required', 400);
}

$stmt = $pdo->prepare("DELETE FROM collections WHERE id = :cid AND user_id = :uid");
$stmt->execute([':cid' => $collectionId, ':uid' => $user['id']]);

jsonResponse(true, null, 'Collection deleted successfully');
