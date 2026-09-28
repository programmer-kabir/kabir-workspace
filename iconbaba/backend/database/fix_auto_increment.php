<?php
// backend/database/fix_auto_increment.php
// Fixes missing PRIMARY KEY and AUTO_INCREMENT on all MySQL tables

require_once __DIR__ . '/../config/database.php';

header('Content-Type: text/plain; charset=utf-8');
echo "=== IconBaba Database Primary Key & AUTO_INCREMENT Fixer ===\n\n";

$tables = [
    'icons',
    'icon_variants',
    'categories',
    'admin_audit_logs',
    'collections',
    'collection_items',
    'contact_messages',
    'content_pages',
    'content_page_revisions',
    'daily_export_usage',
    'downloads',
    'faq_items',
    'favorites',
    'login_attempts',
    'payments',
    'pricing_plans',
    'roles',
    'subscriptions',
    'tags',
    'users'
];

foreach ($tables as $table) {
    try {
        // 1. Delete accidental row where id = 0 from failed insert
        $pdo->exec("DELETE FROM `{$table}` WHERE `id` = 0");

        // 2. Check if table already has a PRIMARY KEY
        $pk = $pdo->query("SHOW KEYS FROM `{$table}` WHERE Key_name = 'PRIMARY'")->fetch();

        if (!$pk) {
            // Add PRIMARY KEY first if missing
            $pdo->exec("ALTER TABLE `{$table}` ADD PRIMARY KEY (`id`)");
            echo "✓ Added PRIMARY KEY to [{$table}]\n";
        }

        // 3. Enable AUTO_INCREMENT on id column
        $pdo->exec("ALTER TABLE `{$table}` MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT");
        echo "✓ Successfully enabled AUTO_INCREMENT on [{$table}]\n";

    } catch (Exception $e) {
        echo "Notice on [{$table}]: " . $e->getMessage() . "\n";
    }
}

echo "\n=== All tables updated! Your database is now completely fixed. ===\n";
