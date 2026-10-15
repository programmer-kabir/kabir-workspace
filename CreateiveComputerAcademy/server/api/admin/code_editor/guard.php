<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';

function verifyCodeEditorAccess($db) {
    if (!$db) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable."]);
        exit();
    }

    $token = null;

    // 1. Check Authorization Bearer header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? '');
    }

    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    }

    // 2. Check query params or POST body
    if (!$token && !empty($_GET['token'])) {
        $token = trim($_GET['token']);
    } elseif (!$token && !empty($_POST['token'])) {
        $token = trim($_POST['token']);
    }

    // 3. Check JSON payload if token still missing
    if (!$token) {
        $raw = @file_get_contents('php://input');
        if ($raw) {
            $parsed = @json_decode($raw, true);
            if (!empty($parsed['token'])) {
                $token = trim($parsed['token']);
            }
        }
    }

    if (empty($token)) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Unauthorized: Authentication token is required."
        ]);
        exit();
    }

    // 4. Validate token against active user_tokens
    $authStmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.status 
        FROM user_tokens ut
        INNER JOIN users u ON ut.user_id = u.id
        WHERE ut.token = :token AND ut.expires_at > NOW()
        LIMIT 1
    ");
    $authStmt->execute([':token' => $token]);
    $user = $authStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['status'] !== 'active') {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Unauthorized: Invalid or expired session token."
        ]);
        exit();
    }

    // 5. Verify that the user holds the 'admin' or 'developer' role
    $roleStmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = :uid AND role IN ('admin', 'developer') LIMIT 1");
    $roleStmt->execute([':uid' => $user['id']]);
    if ($roleStmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Forbidden: Developer or Administrator permissions required to edit server code."
        ]);
        exit();
    }

    return $user;
}

/**
 * Resolves a relative path within server/ securely, preventing directory traversal.
 * Blocks editing sensitive secret files like .env or raw database dumps.
 */
function resolveServerSafePath($relPath) {
    $serverRoot = realpath(__DIR__ . '/../../..');
    if (!$serverRoot) {
        throw new Exception("Unable to resolve server root directory.");
    }

    // Normalize slashes
    $cleanRel = str_replace(['\\', '..'], ['/', ''], trim($relPath));
    $cleanRel = ltrim($cleanRel, '/');

    // Block protected secret and vendor files
    $blockedPatterns = [
        '.env',
        'google_drive_credentials.json',
        'vendor/',
        'node_modules/',
        '.git/'
    ];

    foreach ($blockedPatterns as $blocked) {
        if (stripos($cleanRel, $blocked) !== false) {
            throw new Exception("Access to '{$blocked}' is restricted for system security.");
        }
    }

    $targetFullPath = $serverRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $cleanRel);

    // If file exists, ensure its realpath starts with serverRoot
    if (file_exists($targetFullPath)) {
        $real = realpath($targetFullPath);
        if (!$real || strpos($real, $serverRoot) !== 0) {
            throw new Exception("Security violation: path traversal detected.");
        }
        return $real;
    }

    // If new file being created, verify parent directory
    $parentDir = dirname($targetFullPath);
    if (!file_exists($parentDir)) {
        @mkdir($parentDir, 0755, true);
    }
    $realParent = realpath($parentDir);
    if (!$realParent || strpos($realParent, $serverRoot) !== 0) {
        throw new Exception("Security violation: target parent directory outside server boundary.");
    }

    return $targetFullPath;
}
