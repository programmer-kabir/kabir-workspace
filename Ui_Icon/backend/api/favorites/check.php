<?php
// backend/api/favorites/check.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = getAuthenticatedUser($pdo);
$iconId = isset($_GET['icon_id']) ? (int)$_GET['icon_id'] : 0;

if (!$user || $iconId <= 0) {
    jsonResponse(true, ['is_favorited' => false]);
}

$stmt = $pdo->prepare("SELECT id FROM favorites WHERE user_id = :uid AND icon_id = :iid LIMIT 1");
$stmt->execute([':uid' => $user['id'], ':iid' => $iconId]);
$favorited = (bool)$stmt->fetch();

jsonResponse(true, ['is_favorited' => $favorited]);
