<?php
require_once __DIR__ . '/guard.php';

try {
    $db = (new Database())->getConnection();
    $currentUser = verifyCodeEditorAccess($db);

    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        $input = $_POST;
    }

    $rawPath = isset($input['path']) ? trim($input['path']) : '';
    $type    = isset($input['type']) ? trim($input['type']) : 'file'; // 'file' | 'folder'
    $initial = isset($input['initial_content']) ? $input['initial_content'] : "<?php\n// Created by {$currentUser['name']}\n";

    if (empty($rawPath)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Path is required.']);
        exit();
    }

    $fullPath = resolveServerSafePath($rawPath);

    if (file_exists($fullPath)) {
        http_response_code(409);
        echo json_encode(['status' => 'error', 'message' => 'A file or directory with this path already exists.']);
        exit();
    }

    if ($type === 'folder') {
        if (!mkdir($fullPath, 0755, true)) {
            throw new Exception("Failed to create folder '{$rawPath}'.");
        }
    } else {
        $dir = dirname($fullPath);
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
        if (file_put_contents($fullPath, $initial) === false) {
            throw new Exception("Failed to create file '{$rawPath}'.");
        }
    }

    echo json_encode([
        'status'  => 'success',
        'message' => ucfirst($type) . ' created successfully.',
        'path'    => str_replace('\\', '/', $rawPath),
        'type'    => $type
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
