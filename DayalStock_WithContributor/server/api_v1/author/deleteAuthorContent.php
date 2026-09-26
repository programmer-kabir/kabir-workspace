<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php'; // SECURE: Verify Firebase Token

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only POST method is allowed."
    ]);
    exit;
}

$contentId = isset($_GET["id"]) ? (int) $_GET["id"] : 0;

if ($contentId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Content ID is required."
    ]);
    exit;
}

// SECURE: Get Author ID securely from authenticated email
$userEmail = $GLOBALS['user']['email'];
if (!$userEmail) {
    echo json_encode(["success" => false, "message" => "Unauthorized. Please log in."]);
    exit;
}

$authStmt = $mysqli->prepare("SELECT authors.id FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ? LIMIT 1");
$authStmt->bind_param("s", $userEmail);
$authStmt->execute();
$authRes = $authStmt->get_result();

if ($authRes->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "You are not authorized to delete content. Author account required."]);
    exit;
}

$authorId = (int) $authRes->fetch_assoc()['id'];
$authStmt->close();

/*
  তোমার hosting public_html যদি dayalstock.com হয়,
  এই path ঠিক থাকবে:

  /home/USERNAME/public_html/

  যদি uploads অন্য folder-এ থাকে তাহলে এইটা change করবে।
*/
$projectRoot = realpath(__DIR__ . "/../..");

if (!$projectRoot) {
    echo json_encode([
        "success" => false,
        "message" => "Server root path could not be found."
    ]);
    exit;
}

$mysqli->begin_transaction();

try {
    /*
      আগে content author-এর কিনা check করবো।
      শুধু rejected content delete করার rule চাইলে:
      AND status = 'rejected'
      এই line add করতে পারো।
    */
    $contentSql = "
        SELECT id, author_id, preview_image, status
        FROM contents
        WHERE id = ?
          AND author_id = ?
        LIMIT 1
    ";

    $contentStmt = $mysqli->prepare($contentSql);

    if (!$contentStmt) {
        throw new Exception("Content query prepare failed.");
    }

    $contentStmt->bind_param("ii", $contentId, $authorId);
    $contentStmt->execute();

    $contentResult = $contentStmt->get_result();
    $content = $contentResult->fetch_assoc();

    $contentStmt->close();

    if (!$content) {
        throw new Exception("Content not found or you do not have permission to delete it.");
    }

    /*
      শুধু rejected file delete করতে চাইলে এইটা রাখো।
      Pending / published যেন author delete না করতে পারে।
    */
    if ($content["status"] !== "rejected") {
        throw new Exception("Only rejected content can be deleted.");
    }

    /*
      সব attached file আনবে।
      main EPS/SVG/AI/ZIP এবং preview JPG/PNG সব এখানে থাকবে।
    */
    $filesSql = "
        SELECT id, file_url, file_name
        FROM content_files
        WHERE content_id = ?
    ";

    $filesStmt = $mysqli->prepare($filesSql);

    if (!$filesStmt) {
        throw new Exception("Files query prepare failed.");
    }

    $filesStmt->bind_param("i", $contentId);
    $filesStmt->execute();

    $filesResult = $filesStmt->get_result();

    $pathsToDelete = [];

    while ($file = $filesResult->fetch_assoc()) {
        if (!empty($file["file_url"])) {
            $pathsToDelete[] = $file["file_url"];
        }
    }

    $filesStmt->close();

    /*
      preview_image অনেক সময় content_files-এ থাকে না,
      তাই আলাদা করে এটাও add করলাম।
    */
    if (!empty($content["preview_image"])) {
        $pathsToDelete[] = $content["preview_image"];
    }

    /* duplicate path remove */
    $pathsToDelete = array_unique($pathsToDelete);

    /*
      আগে database relation delete করবো
    */

    $deleteTagsSql = "DELETE FROM content_tags WHERE content_id = ?";
    $deleteTagsStmt = $mysqli->prepare($deleteTagsSql);

    if (!$deleteTagsStmt) {
        throw new Exception("Content tags delete query failed.");
    }

    $deleteTagsStmt->bind_param("i", $contentId);
    $deleteTagsStmt->execute();
    $deleteTagsStmt->close();

    $deleteFilesSql = "DELETE FROM content_files WHERE content_id = ?";
    $deleteFilesStmt = $mysqli->prepare($deleteFilesSql);

    if (!$deleteFilesStmt) {
        throw new Exception("Content files delete query failed.");
    }

    $deleteFilesStmt->bind_param("i", $contentId);
    $deleteFilesStmt->execute();
    $deleteFilesStmt->close();

    $deleteContentSql = "
        DELETE FROM contents
        WHERE id = ?
          AND author_id = ?
    ";

    $deleteContentStmt = $mysqli->prepare($deleteContentSql);

    if (!$deleteContentStmt) {
        throw new Exception("Content delete query failed.");
    }

    $deleteContentStmt->bind_param("ii", $contentId, $authorId);
    $deleteContentStmt->execute();

    if ($deleteContentStmt->affected_rows === 0) {
        throw new Exception("Content could not be deleted.");
    }

    $deleteContentStmt->close();

    /*
      Database সব ঠিক থাকলে আগে commit হবে।
      এরপর physical files delete হবে।
    */
    $mysqli->commit();

    $deletedFiles = [];
    $missingFiles = [];

    // New structure: delete entire uploads/contents/{contentId}/ folder
    $contentFolderAbs = $projectRoot . '/uploads/contents/' . $contentId . '/';
    if (is_dir($contentFolderAbs)) {
        // Recursively delete the folder
        $items = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($contentFolderAbs, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($items as $item) {
            $item->isDir() ? rmdir($item->getRealPath()) : @unlink($item->getRealPath());
        }
        @rmdir($contentFolderAbs);
        $deletedFiles[] = 'uploads/contents/' . $contentId . '/';
    } else {
        // Fallback: delete individual files (old flat-folder structure)
        foreach ($pathsToDelete as $relativePath) {
            $parsedPath = parse_url($relativePath, PHP_URL_PATH);
            if (!$parsedPath) $parsedPath = $relativePath;
            $cleanPath = ltrim($parsedPath, '/');
            if (str_contains($cleanPath, '..') || !str_starts_with($cleanPath, 'uploads/')) {
                continue;
            }
            $absolutePath = $projectRoot . '/' . $cleanPath;
            if (file_exists($absolutePath) && is_file($absolutePath)) {
                if (@unlink($absolutePath)) $deletedFiles[] = $cleanPath;
                else $missingFiles[] = 'Could not delete: ' . $cleanPath;
            } else {
                $missingFiles[] = 'Not found: ' . $cleanPath;
            }
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Rejected content deleted successfully.",
        "deleted_content_id" => $contentId,
        "deleted_files" => $deletedFiles,
        "file_warnings" => $missingFiles,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    $mysqli->rollback();

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}