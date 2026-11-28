<?php
declare(strict_types=1);

/**
 * SUNAM SHOP — Database Migration & UTF-8 Seeder Runner
 * Ensures 100% accurate UTF-8 encoding for Bengali characters.
 */

$host = '127.0.0.1';
$port = 3306;
$dbName = 'sunam_shop';
$user = 'root';
$pass = '';

echo "Connecting to MySQL at {$host}:{$port}...\n";

// 1. Connect without db to ensure database exists
$rootPdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
]);

$rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

// 2. Connect to sunam_shop with utf8mb4
$pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
]);

echo "Importing schema.sql with UTF-8...\n";
$schemaSql = file_get_contents(__DIR__ . '/schema.sql');
$pdo->exec($schemaSql);
echo "✓ Schema imported successfully.\n";

echo "Importing seed.sql with UTF-8...\n";
$seedSql = file_get_contents(__DIR__ . '/seed.sql');
$pdo->exec($seedSql);
echo "✓ Seed data imported successfully.\n";

// 3. Verify Bengali text from categories and zones
echo "\nVerifying Bengali characters:\n";
$stmt = $pdo->query("SELECT id, name_bn, name_en FROM categories ORDER BY display_order ASC LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [Category {$row['id']}] {$row['name_bn']} ({$row['name_en']})\n";
}

$zoneStmt = $pdo->query("SELECT id, zone_name_bn, delivery_charge FROM delivery_zones");
while ($row = $zoneStmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [Zone {$row['id']}] {$row['zone_name_bn']} — ৳{$row['delivery_charge']}\n";
}

echo "\nMigration & UTF-8 verification complete!\n";
