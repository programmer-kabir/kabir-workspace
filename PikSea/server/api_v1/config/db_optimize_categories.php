<?php
/**
 * PikSea Database Optimization & Photography Category Seeder
 */
require_once __DIR__ . '/db.php';

header("Content-Type: application/json; charset=UTF-8");

$results = [
    'indexes_created' => [],
    'categories_created' => [],
    'errors' => []
];

try {
    // 1. Add Composite Indexes for high-speed filtering if not present
    $indexes = [
        'idx_status_cats'    => "ALTER TABLE `contents` ADD INDEX `idx_status_cats` (`status`, `main_category_id`, `subcategory_id`)",
        'idx_status_filter'  => "ALTER TABLE `contents` ADD INDEX `idx_status_filter` (`status`, `orientation`, `is_premium`)",
        'idx_status_popular' => "ALTER TABLE `contents` ADD INDEX `idx_status_popular` (`status`, `downloads_count`, `views_count`)",
        'idx_status_created' => "ALTER TABLE `contents` ADD INDEX `idx_status_created` (`status`, `id` DESC)"
    ];

    // Check existing indexes on contents
    $existingIndexesResult = $mysqli->query("SHOW INDEX FROM `contents`");
    $existingIndexNames = [];
    if ($existingIndexesResult) {
        while ($row = $existingIndexesResult->fetch_assoc()) {
            $existingIndexNames[$row['Key_name']] = true;
        }
    }

    foreach ($indexes as $indexName => $sql) {
        if (!isset($existingIndexNames[$indexName])) {
            if ($mysqli->query($sql)) {
                $results['indexes_created'][] = $indexName;
            } else {
                $results['errors'][] = "Failed to add index $indexName: " . $mysqli->error;
            }
        } else {
            $results['indexes_created'][] = "$indexName (already exists)";
        }
    }

    // 2. Pure Stock Photography Categories & Subcategories
    $photographyTaxonomy = [
        'Nature & Landscapes' => [
            'slug' => 'nature',
            'subcategories' => [
                ['name' => 'Mountains', 'slug' => 'mountains'],
                ['name' => 'Forests & Trees', 'slug' => 'forests'],
                ['name' => 'Oceans & Beaches', 'slug' => 'oceans'],
                ['name' => 'Sunset & Sunrise', 'slug' => 'sunset-sunrise'],
                ['name' => 'Sky & Clouds', 'slug' => 'sky-clouds'],
                ['name' => 'Wildlife & Animals', 'slug' => 'wildlife'],
                ['name' => 'Flowers & Plants', 'slug' => 'plants-flowers']
            ]
        ],
        'People & Lifestyle' => [
            'slug' => 'people',
            'subcategories' => [
                ['name' => 'Portraits', 'slug' => 'portraits'],
                ['name' => 'Street Photography', 'slug' => 'street-photography'],
                ['name' => 'Fashion & Style', 'slug' => 'fashion'],
                ['name' => 'Fitness & Sports', 'slug' => 'fitness'],
                ['name' => 'Family & Lifestyle', 'slug' => 'family-lifestyle'],
                ['name' => 'Emotions & Mood', 'slug' => 'emotions']
            ]
        ],
        'Architecture & City' => [
            'slug' => 'architecture',
            'subcategories' => [
                ['name' => 'Cityscapes & Skylines', 'slug' => 'cityscapes'],
                ['name' => 'Modern Buildings', 'slug' => 'modern-buildings'],
                ['name' => 'Minimal Interiors', 'slug' => 'interiors'],
                ['name' => 'Historic & Monuments', 'slug' => 'historic-monuments'],
                ['name' => 'Night City', 'slug' => 'night-city']
            ]
        ],
        'Travel & Adventure' => [
            'slug' => 'travel',
            'subcategories' => [
                ['name' => 'Drone & Aerial', 'slug' => 'drone-aerial'],
                ['name' => 'Road Trips', 'slug' => 'road-trips'],
                ['name' => 'Camping & Hiking', 'slug' => 'camping'],
                ['name' => 'Cultures & Traditions', 'slug' => 'cultures'],
                ['name' => 'Famous Landmarks', 'slug' => 'landmarks']
            ]
        ],
        'Food & Drink' => [
            'slug' => 'food-drink',
            'subcategories' => [
                ['name' => 'Coffee & Café', 'slug' => 'coffee-cafe'],
                ['name' => 'Fruits & Vegetables', 'slug' => 'fruits-vegetables'],
                ['name' => 'Cooking & Kitchen', 'slug' => 'cooking'],
                ['name' => 'Bakery & Desserts', 'slug' => 'bakery-desserts'],
                ['name' => 'Restaurant & Dining', 'slug' => 'restaurant']
            ]
        ],
        'Business & Tech' => [
            'slug' => 'business-tech',
            'subcategories' => [
                ['name' => 'Modern Workspace', 'slug' => 'modern-workspace'],
                ['name' => 'Remote Work', 'slug' => 'remote-work'],
                ['name' => 'Team Collaboration', 'slug' => 'teamwork'],
                ['name' => 'Tech & Gadgets', 'slug' => 'technology']
            ]
        ],
        'Wallpapers & Textures' => [
            'slug' => 'wallpapers',
            'subcategories' => [
                ['name' => 'Dark & Moody', 'slug' => 'dark-moody'],
                ['name' => 'Minimalist Wallpapers', 'slug' => 'minimalist'],
                ['name' => 'Textures & Patterns', 'slug' => 'textures'],
                ['name' => 'Neon & Night Lights', 'slug' => 'neon-lights'],
                ['name' => 'Macro Photography', 'slug' => 'macro']
            ]
        ]
    ];

    foreach ($photographyTaxonomy as $parentName => $parentInfo) {
        $parentSlug = $parentInfo['slug'];

        // Check if parent category exists by slug
        $stmt = $mysqli->prepare("SELECT id FROM categories WHERE slug = ? LIMIT 1");
        $stmt->bind_param("s", $parentSlug);
        $stmt->execute();
        $res = $stmt->get_result();
        
        $parentId = null;
        if ($row = $res->fetch_assoc()) {
            $parentId = $row['id'];
            // Ensure parent_id is NULL for main category
            $mysqli->query("UPDATE categories SET parent_id = NULL, name = '" . $mysqli->real_escape_string($parentName) . "' WHERE id = $parentId");
        } else {
            // Insert parent category
            $insertStmt = $mysqli->prepare("INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, NULL)");
            $insertStmt->bind_param("ss", $parentName, $parentSlug);
            $insertStmt->execute();
            $parentId = $mysqli->insert_id;
            $results['categories_created'][] = "Parent: $parentName ($parentSlug)";
            $insertStmt->close();
        }
        $stmt->close();

        // Process subcategories
        foreach ($parentInfo['subcategories'] as $sub) {
            $subName = $sub['name'];
            $subSlug = $sub['slug'];

            $subCheck = $mysqli->prepare("SELECT id, parent_id FROM categories WHERE slug = ? LIMIT 1");
            $subCheck->bind_param("s", $subSlug);
            $subCheck->execute();
            $subRes = $subCheck->get_result();

            if ($row = $subRes->fetch_assoc()) {
                // Already exists, ensure it is assigned to this parentId
                $subId = $row['id'];
                $mysqli->query("UPDATE categories SET parent_id = $parentId, name = '" . $mysqli->real_escape_string($subName) . "' WHERE id = $subId");
            } else {
                $subInsert = $mysqli->prepare("INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)");
                $subInsert->bind_param("ssi", $subName, $subSlug, $parentId);
                if ($subInsert->execute()) {
                    $results['categories_created'][] = "Sub: $subName ($subSlug) under $parentName";
                }
                $subInsert->close();
            }
            $subCheck->close();
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database optimization and photography taxonomy setup completed successfully!',
        'results' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
