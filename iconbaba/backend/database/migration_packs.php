<?php
// backend/database/migration_packs.php
// Migration for Flaticon Pack & Style Model (Category -> Pack -> Variant/Style -> Single Icon)

require_once __DIR__ . '/../config/database.php';

header('Content-Type: text/plain; charset=utf-8');
echo "=== Starting Flaticon Pack Model Migration ===\n\n";

try {
    // 1. Create icon_styles table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `icon_styles` (
        `slug` VARCHAR(32) NOT NULL,
        `name` VARCHAR(50) NOT NULL,
        `is_multicolor` TINYINT(1) NOT NULL DEFAULT 0,
        `supports_stroke_edit` TINYINT(1) NOT NULL DEFAULT 1,
        `display_order` INT(11) NOT NULL DEFAULT 0,
        PRIMARY KEY (`slug`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✓ Table [icon_styles] created or verified.\n";

    // Seed icon_styles
    $styles = [
        ['slug' => 'outlined', 'name' => 'Lineal / Outlined', 'is_multicolor' => 0, 'supports_stroke_edit' => 1, 'display_order' => 1],
        ['slug' => 'filled', 'name' => 'Solid / Filled', 'is_multicolor' => 0, 'supports_stroke_edit' => 0, 'display_order' => 2],
        ['slug' => 'lineal-color', 'name' => 'Lineal Color', 'is_multicolor' => 1, 'supports_stroke_edit' => 1, 'display_order' => 3],
        ['slug' => 'flat', 'name' => 'Flat Color', 'is_multicolor' => 1, 'supports_stroke_edit' => 0, 'display_order' => 4],
        ['slug' => 'gradient', 'name' => 'Gradient', 'is_multicolor' => 1, 'supports_stroke_edit' => 0, 'display_order' => 5],
    ];

    $stmtStyle = $pdo->prepare("INSERT INTO `icon_styles` (`slug`, `name`, `is_multicolor`, `supports_stroke_edit`, `display_order`)
        VALUES (:slug, :name, :is_multicolor, :supports_stroke_edit, :display_order)
        ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `is_multicolor` = VALUES(`is_multicolor`), `supports_stroke_edit` = VALUES(`supports_stroke_edit`), `display_order` = VALUES(`display_order`)");

    foreach ($styles as $st) {
        $stmtStyle->execute($st);
    }
    echo "✓ Seeded 5 standard styles into [icon_styles].\n";

    // 2. Create packs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `packs` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `category_id` INT(11) NOT NULL,
        `family_slug` VARCHAR(100) DEFAULT NULL,
        `name` VARCHAR(120) NOT NULL,
        `slug` VARCHAR(140) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `tags` TEXT DEFAULT NULL,
        `primary_style` VARCHAR(32) NOT NULL DEFAULT 'outlined',
        `author_name` VARCHAR(100) NOT NULL DEFAULT 'IconBaba Studio',
        `is_premium` TINYINT(1) NOT NULL DEFAULT 0,
        `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
        `icon_count` INT(11) NOT NULL DEFAULT 0,
        `downloads_count` INT(11) NOT NULL DEFAULT 0,
        `favorites_count` INT(11) NOT NULL DEFAULT 0,
        `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
        `created_by` INT(11) DEFAULT 1,
        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `uniq_pack_slug` (`slug`),
        KEY `idx_packs_category` (`category_id`),
        KEY `idx_packs_status` (`status`),
        KEY `idx_packs_featured` (`is_featured`),
        KEY `idx_packs_primary_style` (`primary_style`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✓ Table [packs] created or verified.\n";

    // 3. Update categories table (add pack_count column)
    $catCols = $pdo->query("SHOW COLUMNS FROM `categories` LIKE 'pack_count'")->fetchAll();
    if (empty($catCols)) {
        $pdo->exec("ALTER TABLE `categories` ADD COLUMN `pack_count` INT(11) NOT NULL DEFAULT 0 AFTER `icon_count`");
        echo "✓ Added [pack_count] column to [categories].\n";
    }

    // 4. Update icons table (add pack_id, sort_order, default_style)
    $iconCols = $pdo->query("SHOW COLUMNS FROM `icons` LIKE 'pack_id'")->fetchAll();
    if (empty($iconCols)) {
        $pdo->exec("ALTER TABLE `icons` ADD COLUMN `pack_id` INT(11) NULL AFTER `category_id`");
        $pdo->exec("ALTER TABLE `icons` ADD KEY `idx_icons_pack_id` (`pack_id`)");
        echo "✓ Added [pack_id] column to [icons].\n";
    }

    $sortCols = $pdo->query("SHOW COLUMNS FROM `icons` LIKE 'sort_order'")->fetchAll();
    if (empty($sortCols)) {
        $pdo->exec("ALTER TABLE `icons` ADD COLUMN `sort_order` INT(11) NOT NULL DEFAULT 0 AFTER `pack_id`");
        echo "✓ Added [sort_order] column to [icons].\n";
    }

    $defaultStyleCols = $pdo->query("SHOW COLUMNS FROM `icons` LIKE 'default_style'")->fetchAll();
    if (empty($defaultStyleCols)) {
        $pdo->exec("ALTER TABLE `icons` ADD COLUMN `default_style` VARCHAR(32) NOT NULL DEFAULT 'outlined' AFTER `sort_order`");
        echo "✓ Added [default_style] column to [icons].\n";
    }

    // 5. Update icon_variants table (expand style to VARCHAR(32), add is_multicolor, palette_json)
    $pdo->exec("ALTER TABLE `icon_variants` MODIFY `style` VARCHAR(32) NOT NULL DEFAULT 'outlined'");
    echo "✓ Widen [style] in [icon_variants] to VARCHAR(32).\n";

    $multiCols = $pdo->query("SHOW COLUMNS FROM `icon_variants` LIKE 'is_multicolor'")->fetchAll();
    if (empty($multiCols)) {
        $pdo->exec("ALTER TABLE `icon_variants` ADD COLUMN `is_multicolor` TINYINT(1) NOT NULL DEFAULT 0 AFTER `style`");
        echo "✓ Added [is_multicolor] column to [icon_variants].\n";
    }

    $palCols = $pdo->query("SHOW COLUMNS FROM `icon_variants` LIKE 'palette_json'")->fetchAll();
    if (empty($palCols)) {
        $pdo->exec("ALTER TABLE `icon_variants` ADD COLUMN `palette_json` TEXT NULL AFTER `is_multicolor`");
        echo "✓ Added [palette_json] column to [icon_variants].\n";
    }

    // 6. Create pack_downloads table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `pack_downloads` (
        `id` INT(11) NOT NULL AUTO_INCREMENT,
        `pack_id` INT(11) NOT NULL,
        `user_id` INT(11) DEFAULT NULL,
        `ip_address` VARCHAR(45) DEFAULT NULL,
        `style` VARCHAR(32) NOT NULL DEFAULT 'all',
        `format` VARCHAR(10) NOT NULL DEFAULT 'svg',
        `downloaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_pack_dl_pack` (`pack_id`),
        KEY `idx_pack_dl_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "✓ Table [pack_downloads] created or verified.\n";

    // 7. Backfill existing orphaned icons into default packs per category
    $orphanIcons = $pdo->query("SELECT id, category_id, name FROM icons WHERE pack_id IS NULL OR pack_id = 0")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($orphanIcons)) {
        echo "Found " . count($orphanIcons) . " icons needing pack assignment...\n";

        // Group by category_id
        $catGroup = [];
        foreach ($orphanIcons as $ico) {
            $catId = (int)$ico['category_id'];
            $catGroup[$catId][] = (int)$ico['id'];
        }

        foreach ($catGroup as $catId => $iconIds) {
            // Get category info
            $catStmt = $pdo->prepare("SELECT name, slug FROM categories WHERE id = ?");
            $catStmt->execute([$catId]);
            $category = $catStmt->fetch(PDO::FETCH_ASSOC);

            $catName = $category ? $category['name'] : 'General';
            $catSlug = $category ? $category['slug'] : 'general';

            $packName = $catName . " Essential Pack";
            $packSlug = $catSlug . "-essential-pack";

            // Find or create pack
            $checkPack = $pdo->prepare("SELECT id FROM packs WHERE slug = ?");
            $checkPack->execute([$packSlug]);
            $packId = $checkPack->fetchColumn();

            if (!$packId) {
                $insPack = $pdo->prepare("INSERT INTO packs (category_id, name, slug, description, tags, primary_style, is_featured, status)
                    VALUES (?, ?, ?, ?, ?, 'outlined', 1, 'published')");
                $insPack->execute([
                    $catId,
                    $packName,
                    $packSlug,
                    "A curated collection of essential {$catName} icons crafted for web and mobile interfaces.",
                    "{$catSlug}, essential, icons, flaticon, pack"
                ]);
                $packId = (int)$pdo->lastInsertId();
                echo "✓ Created starter pack [{$packName}] (ID: {$packId}).\n";
            }

            // Assign icons to pack
            $inClause = implode(',', array_map('intval', $iconIds));
            $pdo->exec("UPDATE icons SET pack_id = {$packId} WHERE id IN ({$inClause})");
            echo "✓ Assigned " . count($iconIds) . " icons to pack ID {$packId}.\n";
        }
    } else {
        echo "✓ All icons are already assigned to packs.\n";
    }

    // 8. Sync counts (icon_count in packs, pack_count in categories, icon_count in categories)
    $pdo->exec("UPDATE packs p SET icon_count = (SELECT COUNT(*) FROM icons i WHERE i.pack_id = p.id AND i.status = 'published')");
    $pdo->exec("UPDATE categories c SET 
        pack_count = (SELECT COUNT(*) FROM packs p WHERE p.category_id = c.id AND p.status = 'published'),
        icon_count = (SELECT COUNT(*) FROM icons i WHERE i.category_id = c.id AND i.status = 'published')");
    echo "✓ Recalculated pack_count and icon_count across packs and categories.\n";

    echo "\n=== Migration Completed Successfully! ===\n";

} catch (Exception $e) {
    echo "\n[ERROR]: " . $e->getMessage() . "\n";
    exit(1);
}
