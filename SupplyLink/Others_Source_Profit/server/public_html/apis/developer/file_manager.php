<?php
// =========================================================================
// SupplyLink - Developer File Manager & Code Editor
// Restricted strictly to Admin and Developer
// Restricted strictly to the apis/ directory
// =========================================================================

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_guard.php';
guardAdminDevOnly();

header("Content-Type: application/json; charset=UTF-8");

$baseDir = realpath(__DIR__ . '/..'); // Points to server/public_html/apis/
$backupDir = $baseDir . '/.code_backups';
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0755, true);
}

function resolveSafePath($relativePath, $baseDir) {
    $cleanRel = ltrim(str_replace(['../', '..\\'], '', $relativePath), '/\\');
    $fullPath = $baseDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $cleanRel);
    return $fullPath;
}

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $input['action'] ?? $_GET['action'] ?? '';

try {
    // 1. List PHP files in apis/ directory
    if ($action === 'list_files') {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, ['php', 'sql', 'json', 'md', 'env', 'htaccess'])) {
                    $realPath = $file->getRealPath();
                    // Exclude .code_backups folder
                    if (strpos($realPath, '.code_backups') !== false) continue;

                    $relPath = str_replace('\\', '/', substr($realPath, strlen($baseDir) + 1));
                    $files[] = [
                        "path" => $relPath,
                        "name" => $file->getFilename(),
                        "size_bytes" => $file->getSize(),
                        "size_kb" => round($file->getSize() / 1024, 2),
                        "modified" => date("Y-m-d H:i:s", $file->getMTime()),
                        "ext" => $ext
                    ];
                }
            }
        }

        usort($files, fn($a, $b) => strcmp($a['path'], $b['path']));

        echo json_encode([
            "success" => true,
            "base_dir" => $baseDir,
            "count" => count($files),
            "files" => $files
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Read single file content
    if ($action === 'read_file') {
        $rel = $input['path'] ?? '';
        $fullPath = resolveSafePath($rel, $baseDir);

        if (!file_exists($fullPath) || !is_file($fullPath)) {
            echo json_encode(["success" => false, "message" => "File not found: " . htmlspecialchars($rel)]);
            exit;
        }

        $content = file_get_contents($fullPath);
        echo json_encode([
            "success" => true,
            "path" => $rel,
            "content" => $content,
            "size" => filesize($fullPath),
            "modified" => date("Y-m-d H:i:s", filemtime($fullPath))
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 3. Save edited file (with automated backup copy)
    if ($action === 'save_file') {
        $rel = $input['path'] ?? '';
        $content = $input['content'] ?? null;

        if ($content === null) {
            echo json_encode(["success" => false, "message" => "Content is required"]);
            exit;
        }

        $fullPath = resolveSafePath($rel, $baseDir);
        if (!file_exists($fullPath) || !is_file($fullPath)) {
            echo json_encode(["success" => false, "message" => "Target file does not exist"]);
            exit;
        }

        // Automatic backup before overwrite
        $sanitizedName = str_replace(['/', '\\'], '_', $rel);
        $backupFile = $backupDir . '/' . $sanitizedName . '_' . date("Ymd_His") . '.bak';
        @copy($fullPath, $backupFile);

        $written = file_put_contents($fullPath, $content);
        if ($written === false) {
            echo json_encode(["success" => false, "message" => "Failed to write file. Check file permissions."]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "message" => "File saved successfully ✅",
            "bytes_written" => $written,
            "backup_created" => basename($backupFile)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 4. Create new file
    if ($action === 'create_file') {
        $rel = trim($input['path'] ?? '');
        $content = $input['content'] ?? "<?php\n\nrequire_once __DIR__ . '/../cors.php';\nrequire_once __DIR__ . '/../auth_guard.php';\nguardAdminDevOnly();\n\nheader('Content-Type: application/json');\n\necho json_encode(['success' => true, 'message' => 'New API endpoint initialized']);\n";

        if (empty($rel)) {
            echo json_encode(["success" => false, "message" => "File path is required"]);
            exit;
        }

        $fullPath = resolveSafePath($rel, $baseDir);
        if (file_exists($fullPath)) {
            echo json_encode(["success" => false, "message" => "File already exists"]);
            exit;
        }

        $parent = dirname($fullPath);
        if (!is_dir($parent)) {
            @mkdir($parent, 0755, true);
        }

        $written = file_put_contents($fullPath, $content);
        if ($written === false) {
            echo json_encode(["success" => false, "message" => "Failed to create file"]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "message" => "New file created successfully ✅",
            "path" => $rel
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(["success" => false, "message" => "Unknown action"]);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
