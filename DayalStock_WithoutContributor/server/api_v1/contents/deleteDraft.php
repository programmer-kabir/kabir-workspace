<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

function sendResponse($success, $message, $extra = []) {
    while (ob_get_level() > 0) ob_end_clean();
    echo json_encode(
        array_merge(["success" => $success, "message" => $message], $extra),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, "Invalid request method.");
}

// Parse input
$input     = json_decode(file_get_contents("php://input"), true);
$contentId = isset($input['content_id']) ? (int)$input['content_id'] : 0;

if ($contentId <= 0) {
    sendResponse(false, "Invalid content_id.");
}

// ── Get author ID from the authenticated email (same as uploadContent.php) ─
$userEmail = $GLOBALS['user']['email'] ?? '';
if (empty($userEmail)) {
    sendResponse(false, "Unauthorized. Please log in.");
}

$authStmt = $mysqli->prepare(
    "SELECT authors.id FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ? LIMIT 1"
);
if (!$authStmt) sendResponse(false, "DB error: " . $mysqli->error);
$authStmt->bind_param("s", $userEmail);
$authStmt->execute();
$authRes = $authStmt->get_result();

if ($authRes->num_rows === 0) {
    sendResponse(false, "Author account not found.");
}
$authorId = (int)$authRes->fetch_assoc()['id'];
$authStmt->close();

// ── Fetch the draft content ───────────────────────────────────────
$checkStmt = $mysqli->prepare(
    "SELECT id, author_id, status,
            preview_image, watermarked_preview_image,
            thumbnail_url, preview_600_url, preview_1200_url,
            author_preview_url
     FROM contents WHERE id = ? LIMIT 1"
);
if (!$checkStmt) sendResponse(false, "DB prepare failed: " . $mysqli->error);
$checkStmt->bind_param("i", $contentId);
$checkStmt->execute();
$content = $checkStmt->get_result()->fetch_assoc();
$checkStmt->close();

if (!$content) {
    sendResponse(false, "Content not found.");
}

// Only draft status allowed
if ($content['status'] !== 'draft') {
    sendResponse(false, "Only draft content can be deleted.");
}

// Must belong to this author
if ((int)$content['author_id'] !== $authorId) {
    sendResponse(false, "Permission denied — this draft does not belong to you.");
}

// ── Delete physical files: remove the entire content folder ──────
// New structure: uploads/contents/{contentId}/
$uploadBase = __DIR__ . '/../../'; // → public_html/

function deleteDirRecursively($dir) {
    if (!is_dir($dir)) return;
    $items = array_diff(scandir($dir), ['.', '..']);
    foreach ($items as $item) {
        $path = $dir . '/' . $item;
        is_dir($path) ? deleteDirRecursively($path) : @unlink($path);
    }
    @rmdir($dir);
}

$contentFolder = $uploadBase . 'uploads/contents/' . $contentId . '/';
if (is_dir($contentFolder)) {
    deleteDirRecursively($contentFolder);
} else {
    // Fallback: delete individual files (old flat structure)
    $filesToDelete = [
        $content['preview_image'],
        $content['watermarked_preview_image'],
        $content['thumbnail_url'],
        $content['preview_600_url'],
        $content['preview_1200_url'],
        $content['author_preview_url'],
    ];
    foreach ($filesToDelete as $relPath) {
        if (empty($relPath)) continue;
        $absPath = $uploadBase . ltrim($relPath, '/');
        if (file_exists($absPath)) @unlink($absPath);
    }
}

// ── Also delete files in content_files table ─────────────────────
// Get file_url paths first
$filesStmt = $mysqli->prepare("SELECT file_url FROM content_files WHERE content_id = ?");
if ($filesStmt) {
    $filesStmt->bind_param("i", $contentId);
    $filesStmt->execute();
    $filesResult = $filesStmt->get_result();
    while ($row = $filesResult->fetch_assoc()) {
        if (!empty($row['file_url'])) {
            $absPath = $uploadBase . ltrim($row['file_url'], '/');
            if (file_exists($absPath)) @unlink($absPath);
        }
    }
    $filesStmt->close();
}

// ── Delete FK-constrained rows first ─────────────────────────────
$relatedTables = ['content_tags', 'content_files'];
foreach ($relatedTables as $table) {
    // We suppress error just in case the table doesn't exist in some environments
    $d = @$mysqli->prepare("DELETE FROM `$table` WHERE content_id = ?");
    if ($d) {
        $d->bind_param("i", $contentId);
        $d->execute();
        $d->close();
    }
}

// ── Delete the content row ─────────────────────────────────────────
$delStmt = $mysqli->prepare(
    "DELETE FROM contents WHERE id = ? AND author_id = ? AND status = 'draft'"
);
if (!$delStmt) sendResponse(false, "DB prepare failed: " . $mysqli->error);
$delStmt->bind_param("ii", $contentId, $authorId);
$delStmt->execute();
$affected = $delStmt->affected_rows;
$delStmt->close();
$mysqli->close();

if ($affected > 0) {
    sendResponse(true, "Draft deleted successfully.");
} else {
    sendResponse(false, "Delete failed — draft may already be removed.");
}
?>
