<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed. Use POST."]);
    exit();
}

try {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        throw new Exception("Invalid JSON request body.");
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $level_number = isset($input['level_number']) ? (int)$input['level_number'] : 0;
    $level_name = trim($input['level_name'] ?? '');
    $min_published_files = isset($input['min_published_files']) ? (int)$input['min_published_files'] : 0;
    $min_total_downloads = isset($input['min_total_downloads']) ? (int)$input['min_total_downloads'] : 0;
    $badge_color = trim($input['badge_color'] ?? '#3B82F6');
    $benefits = trim($input['benefits'] ?? '');
    $is_active = isset($input['is_active']) ? ((int)$input['is_active'] ? 1 : 0) : 1;

    if (empty($level_name)) {
        throw new Exception("Level name is required.");
    }

    if ($id > 0) {
        // Update existing rule
        $stmt = $mysqli->prepare("UPDATE author_level_rules SET level_number = ?, level_name = ?, min_published_files = ?, min_total_downloads = ?, badge_color = ?, benefits = ?, is_active = ? WHERE id = ?");
        $stmt->bind_param("isiissii", $level_number, $level_name, $min_published_files, $min_total_downloads, $badge_color, $benefits, $is_active, $id);
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $stmt->close();
        $message = "Level rule updated successfully.";
    } else {
        // Insert new rule
        $stmt = $mysqli->prepare("INSERT INTO author_level_rules (level_number, level_name, min_published_files, min_total_downloads, badge_color, benefits, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isiissi", $level_number, $level_name, $min_published_files, $min_total_downloads, $badge_color, $benefits, $is_active);
        if (!$stmt->execute()) {
            throw new Exception($stmt->error);
        }
        $id = $stmt->insert_id;
        $stmt->close();
        $message = "New level rule created successfully.";
    }

    echo json_encode([
        "success" => true,
        "message" => $message,
        "data" => [
            "id" => $id,
            "level_number" => $level_number,
            "level_name" => $level_name,
            "min_published_files" => $min_published_files,
            "min_total_downloads" => $min_total_downloads,
            "badge_color" => $badge_color,
            "benefits" => $benefits,
            "is_active" => (bool)$is_active
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$mysqli->close();
