<?php
// backend/database/cleanup_fake_filled_variants.php
// Removes dummy duplicate 'filled' rows where the SVG was simply copied from 'outlined'.

require_once __DIR__ . '/../config/database.php';

try {
    $pdo->beginTransaction();

    $sql = "
        DELETE iv_filled
        FROM icon_variants iv_filled
        JOIN icon_variants iv_outline 
          ON iv_filled.icon_id = iv_outline.icon_id 
         AND iv_outline.style = 'outlined'
        WHERE iv_filled.style = 'filled' 
          AND iv_filled.svg_content = iv_outline.svg_content
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $deleted = $stmt->rowCount();

    $pdo->commit();

    echo "Successfully removed {$deleted} dummy duplicate filled rows.\n";

    // Summary count
    $counts = $pdo->query("SELECT style, COUNT(*) as total FROM icon_variants GROUP BY style")->fetchAll();
    echo "\nCurrent database status:\n";
    foreach ($counts as $c) {
        echo "  - {$c['style']}: {$c['total']}\n";
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
}
