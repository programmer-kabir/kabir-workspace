<?php
require_once __DIR__ . '/guard.php';

try {
    $db = (new Database())->getConnection();
    verifyCodeEditorAccess($db);

    $rawPath = $_GET['path'] ?? ($_POST['path'] ?? '');
    if (empty($rawPath)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'File path is required.']);
        exit();
    }

    $fullPath = resolveServerSafePath($rawPath);

    if (!file_exists($fullPath) || is_dir($fullPath)) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'File not found or is a directory.']);
        exit();
    }

    // Limit maximum readable size to 5MB to avoid memory limits
    $size = filesize($fullPath);
    if ($size > 5 * 1024 * 1024) {
        http_response_code(413);
        echo json_encode(['status' => 'error', 'message' => 'File size exceeds 5MB text editing limit.']);
        exit();
    }

    $content = file_get_contents($fullPath);
    $lines = substr_count($content, "\n") + 1;

    echo json_encode([
        'status'        => 'success',
        'path'          => str_replace('\\', '/', $rawPath),
        'filename'      => basename($fullPath),
        'extension'     => strtolower(pathinfo($fullPath, PATHINFO_EXTENSION)),
        'size'          => $size,
        'lines'         => $lines,
        'last_modified' => date('Y-m-d H:i:s', filemtime($fullPath)),
        'content'       => $content
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
