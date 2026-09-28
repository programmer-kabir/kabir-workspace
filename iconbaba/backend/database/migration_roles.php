<?php
// backend/database/migration_roles.php
require_once __DIR__ . '/../config/database.php';

echo "=== Running Multiple Roles Migration ===\n\n";

$cols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('roles', $cols)) {
    $pdo->exec("ALTER TABLE users ADD COLUMN roles VARCHAR(255) NOT NULL DEFAULT 'user' AFTER role");
    echo "✓ Added 'roles' column to users table.\n";
} else {
    echo "✓ 'roles' column already exists.\n";
}

// Update existing users
$pdo->exec("UPDATE users SET roles = 'admin,user' WHERE role = 'admin'");
$pdo->exec("UPDATE users SET roles = 'user' WHERE role != 'admin' OR roles IS NULL OR roles = ''");

echo "✓ Updated user roles:\n";
$users = $pdo->query("SELECT id, username, email, role, roles FROM users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo " - [{$u['id']}] {$u['username']}: role='{$u['role']}', roles='{$u['roles']}'\n";
}

echo "\nMigration completed successfully.\n";
