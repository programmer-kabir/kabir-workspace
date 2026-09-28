<?php
// backend/database/migration_admin_panel.php
// Migration for Full Admin Panel

require_once __DIR__ . '/../config/database.php';

echo "=== Running Admin Panel Database Migration ===\n\n";

// 1. Update icons table
$iconCols = $pdo->query("SHOW COLUMNS FROM icons")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('status', $iconCols)) {
    $pdo->exec("ALTER TABLE icons ADD COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published' AFTER tags, ADD INDEX idx_status (status)");
    echo "✓ Added 'status' to icons table.\n";
}

if (!in_array('updated_at', $iconCols)) {
    $pdo->exec("ALTER TABLE icons ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    echo "✓ Added 'updated_at' to icons table.\n";
}

if (!in_array('created_by', $iconCols)) {
    $pdo->exec("ALTER TABLE icons ADD COLUMN created_by INT NULL AFTER updated_at, ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
    echo "✓ Added 'created_by' to icons table.\n";
}

// 2. Update categories table
$catCols = $pdo->query("SHOW COLUMNS FROM categories")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('status', $catCols)) {
    $pdo->exec("ALTER TABLE categories ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER display_order, ADD INDEX idx_status (status)");
    echo "✓ Added 'status' to categories table.\n";
}

if (!in_array('description', $catCols)) {
    $pdo->exec("ALTER TABLE categories ADD COLUMN description TEXT NULL AFTER status");
    echo "✓ Added 'description' to categories table.\n";
}

if (!in_array('updated_at', $catCols)) {
    $pdo->exec("ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    echo "✓ Added 'updated_at' to categories table.\n";
}

// 3. Update users table
$userCols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('status', $userCols)) {
    $pdo->exec("ALTER TABLE users ADD COLUMN status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER role, ADD INDEX idx_status (status)");
    echo "✓ Added 'status' to users table.\n";
}

// 4. Create admin_audit_logs table
$pdo->exec("
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table 'admin_audit_logs' ready.\n";

// 5. Create storage directory for icon uploads if needed
$uploadsDir = __DIR__ . '/../uploads/icons';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
    echo "✓ Created uploads directory: backend/uploads/icons\n";
}

echo "\n=== Admin Panel Migration Completed Successfully! ===\n";
