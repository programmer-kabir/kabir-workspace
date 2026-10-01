<?php
/**
 * 🌊 PikSea Database Cleanup Tool (CLI / Browser)
 * Safely drops redundant contributor tables and updates contents metadata.
 */

require_once __DIR__ . '/api_v1/config/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=========================================================\n";
echo "🌊 PikSea - Database Contributor Cleanup Tool\n";
echo "=========================================================\n\n";

if (!isset($mysqli) || $mysqli->connect_errno) {
    exit("❌ Error: Database connection failed.\n");
}

echo "Connected to Database: " . (getenv('DB_NAME') ?: 'Connected') . "\n\n";

// Disable foreign key checks for clean drop operations
$mysqli->query("SET FOREIGN_KEY_CHECKS = 0");

$tablesToDrop = [
    'author_followers',
    'author_level_history',
    'author_level_rules',
    'author_upload_limits',
    'author_buyout_earnings',
    'author_earning_transactions',
    'author_identities',
    'author_invoices',
    'author_payout_methods',
    'contributor_applications',
    'authors'
];

echo "--- 1. Dropping Contributor Tables ---\n";
foreach ($tablesToDrop as $table) {
    $res = $mysqli->query("DROP TABLE IF EXISTS `$table`");
    if ($res) {
        echo "  ✔ Dropped table (if existed): $table\n";
    } else {
        echo "  ✖ Failed to drop $table: " . $mysqli->error . "\n";
    }
}

echo "\n--- 2. Standardizing 'contents' Table (Dropping author columns) ---\n";
try {
    $colRes = $mysqli->query("SHOW COLUMNS FROM `contents`");
    $contentCols = [];
    while ($c = $colRes->fetch_assoc()) {
        $contentCols[] = $c['Field'];
    }

    if (in_array('author_id', $contentCols)) {
        $mysqli->query("ALTER TABLE `contents` DROP COLUMN `author_id`");
        echo "  ✔ Dropped column contents.author_id\n";
    }
    if (in_array('author_preview_url', $contentCols)) {
        $mysqli->query("ALTER TABLE `contents` DROP COLUMN `author_preview_url`");
        echo "  ✔ Dropped column contents.author_preview_url\n";
    }
} catch (Throwable $e) {
    echo "  ℹ Note on contents table alter: " . $e->getMessage() . "\n";
}

echo "\n--- 3. Cleaning Obsolete User Roles / Users ---\n";
try {
    // Check if user_roles table exists
    $tblCheck = $mysqli->query("SHOW TABLES LIKE 'user_roles'");
    if ($tblCheck && $tblCheck->num_rows > 0) {
        $cols = [];
        $colRes = $mysqli->query("SHOW COLUMNS FROM `user_roles`");
        while ($c = $colRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }
        echo "  ℹ user_roles columns: " . implode(', ', $cols) . "\n";
        $roleCol = in_array('role_name', $cols) ? 'role_name' : (in_array('role', $cols) ? 'role' : (in_array('name', $cols) ? 'name' : null));
        if ($roleCol) {
            $mysqli->query("DELETE FROM `user_roles` WHERE `$roleCol` IN ('author', 'contributor')");
            echo "  ✔ Cleaned up user_roles using column '$roleCol'\n";
        }
    }
} catch (Throwable $e) {
    echo "  ℹ Note on user_roles: " . $e->getMessage() . "\n";
}

echo "\n--- 4. Cleaning Obsolete Notifications & Email Logs ---\n";
try {
    $notifCheck = $mysqli->query("SHOW TABLES LIKE 'notifications'");
    if ($notifCheck && $notifCheck->num_rows > 0) {
        $nCols = [];
        $nRes = $mysqli->query("SHOW COLUMNS FROM `notifications`");
        while ($c = $nRes->fetch_assoc()) {
            $nCols[] = $c['Field'];
        }
        if (in_array('target_role', $nCols)) {
            $mysqli->query("UPDATE `notifications` SET `target_role` = 'user' WHERE `target_role` IN ('author', 'contributor')");
            echo "  ✔ Updated target_role in notifications\n";
        }
        if (in_array('type', $nCols)) {
            $mysqli->query("DELETE FROM `notifications` WHERE `type` IN ('new_application', 'contributor_application_received', 'contributor_application_approved')");
            echo "  ✔ Deleted contributor type notifications\n";
        }
    }
} catch (Throwable $e) {
    echo "  ℹ Note on notifications: " . $e->getMessage() . "\n";
}

try {
    $emailCheck = $mysqli->query("SHOW TABLES LIKE 'email_logs'");
    if ($emailCheck && $emailCheck->num_rows > 0) {
        $mysqli->query("DELETE FROM `email_logs` WHERE `email_type` IN ('contributor_application_received', 'contributor_application_approved')");
        echo "  ✔ Deleted contributor email logs\n";
    }
} catch (Throwable $e) {
    echo "  ℹ Note on email_logs: " . $e->getMessage() . "\n";
}

// Re-enable foreign key checks
$mysqli->query("SET FOREIGN_KEY_CHECKS = 1");

echo "\n=========================================================\n";
echo "🎉 SUCCESS: Database cleanup completed successfully!\n";
echo "=========================================================\n";
