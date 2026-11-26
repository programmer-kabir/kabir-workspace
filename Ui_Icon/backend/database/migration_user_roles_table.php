<?php
// backend/database/migration_user_roles_table.php
require_once __DIR__ . '/../config/database.php';

echo "=== Running Dynamic Roles & user_roles Table Migration ===\n\n";

// 1. Create `roles` table
$pdo->exec("
    CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table `roles` checked/created.\n";

// 2. Insert standard base & extensible roles
$baseRoles = [
    ['admin', 'Administrator', 'Full system access, manage icons, categories, users, and settings'],
    ['user', 'Standard User', 'Can browse, favorite, create collections, and download icons'],
    ['moderator', 'Moderator', 'Can review and moderate community submissions and flags'],
    ['editor', 'Editor', 'Can create, edit, and organize icon categories and content pages'],
    ['contributor', 'Contributor', 'Can upload and submit icons for review']
];

$roleStmt = $pdo->prepare("
    INSERT INTO roles (slug, name, description)
    VALUES (:slug, :name, :description)
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
");

foreach ($baseRoles as $r) {
    $roleStmt->execute([
        ':slug' => $r[0],
        ':name' => $r[1],
        ':description' => $r[2]
    ]);
}
echo "✓ Base roles seeded in `roles` table (admin, user, moderator, editor, contributor).\n";

// 3. Create `user_roles` table
$pdo->exec("
    CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        role_slug VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_role (user_id, role_id),
        KEY idx_user_id (user_id),
        KEY idx_role_slug (role_slug),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table `user_roles` checked/created.\n";

// 4. Fetch all available roles map (slug => id)
$rolesMap = $pdo->query("SELECT slug, id FROM roles")->fetchAll(PDO::FETCH_KEY_PAIR);

// 5. Populate user_roles for existing users
$users = $pdo->query("SELECT id, username, role, roles FROM users")->fetchAll(PDO::FETCH_ASSOC);

$insertUserRole = $pdo->prepare("
    INSERT IGNORE INTO user_roles (user_id, role_id, role_slug)
    VALUES (:user_id, :role_id, :role_slug)
");

foreach ($users as $u) {
    $userId = (int)$u['id'];
    $assignedRoles = [];

    // Parse roles
    if (!empty($u['roles'])) {
        $assignedRoles = array_map('trim', explode(',', $u['roles']));
    } elseif (!empty($u['role'])) {
        $assignedRoles = [$u['role']];
    } else {
        $assignedRoles = ['user'];
    }

    if (in_array('admin', $assignedRoles) && !in_array('user', $assignedRoles)) {
        $assignedRoles[] = 'user';
    }

    $assignedRoles = array_unique($assignedRoles);

    foreach ($assignedRoles as $rSlug) {
        $rSlug = strtolower(trim($rSlug));
        if (isset($rolesMap[$rSlug])) {
            $insertUserRole->execute([
                ':user_id' => $userId,
                ':role_id' => $rolesMap[$rSlug],
                ':role_slug' => $rSlug
            ]);
        }
    }
}
echo "✓ Successfully populated `user_roles` for all existing users.\n\n";

// Verify output
echo "=== Current user_roles Table Entries ===\n";
$userRolesList = $pdo->query("
    SELECT ur.user_id, u.username, ur.role_slug, r.name AS role_name
    FROM user_roles ur
    JOIN users u ON u.id = ur.user_id
    JOIN roles r ON r.id = ur.role_id
    ORDER BY ur.user_id ASC, ur.role_slug ASC
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($userRolesList as $row) {
    echo " - User [{$row['user_id']}] {$row['username']} -> {$row['role_slug']} ({$row['role_name']})\n";
}

echo "\nMigration finished successfully!\n";
