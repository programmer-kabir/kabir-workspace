<?php
require_once __DIR__ . '/../config/cors.php';
ini_set("display_errors", 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php'; // Applies JWT auth
require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contrib_contents', 120, 60);

$user = $GLOBALS['user'] ?? null;
if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Authentication required"]);
    exit;
}

// Ensure the author_id is strictly bound to the authenticated user
$author_id = 0;
$stmt = $mysqli->prepare("SELECT authors.id FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ? LIMIT 1");
if ($stmt) {
    $stmt->bind_param("s", $user['email']);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows > 0) {
        $author_id = $res->fetch_assoc()['id'];
    }
    $stmt->close();
}

if ($author_id === 0) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Author profile not found"]);
    exit;
}








// ─── Status Filter ───────────────────────────────────────────────
$allowed_statuses = ['all', 'published', 'pending', 'rejected', 'draft', 'exclusive_buyout'];
$status = isset($_GET['status']) && in_array($_GET['status'], $allowed_statuses)
    ? $_GET['status']
    : 'published';

// ─── Pagination ──────────────────────────────────────────────────
$limit  = isset($_GET['limit'])  ? max(1, (int)$_GET['limit'])  : 50;
$page   = isset($_GET['page'])   ? max(1, (int)$_GET['page'])   : 1;
$offset = ($page - 1) * $limit;

// ─── WHERE Clause ────────────────────────────────────────────────
$whereConditions = ["c.author_id = $author_id"];

if ($status !== 'all') {
    $whereConditions[] = "c.status = '" . $mysqli->real_escape_string($status) . "'";
}

if (!empty($_GET['category_id'])) {
    $whereConditions[] = "c.main_category_id = " . (int)$_GET['category_id'];
}
if (!empty($_GET['subcategory_id'])) {
    $whereConditions[] = "c.subcategory_id = " . (int)$_GET['subcategory_id'];
}
if (!empty($_GET['license_type']) && $_GET['license_type'] !== 'all') {
}

$where = "WHERE " . implode(" AND ", $whereConditions);

// ─── Total Count (pagination-এর জন্য) ───────────────────────────
$countSql = "SELECT COUNT(*) AS total FROM contents c $where";
$countResult = $mysqli->query($countSql);
$totalRow = $countResult->fetch_assoc();
$total = (int)$totalRow['total'];
$totalPages = (int)ceil($total / $limit);

// ─── Per-Status Counts (stats cards-এর জন্য) ────────────────────
$statusCounts = [];
foreach (['published', 'pending', 'rejected', 'draft', 'exclusive_buyout'] as $s) {
    $r = $mysqli->query("SELECT COUNT(*) AS c FROM contents WHERE author_id = $author_id AND status = '$s'");
    $statusCounts[$s] = $r ? (int)$r->fetch_assoc()['c'] : 0;
}

// ─── Main Query ──────────────────────────────────────────────────
$sortClause = (!empty($_GET['sort']) && $_GET['sort'] === 'Most Popular') ? 'c.views_count DESC, c.id DESC' : 'c.id DESC';

$sql = "
    SELECT
        c.id,
        c.author_id,
        c.main_category_id,
        c.subcategory_id,
        c.title,
        c.slug,
        c.description,
        c.preview_image,
        c.watermarked_preview_image,
        c.watermarked_preview_video,
        c.thumbnail_url,
        c.preview_600_url,
        c.preview_1200_url,
        c.author_preview_url,
        c.views_count,
        c.downloads_count,
        c.likes_count,
        c.content_type,
        c.is_premium,
        c.license_type,
        c.ai_generated,
        c.width,
        c.height,
        c.orientation,
        c.dominant_color,
        c.status,
        c.rejection_reason,
        c.reviewed_by,
        c.reviewed_at,
        c.reviewer_note,
        c.published_at,
        c.updated_at,
        c.created_at,

        main_file.file_url AS image_url,
        main_file.file_name,
        main_file.file_type,

        GROUP_CONCAT(
            CASE
                WHEN t.id IS NOT NULL THEN CONCAT(t.id, '::', t.name, '::', t.slug)
            END
            SEPARATOR '||'
        ) AS tags_concat

    FROM contents c

    LEFT JOIN (
        SELECT content_id, MAX(file_url) as file_url, MAX(file_name) as file_name, MAX(file_type) as file_type
        FROM content_files
        WHERE is_main_file = 1
        GROUP BY content_id
    ) main_file ON main_file.content_id = c.id

    LEFT JOIN content_tags ct
        ON ct.content_id = c.id

    LEFT JOIN tags t
        ON t.id = ct.tag_id

    $where

    GROUP BY
        c.id, c.author_id, c.main_category_id, c.subcategory_id,
        c.title, c.slug, c.description, c.preview_image,
        c.watermarked_preview_image, c.watermarked_preview_video,
        c.thumbnail_url, c.preview_600_url, c.preview_1200_url, c.author_preview_url,
        c.views_count, c.downloads_count,
        c.likes_count, c.content_type, c.is_premium, c.license_type,
        c.ai_generated, c.width, c.height, c.orientation, c.dominant_color,
        c.status, c.rejection_reason, c.reviewed_by, c.reviewed_at,
        c.reviewer_note, c.published_at, c.updated_at, c.created_at,
        main_file.file_url, main_file.file_name, main_file.file_type

    ORDER BY $sortClause

    LIMIT $limit OFFSET $offset
