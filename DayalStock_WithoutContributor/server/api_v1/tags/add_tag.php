<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'] ?? '';
    $slug = $data['slug'] ?? '';

    if (empty($name) || empty($slug)) {
        throw new Exception("Name and Slug are required.");
    }

    $stmt = $mysqli->prepare("INSERT INTO tags (name, slug) VALUES (?, ?)");
    $stmt->bind_param("ss", $name, $slug);

    if (!$stmt->execute()) {
        throw new Exception("Failed to add tag: " . $stmt->error);
    }

    echo json_encode(["success" => true, "message" => "Tag added successfully"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
