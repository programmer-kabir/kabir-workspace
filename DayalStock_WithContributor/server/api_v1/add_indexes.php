<?php
require_once __DIR__ . '/config/db.php';

try {
    // Check if index exists on categories
    $result = $mysqli->query("SHOW INDEX FROM categories WHERE Key_name = 'idx_category_slug'");
    if ($result->num_rows == 0) {
        $mysqli->query("ALTER TABLE categories ADD INDEX idx_category_slug (slug)");
        echo "Added index to categories.slug\n";
    }

    // Check if index exists on contents/assets table
    $table = '';
    $res = $mysqli->query("SHOW TABLES LIKE 'contents'");
    if ($res->num_rows > 0) $table = 'contents';
    else {
        $res = $mysqli->query("SHOW TABLES LIKE 'assets'");
        if ($res->num_rows > 0) $table = 'assets';
    }

    if ($table) {
        $result = $mysqli->query("SHOW INDEX FROM $table WHERE Key_name = 'idx_content_slug'");
        if ($result->num_rows == 0) {
            $mysqli->query("ALTER TABLE $table ADD INDEX idx_content_slug (slug)");
            echo "Added index to $table.slug\n";
        }
    } else {
        echo "Could not find contents or assets table.\n";
    }

    echo "Indexing complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
