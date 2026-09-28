<?php
// backend/api/downloads/log.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$user = getAuthenticatedUser($pdo);
$input = getJsonInput();
$iconId = isset($input['icon_id']) ? (int)$input['icon_id'] : 0;
$format = isset($input['format']) ? strtolower(trim($input['format'])) : 'svg';
if ($format !== 'svg' && $format !== 'png') {
    $format = 'svg';
}
$size = isset($input['size']) ? (int)$input['size'] : 24;

if ($iconId <= 0) {
    jsonResponse(false, null, 'Valid icon_id is required', 400);
}

// Increment downloads count on the icon
$update = $pdo->prepare("UPDATE icons SET downloads_count = downloads_count + 1 WHERE id = :id");
$update->execute([':id' => $iconId]);

// If user is authenticated, log into downloads history table
if ($user) {
    $stmt = $pdo->prepare("
        INSERT INTO downloads (user_id, icon_id, format, size)
        VALUES (:uid, :iid, :fmt, :sz)
    ");
    $stmt->execute([
        ':uid' => $user['id'],
        ':iid' => $iconId,
        ':fmt' => $format,
        ':sz' => $size
    ]);
}

jsonResponse(true, null, 'Download logged successfully');
