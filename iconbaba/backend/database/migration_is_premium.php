<?php
// backend/database/migration_is_premium.php
require_once __DIR__ . '/../config/database.php';

echo "Running is_premium Migration...\n";

// 1. Check if is_premium column exists in icons
$cols = $pdo->query("SHOW COLUMNS FROM icons")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('is_premium', $cols)) {
    $pdo->exec("ALTER TABLE icons ADD COLUMN is_premium TINYINT(1) NOT NULL DEFAULT 0 AFTER status");
    $pdo->exec("ALTER TABLE icons ADD INDEX idx_is_premium (is_premium)");
    echo "✓ Added `is_premium` column to `icons` table.\n";
} else {
    echo "✓ `is_premium` column already exists.\n";
}

// 2. Set some icons as Pro/Premium for demonstration (e.g., roughly 20% of icons: id % 5 = 0)
// This gives a realistic mix of free and pro icons
$countUpdated = $pdo->exec("UPDATE icons SET is_premium = 1 WHERE (id % 5 = 0)");
echo "✓ Set {$countUpdated} icons as PRO (is_premium = 1).\n";

$totalIcons = (int)$pdo->query("SELECT COUNT(*) FROM icons")->fetchColumn();
$proIcons = (int)$pdo->query("SELECT COUNT(*) FROM icons WHERE is_premium = 1")->fetchColumn();
$freeIcons = (int)$pdo->query("SELECT COUNT(*) FROM icons WHERE is_premium = 0")->fetchColumn();

echo "Summary:\n";
echo "  Total Icons: {$totalIcons}\n";
echo "  Free Icons: {$freeIcons}\n";
echo "  Pro Icons: {$proIcons}\n";
echo "Migration complete!\n";
