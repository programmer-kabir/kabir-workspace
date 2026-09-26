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

// Auto ensure table and seed exist
ensureCategoryTableExists($db);

try {
    // 1. Fetch all active categories ordered by order_index, name
    $stmt = $db->prepare("
        SELECT id, name, slug, parent_id, level, icon, color, credit, default_checklists, default_specs, estimated_minutes, department_id, status, order_index 
        FROM task_categories 
        WHERE status = 'active'
        ORDER BY order_index ASC, name ASC
    ");
    $stmt->execute();
    $all = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format JSON fields
    foreach ($all as &$item) {
        $item['default_checklists'] = !empty($item['default_checklists']) ? json_decode($item['default_checklists'], true) : [];
        $item['default_specs'] = !empty($item['default_specs']) ? json_decode($item['default_specs'], true) : null;
    }
    unset($item);

    // Group into indexed array by ID
    $byId = [];
    foreach ($all as $item) {
        $byId[$item['id']] = $item;
    }

    // Build Nested Tree & Flat search index
    $tree = [];
    $flat = [];

    // First, map main categories
    foreach ($all as $item) {
        if ($item['level'] === 'category' || empty($item['parent_id'])) {
            $catNode = $item;
            $catNode['subcategories'] = [];
            $tree[$item['id']] = $catNode;
        }
    }

    // Next, map subcategories
    foreach ($all as $item) {
        if ($item['level'] === 'subcategory' && !empty($item['parent_id'])) {
            $subNode = $item;
            $subNode['children'] = [];
            if (isset($tree[$item['parent_id']])) {
                $tree[$item['parent_id']]['subcategories'][$item['id']] = $subNode;
            }
        }
    }

    // Next, map child categories
    foreach ($all as $item) {
        if ($item['level'] === 'child' && !empty($item['parent_id'])) {
            $parentId = $item['parent_id'];
            // Find parent subcategory in tree
            foreach ($tree as &$mainCat) {
                if (isset($mainCat['subcategories'][$parentId])) {
                    $mainCat['subcategories'][$parentId]['children'][] = $item;
                    break;
                }
            }
            unset($mainCat);
        }
    }

    // Flatten tree into clean indexed arrays
    $cleanTree = [];
    foreach ($tree as $mainId => $mainCat) {
        $cleanSubs = [];
        foreach ($mainCat['subcategories'] as $subId => $subCat) {
            $cleanSubs[] = $subCat;
        }
        $mainCat['subcategories'] = $cleanSubs;
        $cleanTree[] = $mainCat;
    }

    // Build flat searchable array with full path
    foreach ($cleanTree as $m) {
        if (empty($m['subcategories'])) {
            $flat[] = [
                'category_id' => $m['id'],
                'subcategory_id' => null,
                'child_category_id' => null,
                'category_name' => $m['name'],
                'subcategory_name' => null,
                'child_name' => null,
                'full_path' => $m['name'],
                'icon' => $m['icon'],
                'color' => $m['color'],
                'credit' => isset($m['credit']) ? (int)$m['credit'] : 5,
                'checklists' => $m['default_checklists'],
                'specs' => $m['default_specs'],
                'estimated_minutes' => $m['estimated_minutes']
            ];
        } else {
            foreach ($m['subcategories'] as $s) {
                if (empty($s['children'])) {
                    $flat[] = [
                        'category_id' => $m['id'],
                        'subcategory_id' => $s['id'],
                        'child_category_id' => null,
                        'category_name' => $m['name'],
                        'subcategory_name' => $s['name'],
                        'child_name' => null,
                        'full_path' => $m['name'] . ' > ' . $s['name'],
                        'icon' => $s['icon'] ?: $m['icon'],
                        'color' => $s['color'] ?: $m['color'],
                        'credit' => isset($s['credit']) && (int)$s['credit'] > 0 ? (int)$s['credit'] : (isset($m['credit']) ? (int)$m['credit'] : 5),
                        'checklists' => $s['default_checklists'],
                        'specs' => $s['default_specs'],
                        'estimated_minutes' => $s['estimated_minutes']
                    ];
                } else {
                    foreach ($s['children'] as $c) {
                        $flat[] = [
                            'category_id' => $m['id'],
                            'subcategory_id' => $s['id'],
                            'child_category_id' => $c['id'],
                            'category_name' => $m['name'],
                            'subcategory_name' => $s['name'],
                            'child_name' => $c['name'],
                            'full_path' => $m['name'] . ' > ' . $s['name'] . ' > ' . $c['name'],
                            'icon' => $c['icon'] ?: ($s['icon'] ?: $m['icon']),
                            'color' => $s['color'] ?: $m['color'],
                            'credit' => isset($c['credit']) && (int)$c['credit'] > 0 ? (int)$c['credit'] : (isset($s['credit']) && (int)$s['credit'] > 0 ? (int)$s['credit'] : (isset($m['credit']) ? (int)$m['credit'] : 5)),
                            'checklists' => !empty($c['default_checklists']) ? $c['default_checklists'] : $s['default_checklists'],
                            'specs' => !empty($c['default_specs']) ? $c['default_specs'] : $s['default_specs'],
                            'estimated_minutes' => $c['estimated_minutes'] ?: $s['estimated_minutes']
                        ];
                    }
                }
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "tree" => $cleanTree,
            "flat" => $flat,
            "raw" => $all
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