";

$result = $mysqli->query($sql);

if (!$result) {
    echo json_encode([
        "success" => false,
        "message" => $mysqli->error,
        "data"    => []
    ]);
    exit;
}

// ─── Files Sub-Query ─────────────────────────────────────────────
$filesSql = "
    SELECT
        id, file_url, file_name, file_type,
        file_size, width, height, is_main_file
    FROM content_files
    WHERE content_id = ?
    ORDER BY is_main_file DESC, id ASC
";

$filesStmt = $mysqli->prepare($filesSql);
if (!$filesStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Files query error: " . $mysqli->error,
        "data"    => []
    ]);
    exit;
}

$contents = [];

while ($row = $result->fetch_assoc()) {

    // ─── Tags ─────────────────────────────────────────────────────
    $tags = [];
    if (!empty($row["tags_concat"])) {
        $seenIds = [];
        foreach (explode('||', $row["tags_concat"]) as $ts) {
            $parts = explode('::', $ts);
            if (count($parts) === 3) {
                $tagId = (int)$parts[0];
                if (!isset($seenIds[$tagId])) {
                    $tags[]         = ['id' => $tagId, 'name' => $parts[1], 'slug' => $parts[2]];
                    $seenIds[$tagId] = true;
                }
            }
        }
    }

    // ─── Files ────────────────────────────────────────────────────
    $files = [];
    $filesStmt->bind_param("i", $row["id"]);
    $filesStmt->execute();
    $filesResult = $filesStmt->get_result();

    while ($file = $filesResult->fetch_assoc()) {
        $files[] = [
            "id"           => (int)$file["id"],
            "file_url"     => $file["file_url"],
            "file_name"    => $file["file_name"],
            "file_type"    => $file["file_type"],
            "file_size"    => $file["file_size"],
            "width"        => $file["width"]  ? (int)$file["width"]  : null,
            "height"       => $file["height"] ? (int)$file["height"] : null,
            "is_main_file" => (bool)$file["is_main_file"],
        ];
    }

    $contents[] = [
        "id"                        => (int)$row["id"],
        "author_id"                 => (int)$row["author_id"],
        "main_category_id"          => $row["main_category_id"] ? (int)$row["main_category_id"] : null,
        "subcategory_id"            => $row["subcategory_id"]   ? (int)$row["subcategory_id"]   : null,
        "title"                     => $row["title"],
        "slug"                      => $row["slug"],
        "description"               => $row["description"],
        "preview_image"             => $row["preview_image"],
        "watermarked_preview_image" => $row["watermarked_preview_image"],
        "watermarked_preview_video" => $row["watermarked_preview_video"] ?? null,
        "thumbnail_url"             => $row["thumbnail_url"] ?? null,
        "preview_600_url"           => $row["preview_600_url"] ?? null,
        "preview_1200_url"          => $row["preview_1200_url"] ?? null,
        "author_preview_url"        => $row["author_preview_url"] ?? null,
        "views_count"               => (int)$row["views_count"],
        "downloads_count"           => (int)$row["downloads_count"],
        "likes_count"               => (int)$row["likes_count"],
        "content_type"              => $row["content_type"],
        "is_premium"                => (bool)$row["is_premium"],
        "license_type"              => $row["license_type"],
        "ai_generated"              => (bool)$row["ai_generated"],
        "width"                     => (int)$row["width"],
        "height"                    => (int)$row["height"],
        "orientation"               => $row["orientation"],
        "dominant_color"            => $row["dominant_color"],
        "status"                    => $row["status"],
        "rejection_reason"          => $row["rejection_reason"],
        "reviewed_by"               => $row["reviewed_by"] ? (int)$row["reviewed_by"] : null,
        "reviewed_at"               => $row["reviewed_at"],
        "reviewer_note"             => $row["reviewer_note"],
        "published_at"              => $row["published_at"],
        "created_at"                => $row["created_at"],
        "image_url"                 => $row["image_url"],
        "file_name"                 => $row["file_name"],
        "file_type"                 => $row["file_type"],
        "tags"                      => array_values(array_filter($tags)),
        "files"                     => $files,
    ];
}

$filesStmt->close();

echo json_encode([
    "success"       => true,
    "total"         => $total,
    "page"          => $page,
    "limit"         => $limit,
    "total_pages"   => $totalPages,
    "status_counts" => $statusCounts,
    "count"         => count($contents),
    "data"          => $contents
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

