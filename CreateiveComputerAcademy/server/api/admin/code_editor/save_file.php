<?php
require_once __DIR__ . '/guard.php';

try {
    $db = (new Database())->getConnection();
    $currentUser = verifyCodeEditorAccess($db);

    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        $input = $_POST;
    }

    $rawPath      = isset($input['path']) ? trim($input['path']) : '';
    $content      = isset($input['content']) ? $input['content'] : null;
    $createBackup = !isset($input['create_backup']) || !empty($input['create_backup']);

    if (empty($rawPath) || $content === null) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Both file path and content are required.']);
        exit();
    }

    $fullPath = resolveServerSafePath($rawPath);

    // Optional Auto-Backup of previous content
    $backupPath = null;
    if (file_exists($fullPath) && $createBackup) {
        $backupDir = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'backups' . DIRECTORY_SEPARATOR . 'editor_backups';
        if (!file_exists($backupDir)) {
            @mkdir($backupDir, 0755, true);
        }
        $baseName = basename($fullPath);
        $timestamp = date('Ymd_His');
        $backupFile = "{$backupDir}/{$baseName}_{$timestamp}.bak";
        @copy($fullPath, $backupFile);
        $backupPath = str_replace('\\', '/', $backupFile);
    }

    // Write new content atomically
    $bytesWritten = file_put_contents($fullPath, $content);
    if ($bytesWritten === false) {
        throw new Exception("Permission denied: unable to write to {$rawPath}. Please verify file permissions on host.");
    }

    // Clear PHP opcache if enabled so changes take effect immediately
    if (function_exists('opcache_invalidate')) {
        @opcache_invalidate($fullPath, true);
    }

    echo json_encode([
        'status'         => 'success',
        'message'        => 'File saved successfully.',
        'path'           => str_replace('\\', '/', $rawPath),
        'bytes_written'  => $bytesWritten,
        'size'           => filesize($fullPath),
        'last_modified'  => date('Y-m-d H:i:s', filemtime($fullPath)),
        'backup_created' => !empty($backupPath),
        'saved_by'       => $currentUser['name']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
