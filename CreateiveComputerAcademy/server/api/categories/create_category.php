<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'category_helper.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

ensureCategoryTableExists($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || empty(trim($data->name))) {
    echo json_encode(["status" => "error", "message" => "Category name is required."]);
    exit;
}

try {
    $name = trim($data->name);
    $parent_id = !empty($data->parent_id) ? (int)$data->parent_id : null;
    $level = !empty($data->level) ? $data->level : ($parent_id ? 'subcategory' : 'category');
    $icon = !empty($data->icon) ? trim($data->icon) : ($level === 'category' ? '🎨' : ($level === 'subcategory' ? '📁' : '🏷️'));
    $color = !empty($data->color) ? trim($data->color) : 'from-blue-500 to-indigo-600';
    $estimated_minutes = !empty($data->estimated_minutes) ? (int)$data->estimated_minutes : 120;
    if ($level === 'child') {
        // Child categories inherit from parent subcategory by default unless explicitly specified
        $credit = (isset($data->credit) && $data->credit !== '' && (int)$data->credit > 0) ? (int)$data->credit : null;
    } else {
        // Subcategories and main categories default to 5 if not specified
        $credit = (isset($data->credit) && $data->credit !== '' && (int)$data->credit > 0) ? (int)$data->credit : 5;
    }
    
    $checklists = null;
    if (isset($data->checklists) && is_array($data->checklists)) {
        $checklists = json_encode(array_values(array_filter($data->checklists)), JSON_UNESCAPED_UNICODE);
    }
    
    $specs = null;
    if (isset($data->specs) && is_array($data->specs)) {
        $specs = json_encode($data->specs, JSON_UNESCAPED_UNICODE);
    }

    $slug = makeCategorySlug($name . '-' . time());

    $stmt = $db->prepare("
        INSERT INTO task_categories 
        (name, slug, parent_id, level, icon, color, credit, default_checklists, default_specs, estimated_minutes, status, order_index, created_at, updated_at)
        VALUES 
        (:name, :slug, :parent_id, :level, :icon, :color, :credit, :checklists, :specs, :est_min, 'active', 0, NOW(), NOW())
    ");

    $stmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':parent_id' => $parent_id,
        ':level' => $level,
        ':icon' => $icon,
        ':color' => $color,
        ':credit' => $credit,
        ':checklists' => $checklists,
        ':specs' => $specs,
        ':est_min' => $estimated_minutes
    ]);

    $new_id = $db->lastInsertId();

    echo json_encode([
        "status" => "success",
        "message" => "Category created successfully.",
        "data" => [
            "id" => $new_id,
            "name" => $name,
            "parent_id" => $parent_id,
            "level" => $level,
            "icon" => $icon,
            "color" => $color
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
