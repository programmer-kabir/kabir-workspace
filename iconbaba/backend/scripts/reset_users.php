<?php
// backend/scripts/reset_users.php
// Reset all users and set up exactly 2 users:
// 1. Admin: iconbaba.com@gmail.com / 123456 (admin role)
// 2. User: user@gmail.com / 123456 (user role)

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth.php';

echo "Cleaning existing users...\n";

// Disable foreign key checks momentarily to truncate or delete cleanly
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("DELETE FROM user_sessions");
$pdo->exec("DELETE FROM user_roles");
$pdo->exec("DELETE FROM subscriptions");
$pdo->exec("DELETE FROM payments");
$pdo->exec("DELETE FROM favorites");
$pdo->exec("DELETE FROM collections");
$pdo->exec("DELETE FROM users");
$pdo->exec("ALTER TABLE users AUTO_INCREMENT = 1");
$pdo->exec("ALTER TABLE user_roles AUTO_INCREMENT = 1");
$pdo->exec("ALTER TABLE subscriptions AUTO_INCREMENT = 1");
$pdo->exec("ALTER TABLE payments AUTO_INCREMENT = 1");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "Inserting Admin user...\n";
$adminPassHash = password_hash('123456', PASSWORD_BCRYPT);
$stmt = $pdo->prepare("
    INSERT INTO users (id, username, email, password_hash, full_name, status, created_at, updated_at)
    VALUES (1, 'iconbaba', 'iconbaba.com@gmail.com', :pwd, 'IconBaba Admin', 'active', NOW(), NOW())
");
$stmt->execute([':pwd' => $adminPassHash]);

echo "Inserting Regular user...\n";
$userPassHash = password_hash('123456', PASSWORD_BCRYPT);
$stmt = $pdo->prepare("
    INSERT INTO users (id, username, email, password_hash, full_name, status, created_at, updated_at)
    VALUES (2, 'user', 'user@gmail.com', :pwd, 'Regular User', 'active', NOW(), NOW())
");
$stmt->execute([':pwd' => $userPassHash]);

echo "Assigning roles in user_roles...\n";
// Ensure roles exist in roles table
$pdo->exec("INSERT IGNORE INTO roles (id, slug, name, description) VALUES (1, 'admin', 'Administrator', 'Full system access')");
$pdo->exec("INSERT IGNORE INTO roles (id, slug, name, description) VALUES (2, 'user', 'Standard User', 'Can browse and download icons')");

// Assign roles: User 1 -> admin & user
$pdo->exec("INSERT INTO user_roles (user_id, role_id, role_slug) VALUES (1, 1, 'admin')");
$pdo->exec("INSERT INTO user_roles (user_id, role_id, role_slug) VALUES (1, 2, 'user')");

// Assign roles: User 2 -> user only
$pdo->exec("INSERT INTO user_roles (user_id, role_id, role_slug) VALUES (2, 2, 'user')");

echo "\nVerification:\n";
$users = $pdo->query("
    SELECT u.id, u.username, u.email, u.full_name, u.status,
           (SELECT GROUP_CONCAT(ur.role_slug) FROM user_roles ur WHERE ur.user_id = u.id) AS roles
    FROM users u
")->fetchAll(PDO::FETCH_ASSOC);

print_r($users);
echo "\nDone! Successfully reset to exactly 2 users.\n";
