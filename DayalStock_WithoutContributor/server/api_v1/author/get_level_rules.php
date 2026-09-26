<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    // 1. Fetch active author level rules from author_level_rules table
    $sql = "SELECT id, level_number, level_name, min_published_files, min_total_downloads, badge_color, benefits, is_active, created_at 
            FROM author_level_rules 
            WHERE is_active = 1 
            ORDER BY level_number ASC";
    
    $result = $mysqli->query($sql);
    
    if (!$result) {
        throw new Exception($mysqli->error);
    }
    
    $levelRules = [];
    while ($row = $result->fetch_assoc()) {
        $levelRules[] = [
            "id" => (int)$row["id"],
            "level_number" => (int)$row["level_number"],
            "level_name" => $row["level_name"],
            "min_published_files" => (int)$row["min_published_files"],
            "min_total_downloads" => (int)$row["min_total_downloads"],
            "badge_color" => $row["badge_color"],
            "benefits" => $row["benefits"],
            "is_active" => (bool)$row["is_active"],
            "created_at" => $row["created_at"]
        ];
    }

    // 2. Fetch badge threshold settings from settings table
    $badgeSettingsRes = $mysqli->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'badge_%'");
    $badgeRules = [
        "top_earner_min_downloads" => 20,
        "trending_min_downloads" => 5,
        "trending_min_views" => 50,
        "high_views_min_views" => 20,
        "fresh_release_max_days" => 14,
    ];

    if ($badgeSettingsRes) {
        while ($bRow = $badgeSettingsRes->fetch_assoc()) {
            $key = str_replace('badge_', '', $bRow['setting_key']);
            $badgeRules[$key] = is_numeric($bRow['setting_value']) ? (int)$bRow['setting_value'] : $bRow['setting_value'];
        }
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Author rules and badge settings fetched successfully",
        "data" => [
            "level_rules" => $levelRules,
            "badge_rules" => $badgeRules
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch rules",
        "error" => $e->getMessage()
    ]);
}

$mysqli->close();
