<?php
require_once __DIR__ . '/guard.php';

try {
    $db = (new Database())->getConnection();
    $currentUser = verifyCodeEditorAccess($db);

    $serverRoot = realpath(__DIR__ . '/../../..');
    $items = [];

    // Categories to scan
    $scanDirs = ['api', 'config', 'data'];

    function scanDirectoryRecursively($dir, $baseRoot, &$result) {
        if (!is_dir($dir)) return;
        $scan = scandir($dir);
        foreach ($scan as $file) {
            if ($file === '.' || $file === '..') continue;

            $fullPath = $dir . DIRECTORY_SEPARATOR . $file;
            $relPath = str_replace([$baseRoot . DIRECTORY_SEPARATOR, $baseRoot . '/'], '', $fullPath);
            $relPath = str_replace('\\', '/', $relPath);

            // Filter out protected/bloated directories
            if ($file === '.git' || $file === 'uploads' || $file === 'vendor' || $file === 'node_modules' || $file === 'editor_backups') {
                continue;
            }
            if ($file === '.env' || stripos($file, '.env.') !== false || $file === 'google_drive_credentials.json') {
                continue;
            }

            if (is_dir($fullPath)) {
                $result[] = [
                    'path'     => $relPath,
                    'name'     => $file,
                    'type'     => 'dir',
                    'size'     => 0,
                    'modified' => filemtime($fullPath)
                ];
                scanDirectoryRecursively($fullPath, $baseRoot, $result);
            } else {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                $result[] = [
                    'path'      => $relPath,
                    'name'      => $file,
                    'type'      => 'file',
                    'extension' => $ext,
                    'size'      => filesize($fullPath),
                    'modified'  => filemtime($fullPath)
                ];
            }
        }
    }

    foreach ($scanDirs as $sub) {
        $subPath = $serverRoot . DIRECTORY_SEPARATOR . $sub;
        if (is_dir($subPath)) {
            $items[] = [
                'path'     => $sub,
                'name'     => $sub,
                'type'     => 'dir',
                'size'     => 0,
                'modified' => filemtime($subPath)
            ];
            scanDirectoryRecursively($subPath, $serverRoot, $items);
        }
    }

    // Also include root .htaccess or helper scripts
    $rootFiles = glob($serverRoot . '/*.php');
    if ($rootFiles) {
        foreach ($rootFiles as $rf) {
            $bn = basename($rf);
            $items[] = [
                'path'      => $bn,
                'name'      => $bn,
                'type'      => 'file',
                'extension' => 'php',
                'size'      => filesize($rf),
                'modified'  => filemtime($rf)
            ];
        }
    }

    echo json_encode([
        'status' => 'success',
        'server_root' => 'server/',
        'items' => $items,
        'user' => [
            'id' => $currentUser['id'],
            'name' => $currentUser['name']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
