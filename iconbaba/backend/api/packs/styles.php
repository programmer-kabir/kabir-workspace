<?php
// backend/api/packs/styles.php
// Returns available icon styles configured in the system

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

try {
    $stmt = $pdo->query("SELECT slug, name, is_multicolor, supports_stroke_edit, display_order FROM icon_styles ORDER BY display_order ASC");
    $styles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($st) {
        return [
            'slug' => $st['slug'],
            'name' => $st['name'],
            'is_multicolor' => (bool)$st['is_multicolor'],
            'supports_stroke_edit' => (bool)$st['supports_stroke_edit'],
            'display_order' => (int)$st['display_order']
        ];
    }, $styles);

    jsonResponse(true, $formatted, 'Styles retrieved successfully.');
} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to fetch styles: ' . $e->getMessage(), 500);
}
