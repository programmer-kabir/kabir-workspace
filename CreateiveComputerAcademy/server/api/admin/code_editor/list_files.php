<?php
require_once __DIR__ . '/guard.php';

try {
    $db = (new Database())->getConnection();
    $currentUser = verifyCodeEditorAccess($db);

    $serverRoot = realpath(__DIR__ . '/../../..');
    if (!$serverRoot) {
        throw new Exception("Unable to locate server root directory.");
    }

    /**
     * Build a nested file & folder tree starting from $dir
     */
    function scanDirToTree($dir, $baseRoot) {
        if (!is_dir($dir)) return [];
        $entries = @scandir($dir);
        if ($entries === false) return [];

        $dirNodes = [];
        $fileNodes = [];

        foreach ($entries as $file) {
            if ($file === '.' || $file === '..') continue;

            // Block sensitive, temporary, or giant directories
            if (in_array($file, ['.git', 'vendor', 'node_modules', 'uploads', 'editor_backups'])) {
                continue;
            }
            // Block sensitive credential/secret files
            if ($file === '.env' || stripos($file, '.env.') !== false || $file === 'google_drive_credentials.json') {
                continue;
            }

            $fullPath = $dir . DIRECTORY_SEPARATOR . $file;
            $relPath = str_replace([$baseRoot . DIRECTORY_SEPARATOR, $baseRoot . '/'], '', $fullPath);
            $relPath = str_replace('\\', '/', $relPath);

            if (is_dir($fullPath)) {
                $children = scanDirToTree($fullPath, $baseRoot);
                $dirNodes[] = [
                    'name'     => $file,
                    'path'     => $relPath,
                    'type'     => 'dir',
                    'children' => $children
                ];
            } else {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

                // Skip huge database dumps (>10MB) to keep browser memory lightweight
                if ($ext === 'sql' && @filesize($fullPath) > 10 * 1024 * 1024) {
                    continue;
                }

                $fileNodes[] = [
                    'name'      => $file,
                    'path'      => $relPath,
                    'type'      => 'file',
                    'extension' => $ext,
                    'size'      => @filesize($fullPath) ?: 0,
                    'modified'  => @filemtime($fullPath) ?: time()
                ];
            }
        }

        // Sort directories alphabetically first, then files alphabetically
        usort($dirNodes, function($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });
        usort($fileNodes, function($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });

        return array_merge($dirNodes, $fileNodes);
    }

    /**
     * Flatten the tree into an indexed list with depth indicators
     */
    function flattenTree($tree, &$flat = [], $depth = 0, $parentPath = '') {
        foreach ($tree as $node) {
            $copy = $node;
            unset($copy['children']);
            $copy['depth'] = $depth;
            $copy['parent'] = $parentPath;
            $flat[] = $copy;
            if (!empty($node['children'])) {
                flattenTree($node['children'], $flat, $depth + 1, $node['path']);
            }
        }
        return $flat;
    }

    $tree = scanDirToTree($serverRoot, $serverRoot);
    $flatItems = [];
    flattenTree($tree, $flatItems);

    echo json_encode([
        'status' => 'success',
        'server_root' => 'server/',
        'tree' => $tree,
        'items' => $flatItems,
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
