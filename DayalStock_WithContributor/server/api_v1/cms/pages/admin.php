<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/check_role.php';

// Protect this endpoint: Only 'admin' role can access
requireRole('admin');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
    
    if (!empty($slug)) {
        // Fetch single page by slug
        $stmt = $mysqli->prepare("SELECT id, title, slug, content_format, content, excerpt, meta_title, meta_description, status, updated_at, created_at FROM dynamic_pages WHERE slug = ? LIMIT 1");
        $stmt->bind_param("s", $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        $page = $result->fetch_assoc();
        $stmt->close();
        
        echo json_encode(["success" => true, "data" => $page ?: null]);
        exit;
    }
    
    // List all pages (including drafts/archived)
    $stmt = $mysqli->prepare("SELECT id, title, slug, status, content_format, updated_at, created_at FROM dynamic_pages ORDER BY created_at DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $pages = [];
    while ($row = $result->fetch_assoc()) {
        $pages[] = $row;
    }
    $stmt->close();
    
    echo json_encode(["success" => true, "data" => $pages]);
    
} elseif ($method === 'POST' || $method === 'PUT') {
    // Create or Update page (UPSERT by id or slug)
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    $title = isset($data['title']) ? trim($data['title']) : '';
    $slug = isset($data['slug']) ? trim($data['slug']) : '';
    $content_format = isset($data['content_format']) ? trim($data['content_format']) : 'html';
    $content = isset($data['content']) ? $data['content'] : '';
    $status = isset($data['status']) && in_array(strtolower($data['status']), ['published', 'draft', 'archived']) ? strtolower($data['status']) : 'published';
    
    if (empty($title) || empty($slug)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Title and slug are required"]);
        exit;
    }

    // Check if page exists by ID or Slug
    $existingId = 0;
    if ($id > 0) {
        $checkStmt = $mysqli->prepare("SELECT id FROM dynamic_pages WHERE id = ?");
        $checkStmt->bind_param("i", $id);
        $checkStmt->execute();
        $checkRes = $checkStmt->get_result();
        if ($r = $checkRes->fetch_assoc()) {
            $existingId = (int)$r['id'];
        }
        $checkStmt->close();
    }
    
    if ($existingId === 0 && !empty($slug)) {
        $checkStmt = $mysqli->prepare("SELECT id FROM dynamic_pages WHERE slug = ?");
        $checkStmt->bind_param("s", $slug);
        $checkStmt->execute();
        $checkRes = $checkStmt->get_result();
        if ($r = $checkRes->fetch_assoc()) {
            $existingId = (int)$r['id'];
        }
        $checkStmt->close();
    }

    if ($existingId > 0) {
        $stmt = $mysqli->prepare("UPDATE dynamic_pages SET title = ?, slug = ?, content_format = ?, content = ?, status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("sssssi", $title, $slug, $content_format, $content, $status, $existingId);
        
        if ($stmt->execute()) {
            $stmt->close();
            echo json_encode(["success" => true, "message" => "Page updated successfully", "id" => $existingId]);
        } else {
            echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error]);
        }
    } else {
        $stmt = $mysqli->prepare("INSERT INTO dynamic_pages (title, slug, content_format, content, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $title, $slug, $content_format, $content, $status);
        
        if ($stmt->execute()) {
            $newId = $mysqli->insert_id;
            $stmt->close();
            echo json_encode(["success" => true, "message" => "Page created successfully", "id" => $newId]);
        } else {
            echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error]);
        }
    }

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID is required"]);
        exit;
    }
    
    $stmt = $mysqli->prepare("UPDATE dynamic_pages SET status = 'archived' WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode(["success" => true, "message" => "Page archived successfully"]);
    } else {
        $stmt->close();
        echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error]);
    }
}
$mysqli->close();
