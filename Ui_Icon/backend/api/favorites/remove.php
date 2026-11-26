<?php
// backend/api/favorites/remove.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$user = requireAuth($pdo);
$input = getJsonInput();
$iconId = isset($input['icon_id']) ? (int)$input['icon_id'] : 0;

if ($iconId <= 0) {
    jsonResponse(false, null, 'Valid icon_id is required', 400);
}

$stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = :uid AND icon_id = :iid");
$stmt->execute([':uid' => $user['id'], ':iid' => $iconId]);

// Update favorites_count on icon
$update = $pdo->prepare("
    UPDATE icons SET favorites_count = (
        SELECT COUNT(*) FROM favorites WHERE icon_id = :id1
    ) WHERE id = :id2
");
$update->execute([':id1' => $iconId, ':id2' => $iconId]);

jsonResponse(true, ['is_favorited' => false], 'Icon removed from favorites');
