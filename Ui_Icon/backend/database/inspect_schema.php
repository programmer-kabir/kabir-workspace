<?php
// backend/database/inspect_schema.php
require_once __DIR__ . '/../config/database.php';

$tables = ['icons', 'icon_variants', 'categories', 'users', 'downloads', 'favorites', 'collections', 'pricing_plans', 'faq_items', 'contact_messages'];
$info = [];

foreach ($tables as $t) {
    try {
        $cols = $pdo->query("DESCRIBE {$t}")->fetchAll(PDO::FETCH_ASSOC);
        $info[$t] = array_map(function($c) {
            return $c['Field'] . ' (' . $c['Type'] . ')';
        }, $cols);
    } catch (Exception $e) {
        $info[$t] = 'Error: ' . $e->getMessage();
    }
}

echo json_encode($info, JSON_PRETTY_PRINT);
