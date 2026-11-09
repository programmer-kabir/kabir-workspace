<?php
// migrate_bondok_schema.php
// Safe and idempotent migration for Bondok / Mortgage support in SupplyLink
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
guardManagerAdminOnly();

header("Content-Type: application/json; charset=UTF-8");

try {
    @$mysqli->query("SET time_zone = '+06:00'");

    $messages = [];

    // Helper function to add column if not exists
    function addColumnIfNotExists($mysqli, $table, $column, $definition, &$messages) {
        $check = $mysqli->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
        if ($check && $check->num_rows === 0) {
            $alterSql = "ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}";
            if ($mysqli->query($alterSql)) {
                $messages[] = "Added column `{$column}` to `{$table}`";
            } else {
                $messages[] = "Failed adding `{$column}` to `{$table}`: " . $mysqli->error;
            }
        } else {
            $messages[] = "Column `{$column}` already exists in `{$table}`";
        }
    }

    // 1. Update `other_assets` table
    addColumnIfNotExists($mysqli, 'other_assets', 'owner_name', 'VARCHAR(150) NULL AFTER `vendor_info`', $messages);
    addColumnIfNotExists($mysqli, 'other_assets', 'owner_mobile', 'VARCHAR(30) NULL AFTER `owner_name`', $messages);
    addColumnIfNotExists($mysqli, 'other_assets', 'owner_nid', 'VARCHAR(50) NULL AFTER `owner_mobile`', $messages);
    addColumnIfNotExists($mysqli, 'other_assets', 'property_address', 'TEXT NULL AFTER `owner_nid`', $messages);
    addColumnIfNotExists($mysqli, 'other_assets', 'deed_no', 'VARCHAR(100) NULL AFTER `property_address`', $messages);
    addColumnIfNotExists($mysqli, 'other_assets', 'is_bondok', 'TINYINT(1) DEFAULT 0 AFTER `deed_no`', $messages);

    // 2. Update `other_asset_agreements` table
    addColumnIfNotExists($mysqli, 'other_asset_agreements', 'agreement_nature', "VARCHAR(50) DEFAULT 'owner_leaseback' AFTER `agreement_type`", $messages);
    addColumnIfNotExists($mysqli, 'other_asset_agreements', 'tenure_type', "VARCHAR(50) DEFAULT 'until_refund' AFTER `agreement_nature`", $messages);
    addColumnIfNotExists($mysqli, 'other_asset_agreements', 'min_lockin_months', "INT DEFAULT 12 AFTER `tenure_type`", $messages);
    addColumnIfNotExists($mysqli, 'other_asset_agreements', 'notice_days', "INT DEFAULT 30 AFTER `min_lockin_months`", $messages);

    // 3. Ensure cash_categories has bondok categories
    $mysqli->query("
        INSERT IGNORE INTO `cash_categories` (`slug`, `name_bn`, `name_en`, `type`, `is_company_expense`, `allowed_roles`, `color_bg`, `color_text`, `color_border`, `icon`, `status`)
        VALUES 
        ('bondok_capital_out', 'বন্ধকি মূলধন প্রদান', 'Bondok Capital Out', 'out', 0, 'admin,developer,manager', 'bg-amber-500/15', 'text-amber-400', 'border-amber-500/30', 'FaHandshake', 'active'),
        ('bondok_capital_return', 'বন্ধক খালাস মূলধন ফেরত', 'Bondok Capital Return', 'in', 0, 'admin,developer,manager', 'bg-emerald-500/15', 'text-emerald-400', 'border-emerald-500/30', 'FaUndoAlt', 'active')
    ");

    echo json_encode([
        "success"  => true,
        "message"  => "Bondok schema migration completed successfully",
        "details"  => $messages
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

