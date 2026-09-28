<?php
// backend/api/admin/roles/create.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);
$data = getJsonInput();

$name = trim($data['name'] ?? '');
$slug = strtolower(trim($data['slug'] ?? ''));
$description = trim($data['description'] ?? '');

if (empty($name)) {
    jsonResponse(false, null, 'Role name is required.', 400);
}

if (empty($slug)) {
    // Generate slug from name
    $slug = strtolower(preg_replace('/[^a-z0-9_-]+/i', '_', $name));
}

if (!preg_match('/^[a-z0-9_-]{2,50}$/', $slug)) {
    jsonResponse(false, null, 'Role slug must be 2-50 lowercase alphanumeric characters, dashes or underscores.', 400);
}

// Check if slug already exists
$checkStmt = $pdo->prepare("SELECT id FROM roles WHERE slug = :slug");
$checkStmt->execute([':slug' => $slug]);
if ($checkStmt->fetch()) {
    jsonResponse(false, null, "Role with slug '{$slug}' already exists.", 409);
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO roles (slug, name, description)
        VALUES (:slug, :name, :description)
    ");
    $stmt->execute([
        ':slug' => $slug,
        ':name' => $name,
        ':description' => $description ?: "Role: {$name}"
    ]);
    $roleId = (int)$pdo->lastInsertId();

    logAdminAction($pdo, $admin['id'], 'create_role', 'role', $roleId, [
        'name' => $name,
        'slug' => $slug
    ]);

    jsonResponse(true, [
        'id' => $roleId,
        'slug' => $slug,
        'name' => $name,
        'description' => $description,
        'users_count' => 0
    ], 'Role created successfully.', 201);

} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to create role: ' . $e->getMessage(), 500);
}
