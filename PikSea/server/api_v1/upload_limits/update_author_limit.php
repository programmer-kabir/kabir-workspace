<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method");
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    
    $authorId = isset($input['author_id']) ? (int)$input['author_id'] : 0;
    $permissionType = isset($input['permission_type']) ? $input['permission_type'] : 'limited';
    $weeklyLimit = isset($input['weekly_upload_limit']) ? (int)$input['weekly_upload_limit'] : 10;
    $maxFileSize = isset($input['max_file_size_mb']) ? (int)$input['max_file_size_mb'] : 5;

    if ($authorId <= 0) {
        throw new Exception("Invalid author ID");
    }

    if (!in_array($permissionType, ['limited', 'unlimited'])) {
        throw new Exception("Invalid permission type");
    }

    // Check if limit record exists
    $checkSql = "SELECT id FROM author_upload_limits WHERE author_id = ?";
    $checkStmt = $mysqli->prepare($checkSql);
    $checkStmt->bind_param("i", $authorId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing
        $updateSql = "UPDATE author_upload_limits SET permission_type = ?, weekly_upload_limit = ?, max_file_size_mb = ? WHERE author_id = ?";
        $stmt = $mysqli->prepare($updateSql);
        $stmt->bind_param("siii", $permissionType, $weeklyLimit, $maxFileSize, $authorId);
    } else {
        // Insert new
        $insertSql = "INSERT INTO author_upload_limits (author_id, permission_type, weekly_upload_limit, max_file_size_mb) VALUES (?, ?, ?, ?)";
        $stmt = $mysqli->prepare($insertSql);
        $stmt->bind_param("isii", $authorId, $permissionType, $weeklyLimit, $maxFileSize);
    }

    if (!$stmt->execute()) {
        throw new Exception("Database error: " . $stmt->error);
    }

    echo json_encode([
        "success" => true,
        "message" => "Author limit updated successfully"
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update author limit",
        "error" => $e->getMessage()
    ]);
}

$mysqli->close();
