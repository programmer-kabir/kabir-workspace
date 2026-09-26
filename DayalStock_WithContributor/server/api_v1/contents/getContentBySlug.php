<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents', 120, 60);

$slug = isset($_GET['slug']) ? $mysqli->real_escape_string(trim($_GET['slug'])) : '';

if (empty($slug)) {
    echo json_encode(["success" => false, "message" => "Slug is required", "data" => null]);
    exit;
}

// Only fetch published content from active authors via this public detail API
$where = "WHERE c.slug = '$slug' AND c.status = 'published' AND COALESCE(u.status, u_direct.status, 'active') = 'active'";

$sql = "
    SELECT
        c.id, c.author_id, c.main_category_id, c.subcategory_id,
        c.title, c.slug, c.description, c.preview_image,
        c.watermarked_preview_image, c.watermarked_preview_video,
        c.thumbnail_url, c.preview_600_url, c.preview_1200_url, c.author_preview_url,
        c.views_count, c.downloads_count, c.likes_count,
        c.content_type, c.is_premium, c.license_type,
        c.ai_generated, c.width, c.height, c.orientation, c.dominant_color,
        c.status, c.published_at, c.updated_at, c.created_at,

        GROUP_CONCAT(
            CASE
                WHEN t.id IS NOT NULL THEN CONCAT(t.id, '::', t.name, '::', t.slug)
            END
            SEPARATOR '||'
        ) AS tags_concat

    FROM contents c

    LEFT JOIN authors a ON a.id = c.author_id
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN users u_direct ON u_direct.id = c.author_id

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
        c.views_count, c.downloads_count, c.likes_count,
        c.content_type, c.is_premium, c.license_type,
        c.ai_generated, c.width, c.height, c.orientation, c.dominant_color,
        c.status, c.published_at, c.updated_at, c.created_at

    LIMIT 1
";

$result = $mysqli->query($sql);

if (!$result) {
    echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error, "data" => null]);
    exit;
}

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Content not found or not published", "data" => null]);
    exit;
}

$row = $result->fetch_assoc();

// ─── Tags ─────────────────────────────────────────────────────
$tags = [];
if (!empty($row["tags_concat"])) {
    $seenIds = [];
    foreach (explode('||', $row["tags_concat"]) as $ts) {
        $parts = explode('::', $ts);
        if (count($parts) === 3) {
            $tagId = (int)$parts[0];
            if (!isset($seenIds[$tagId])) {
                $tags[] = ['id' => $tagId, 'name' => $parts[1], 'slug' => $parts[2]];
                $seenIds[$tagId] = true;
            }
        }
    }
}

// ─── Safe Files Metadata (No private URLs) ────────────────────
$filesSql = "
    SELECT
        id, file_name, file_type, file_size, width, height, is_main_file
    FROM content_files
    WHERE content_id = ?
    ORDER BY is_main_file DESC, id ASC
";

$filesStmt = $mysqli->prepare($filesSql);
$files = [];

if ($filesStmt) {
    $filesStmt->bind_param("i", $row["id"]);
    $filesStmt->execute();
    $filesResult = $filesStmt->get_result();

    while ($file = $filesResult->fetch_assoc()) {
        $files[] = [
            "id"           => (int)$file["id"],
            // file_url is intentionally OMITTED for security
            "file_name"    => $file["file_name"],
            "file_type"    => $file["file_type"],
            "file_size"    => $file["file_size"],
            "width"        => $file["width"]  ? (int)$file["width"]  : null,
            "height"       => $file["height"] ? (int)$file["height"] : null,
            "is_main_file" => (bool)$file["is_main_file"],
        ];
    }
    $filesStmt->close();
}

$contentData = [
    "id"                        => (int)$row["id"],
    "author_id"                 => (int)$row["author_id"],
    "main_category_id"          => $row["main_category_id"] ? (int)$row["main_category_id"] : null,
    "subcategory_id"            => $row["subcategory_id"]   ? (int)$row["subcategory_id"]   : null,
    "title"                     => $row["title"],
    "slug"                      => $row["slug"],
    "description"               => $row["description"],
    "preview_image"             => $row["preview_image"],
    "watermarked_preview_image" => $row["watermarked_preview_image"],
    "watermarked_preview_video" => $row["watermarked_preview_video"],
    "thumbnail_url"             => $row["thumbnail_url"],
    "preview_600_url"           => $row["preview_600_url"],
    "preview_1200_url"          => $row["preview_1200_url"],
    "author_preview_url"        => $row["author_preview_url"],
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
    "published_at"              => $row["published_at"],
    "created_at"                => $row["created_at"],
    "tags"                      => array_values(array_filter($tags)),
    "files"                     => $files,
];

echo json_encode([
    "success" => true,
    "data"    => $contentData
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

