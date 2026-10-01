<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'contents', 120, 60);

// Only allow published for public bulk API
$status = 'published';

// ─── Pagination ──────────────────────────────────────────────────
$limit  = isset($_GET['limit'])  ? min(50, max(1, (int)$_GET['limit']))  : 50; // Hard limit to 50 for public API
$page   = isset($_GET['page'])   ? max(1, (int)$_GET['page'])   : 1;
$offset = ($page - 1) * $limit;

// ─── WHERE Clause ────────────────────────────────────────────────
$whereConditions = [
    "c.status = 'published'"
];

if (!empty($_GET['category_id'])) {
    $whereConditions[] = "c.main_category_id = " . (int)$_GET['category_id'];
}
if (!empty($_GET['subcategory_id'])) {
    $whereConditions[] = "c.subcategory_id = " . (int)$_GET['subcategory_id'];
}
if (!empty($_GET['license_type']) && $_GET['license_type'] !== 'all') {
    $lic = strtolower(trim($_GET['license_type']));
    if ($lic === 'free') {
        $whereConditions[] = "(c.license_type = 'free' OR c.is_premium = 0)";
    } elseif ($lic === 'premium' || $lic === 'pro') {
        $whereConditions[] = "(c.license_type = 'premium' OR c.is_premium = 1)";
    } else {
        $whereConditions[] = "c.license_type = '" . $mysqli->real_escape_string($lic) . "'";
    }
}
if (isset($_GET['is_premium']) && $_GET['is_premium'] !== '' && $_GET['is_premium'] !== 'all') {
    $isPrem = ($_GET['is_premium'] === '1' || $_GET['is_premium'] === 'true' || $_GET['is_premium'] === 'pro') ? 1 : 0;
    $whereConditions[] = "c.is_premium = $isPrem";
}
if (!empty($_GET['ai_generated']) && $_GET['ai_generated'] !== 'all') {
    $ai_val = ($_GET['ai_generated'] === 'true' || $_GET['ai_generated'] === '1' || $_GET['ai_generated'] === 'yes') ? 1 : 0;
    $whereConditions[] = "c.ai_generated = $ai_val";
}
if (!empty($_GET['orientation']) && $_GET['orientation'] !== 'all') {
    $ori = strtolower(trim($_GET['orientation']));
    if ($ori === 'landscape' || $ori === 'horizontal') {
        $whereConditions[] = "c.orientation IN ('horizontal', 'landscape', 'panoramic')";
    } elseif ($ori === 'portrait' || $ori === 'vertical') {
        $whereConditions[] = "c.orientation IN ('vertical', 'portrait')";
    } elseif ($ori === 'square') {
        $whereConditions[] = "c.orientation = 'square'";
    } else {
        $whereConditions[] = "c.orientation = '" . $mysqli->real_escape_string($ori) . "'";
    }
}
if (!empty($_GET['color']) || !empty($_GET['dominant_color'])) {
    $colorVal = $mysqli->real_escape_string(ltrim($_GET['color'] ?? $_GET['dominant_color'], '#'));
    $whereConditions[] = "c.dominant_color LIKE '%$colorVal%'";
}
if (!empty($_GET['content_type']) && strtolower($_GET['content_type']) !== 'all') {
    $whereConditions[] = "c.content_type = '" . $mysqli->real_escape_string(strtolower($_GET['content_type'])) . "'";
}
if (!empty($_GET['search'])) {
    $search = $mysqli->real_escape_string($_GET['search']);
    $whereConditions[] = "(c.title LIKE '%$search%' OR c.description LIKE '%$search%')";
}

$where = "WHERE " . implode(" AND ", $whereConditions);

// ─── Total Count (pagination-এর জন্য) ───────────────────────────
$countSql = "
    SELECT COUNT(c.id) AS total 
    FROM contents c
    $where
";
$countResult = $mysqli->query($countSql);
$totalRow = $countResult->fetch_assoc();
$total = (int)$totalRow['total'];
$totalPages = (int)ceil($total / $limit);

// ─── Main Query ──────────────────────────────────────────────────
$sql = "
    SELECT
        c.id, c.main_category_id, c.subcategory_id,
        c.title, c.slug, c.description, c.preview_image,
        c.watermarked_preview_image, c.watermarked_preview_video,
        c.thumbnail_url, c.preview_600_url, c.preview_1200_url,
        c.views_count, c.downloads_count, c.likes_count, c.content_type,
        c.is_premium, c.license_type, c.ai_generated, c.width, c.height,
        c.orientation, c.dominant_color, c.status, c.published_at,
        c.updated_at, c.created_at,

        'PikSea Studio' AS author_name,
        '' AS author_username,
        '' AS author_avatar,
        '' AS author_email,

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

    GROUP BY c.id
    
    ORDER BY " . (function() {
        $sort = strtolower(trim($_GET['sort'] ?? ''));
        if ($sort === 'popular' || $sort === 'most popular' || $sort === 'downloads') {
            return 'c.downloads_count DESC, c.views_count DESC, c.id DESC';
        } elseif ($sort === 'trending' || $sort === 'views') {
            return '(c.downloads_count * 2 + c.views_count) DESC, c.id DESC';
        } elseif ($sort === 'oldest') {
            return 'c.id ASC';
        }
        return 'c.id DESC';
    })() . "

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
                    $tags[] = ['id' => $tagId, 'name' => $parts[1], 'slug' => $parts[2]];
                    $seenIds[$tagId] = true;
                }
            }
        }
    }

    $contents[] = [
        "id"                        => (int)$row["id"],
        "author_id"                 => 1,
        "author_name"               => $row["author_name"],
        "author_username"           => $row["author_username"],
        "author_avatar"             => $row["author_avatar"],
        "author_email"              => $row["author_email"],
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
        "image_url"                 => $row["image_url"],
        "file_name"                 => $row["file_name"],
        "file_type"                 => $row["file_type"],
        "tags"                      => array_values(array_filter($tags))
        // 'files' is explicitly omitted
    ];
}

echo json_encode([
    "success"       => true,
    "total"         => $total,
    "page"          => $page,
    "limit"         => $limit,
    "total_pages"   => $totalPages,
    "count"         => count($contents),
    "data"          => $contents
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
