<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php'; // MUST be before auth.php so $mysqli is available
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/r2_config.php';

header('Content-Type: application/json');

try {
    $user = $GLOBALS['user'] ?? null;
    if (!$user) {
        throw new Exception("Unauthorized");
    }
    
    $user_id = $user['id'];
    
    // Get author id from database
    $stmt = $mysqli->prepare("SELECT id FROM authors WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows === 0) {
        throw new Exception("Author profile not found");
    }
    
    $author = $res->fetch_assoc();
    $authorId = (int) $author['id'];
    $stmt->close();
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Method not allowed");
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $filename = isset($input['filename']) ? $input['filename'] : '';
    $contentType = isset($input['contentType']) ? $input['contentType'] : '';
    $type = isset($input['type']) ? $input['type'] : 'content'; // 'content' or 'nid'
    
    if (empty($filename) || empty($contentType)) {
        throw new Exception("Filename and Content-Type are required");
    }
    
    // Sanitize filename
    $filename = preg_replace("/[^a-zA-Z0-9_.-]/", "_", $filename);
    $filename = time() . '_' . $filename;
    
    if ($type === 'nid') {
        $r2Key = "uploads/nids/{$authorId}/{$filename}";
    } else {
        // default to content
        $r2Key = "uploads/contents/{$authorId}/{$filename}";
    }
    
    $presignedUrl = R2Helper::generatePresignedUrl($r2Key, $contentType);
    $publicUrl = R2Helper::getPublicUrl($r2Key);
    
    if (!$presignedUrl) {
        throw new Exception("Failed to generate presigned URL");
    }
    
    echo json_encode([
        'status' => 'success',
        'presignedUrl' => $presignedUrl,
        'r2Key' => $r2Key,
        'publicUrl' => $publicUrl
    ]);
    
} catch (Exception $e) {
    http_response_code($e->getMessage() == 'Unauthorized' ? 401 : 500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
