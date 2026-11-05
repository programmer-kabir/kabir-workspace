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

$baseDir = realpath(__DIR__ . '/../..'); // Points to server/public_html/ (Full server codebase)
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
    // 1. Browse Folder (hPanel Directory View)
    if ($action === 'browse_folder') {
        $folder = trim($input['folder'] ?? $_GET['folder'] ?? '');
        $targetDir = resolveSafePath($folder, $baseDir);

        if (!is_dir($targetDir)) {
            echo json_encode(["success" => false, "message" => "Folder not found: " . htmlspecialchars($folder)]);
            exit;
        }

        $items = scandir($targetDir);
        $folderList = [];
        $fileList = [];

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            if ($item === '.code_backups') continue;

            $itemFullPath = $targetDir . DIRECTORY_SEPARATOR . $item;
            $relItemPath = trim(($folder !== '' ? $folder . '/' : '') . $item, '/');

            if (is_dir($itemFullPath)) {
                // Count items inside subfolder
                $subItems = @scandir($itemFullPath);
                $subCount = $subItems ? count(array_diff($subItems, ['.', '..', '.code_backups'])) : 0;

                $folderList[] = [
                    "type" => "folder",
                    "name" => $item,
                    "path" => $relItemPath,
                    "item_count" => $subCount,
                    "modified" => date("Y-m-d H:i:s", filemtime($itemFullPath))
                ];
            } else if (is_file($itemFullPath)) {
                $ext = strtolower(pathinfo($item, PATHINFO_EXTENSION));
                $fileList[] = [
                    "type" => "file",
                    "name" => $item,
                    "path" => $relItemPath,
                    "size_bytes" => filesize($itemFullPath),
                    "size_kb" => round(filesize($itemFullPath) / 1024, 2),
                    "modified" => date("Y-m-d H:i:s", filemtime($itemFullPath)),
                    "ext" => $ext
                ];
            }
        }

        usort($folderList, fn($a, $b) => strcasecmp($a['name'], $b['name']));
        usort($fileList, fn($a, $b) => strcasecmp($a['name'], $b['name']));

        // Build breadcrumbs
        $breadcrumbs = [
            ["name" => "public_html", "path" => ""]
        ];
        if (!empty($folder)) {
            $parts = explode('/', str_replace('\\', '/', $folder));
            $accum = '';
            foreach ($parts as $p) {
                if ($p === '') continue;
                $accum = trim($accum . '/' . $p, '/');
                $breadcrumbs[] = [
                    "name" => $p,
                    "path" => $accum
                ];
            }
        }

        // Parent folder calculation
        $parentFolder = null;
        if (!empty($folder)) {
            $parent = dirname($folder);
            $parentFolder = ($parent === '.' || $parent === '/') ? '' : str_replace('\\', '/', $parent);
        }

        echo json_encode([
            "success" => true,
            "current_folder" => $folder,
            "parent_folder" => $parentFolder,
            "breadcrumbs" => $breadcrumbs,
            "folders" => $folderList,
            "files" => $fileList,
            "total_folders" => count($folderList),
            "total_files" => count($fileList)
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 1.1 List all files flat (search support)
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

    // 4. Create new file (supports current open folder)
    if ($action === 'create_file') {
        $folder = trim($input['folder'] ?? '');
        $fileName = trim($input['filename'] ?? $input['name'] ?? '');
        $rel = trim($input['path'] ?? '');

        // If filename is given with or without folder
        if (!empty($fileName)) {
            $rel = trim(($folder !== '' ? $folder . '/' : '') . $fileName, '/');
        }

        $content = $input['content'] ?? "<?php\n\nrequire_once __DIR__ . '/../cors.php';\nrequire_once __DIR__ . '/../auth_guard.php';\nguardAdminDevOnly();\n\nheader('Content-Type: application/json');\n\necho json_encode(['success' => true, 'message' => 'New API endpoint initialized']);\n";

        if (empty($rel)) {
            echo json_encode(["success" => false, "message" => "File name/path is required"]);
            exit;
        }

        $fullPath = resolveSafePath($rel, $baseDir);
        if (file_exists($fullPath)) {
            echo json_encode(["success" => false, "message" => "File already exists: " . htmlspecialchars($rel)]);
            exit;
        }

        $parent = dirname($fullPath);
        if (!is_dir($parent)) {
            @mkdir($parent, 0755, true);
        }

        $written = file_put_contents($fullPath, $content);
        if ($written === false) {
            echo json_encode(["success" => false, "message" => "Failed to create file. Check folder write permissions."]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "message" => "New file created successfully ✅",
            "path" => $rel,
            "name" => basename($rel),
            "folder" => $folder
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 5. Create new folder (inside current open folder)
    if ($action === 'create_folder') {
        $folder = trim($input['folder'] ?? '');
        $newFolderName = trim($input['folder_name'] ?? $input['name'] ?? '');

        if (empty($newFolderName)) {
            echo json_encode(["success" => false, "message" => "Folder name cannot be empty"]);
            exit;
        }

        // Clean folder name to prevent traversal
        $newFolderName = trim(str_replace(['../', '..\\', '/', '\\'], '', $newFolderName));
        $relPath = trim(($folder !== '' ? $folder . '/' : '') . $newFolderName, '/');
        $fullPath = resolveSafePath($relPath, $baseDir);

        if (is_dir($fullPath) || file_exists($fullPath)) {
            echo json_encode(["success" => false, "message" => "Folder or file already exists with this name"]);
            exit;
        }

        if (!@mkdir($fullPath, 0755, true)) {
            echo json_encode(["success" => false, "message" => "Failed to create directory. Permission denied."]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "message" => "Directory created successfully 📁",
            "path" => $relPath,
            "name" => $newFolderName,
            "folder" => $folder
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 6. Delete File or Folder (with auto-backup)
    if ($action === 'delete_item') {
        $rel = trim($input['path'] ?? '');
        $type = trim($input['type'] ?? 'file');

        if (empty($rel) || $rel === '/' || $rel === '.') {
            echo json_encode(["success" => false, "message" => "Invalid target path"]);
            exit;
        }

        $fullPath = resolveSafePath($rel, $baseDir);

        if (!file_exists($fullPath)) {
            echo json_encode(["success" => false, "message" => "Item not found: " . htmlspecialchars($rel)]);
            exit;
        }

        if (is_file($fullPath)) {
            // Backup before delete
            $sanitizedName = str_replace(['/', '\\'], '_', $rel);
            $backupFile = $backupDir . '/' . $sanitizedName . '_deleted_' . date("Ymd_His") . '.bak';
            @copy($fullPath, $backupFile);

            if (@unlink($fullPath)) {
                echo json_encode([
                    "success" => true,
                    "message" => "ফাইল সফলভাবে মুছে ফেলা হয়েছে 🗑️ (ব্যাকআপ সংরক্ষিত)",
                    "path" => $rel
                ], JSON_UNESCAPED_UNICODE);
                exit;
            } else {
                echo json_encode(["success" => false, "message" => "Failed to delete file. Permission denied."]);
                exit;
            }
        } else if (is_dir($fullPath)) {
            // Recursive directory removal helper
            $deleteDir = function($dir) use (&$deleteDir) {
                if (!is_dir($dir)) return false;
                $files = array_diff(scandir($dir), ['.', '..']);
                foreach ($files as $file) {
                    $p = "$dir/$file";
                    is_dir($p) ? $deleteDir($p) : @unlink($p);
                }
                return @rmdir($dir);
            };

            if ($deleteDir($fullPath)) {
                echo json_encode([
                    "success" => true,
                    "message" => "ফোল্ডার সফলভাবে মুছে ফেলা হয়েছে 🗑️",
                    "path" => $rel
                ], JSON_UNESCAPED_UNICODE);
                exit;
            } else {
                echo json_encode(["success" => false, "message" => "Failed to delete directory. Permission denied."]);
                exit;
            }
        }
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

