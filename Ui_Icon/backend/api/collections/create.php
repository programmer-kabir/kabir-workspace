<?php
// backend/api/collections/create.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$user = requireAuth($pdo);
$input = getJsonInput();
$name = sanitizeString($input['name'] ?? '');
$description = sanitizeString($input['description'] ?? '');
$isPublic = !empty($input['is_public']) ? 1 : 0;

if (empty($name)) {
    jsonResponse(false, null, 'Collection name is required', 400);
}

$stmt = $pdo->prepare("
    INSERT INTO collections (user_id, name, description, is_public)
    VALUES (:uid, :name, :description, :is_public)
");
$stmt->execute([
    ':uid' => $user['id'],
    ':name' => $name,
    ':description' => $description,
    ':is_public' => $isPublic
]);

$collectionId = (int)$pdo->lastInsertId();

jsonResponse(true, [
    'collection' => [
        'id' => $collectionId,
        'name' => $name,
        'description' => $description,
        'is_public' => (bool)$isPublic,
        'items_count' => 0
    ]
], 'Collection created successfully', 201);
