<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $name = $data['name'] ?? '';
    $slug = $data['slug'] ?? '';

    if (!$id || empty($name) || empty($slug)) {
        throw new Exception("ID, Name, and Slug are required.");
    }

    $stmt = $mysqli->prepare("UPDATE tags SET name = ?, slug = ? WHERE id = ?");
    $stmt->bind_param("ssi", $name, $slug, $id);

    if (!$stmt->execute()) {
        throw new Exception("Failed to update tag: " . $stmt->error);
    }

    echo json_encode(["success" => true, "message" => "Tag updated successfully"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
