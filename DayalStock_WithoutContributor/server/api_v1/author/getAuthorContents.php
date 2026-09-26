<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

$authorId = isset($_GET["author_id"]) ? (int) $_GET["author_id"] : 0;
$status = isset($_GET["status"]) ? trim($_GET["status"]) : "";

/* Pagination */
$page = isset($_GET["page"]) ? (int) $_GET["page"] : 1;
$limit = isset($_GET["limit"]) ? (int) $_GET["limit"] : 50;

if ($page < 1) {
    $page = 1;
}

/* একবারে সর্বোচ্চ 100টা আনতে পারবে */
if ($limit < 1) {
    $limit = 50;
}

if ($limit > 100) {
    $limit = 100;
}

$offset = ($page - 1) * $limit;

$allowedStatuses = ["pending", "rejected", "published", "draft", "exclusive_buyout"];

if ($authorId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "author_id is required.",
        "data" => []
    ]);
    exit;
}

if ($status !== "" && !in_array($status, $allowedStatuses, true)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid status.",
        "data" => []
    ]);
    exit;
}

if ($status !== 'published' && $status !== 'exclusive_buyout') {
    require_once __DIR__ . '/../middleware/auth.php';
    
    $userEmail = $GLOBALS['user']['email'] ?? null;
    $roles = $GLOBALS['user']['roles'] ?? [];
    
    if (!in_array('admin', $roles)) {
        $authStmt = $mysqli->prepare("SELECT authors.id FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ? LIMIT 1");
        $authStmt->bind_param("s", $userEmail);
        $authStmt->execute();
        $authRes = $authStmt->get_result();
        
        if ($authRes->num_rows === 0 || ((int)$authRes->fetch_assoc()['id']) !== $authorId) {
            echo json_encode(["success" => false, "message" => "Unauthorized to view non-published content."]);
            exit;
        }
        $authStmt->close();
    }
}

/* আগে total count বের করবে */
$countSql = "
    SELECT COUNT(*) AS total
    FROM contents c
    WHERE c.author_id = ?
      AND (? = '' OR c.status = ?)
";

$countStmt = $mysqli->prepare($countSql);

if (!$countStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Count query error: " . $mysqli->error,
        "data" => []
    ]);
    exit;
}

$countStmt->bind_param("iss", $authorId, $status, $status);
$countStmt->execute();

$countResult = $countStmt->get_result();
$countRow = $countResult->fetch_assoc();

$total = (int) $countRow["total"];
$totalPages = $total > 0 ? (int) ceil($total / $limit) : 0;

$countStmt->close();

/* শুধু current page-এর 50টা content আনবে */
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
        c.watermarked_preview_video,
        c.author_preview_url,
        c.content_type,
        c.is_premium,
        c.license_type,
        c.ai_generated,
        c.width,
        c.height,
        c.orientation,
        c.dominant_color,
        c.status,
        c.views_count,
        c.downloads_count,
        c.likes_count,

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

        CONCAT(
            '[',
            COALESCE(
                GROUP_CONCAT(
                    DISTINCT CASE
                        WHEN t.id IS NOT NULL THEN JSON_OBJECT(
                            'id', t.id,
                            'name', t.name,
                            'slug', t.slug
                        )
                    END
                    SEPARATOR ','
                ),
                ''
            ),
            ']'
        ) AS tags_json

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

    WHERE c.author_id = ?
      AND (? = '' OR c.status = ?)

    GROUP BY
        c.id,
        c.author_id,
        c.main_category_id,
        c.subcategory_id,
        c.title,
        c.slug,
        c.description,
        c.preview_image,
        c.watermarked_preview_video,
        c.author_preview_url,
        c.content_type,
        c.is_premium,
        c.license_type,
        c.ai_generated,
        c.width,
        c.height,
        c.orientation,
        c.dominant_color,
        c.status,
        c.views_count,
        c.downloads_count,
        c.likes_count,
        c.rejection_reason,
        c.reviewed_by,
        c.reviewed_at,
        c.reviewer_note,
        c.published_at,
        c.updated_at,
        c.created_at,
        main_file.file_url,
        main_file.file_name,
        main_file.file_type

    ORDER BY c.id DESC
    LIMIT ? OFFSET ?
";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Contents query error: " . $mysqli->error,
        "data" => []
    ]);
    exit;
}

/*
  author_id = i
  status = s
  status = s
  limit = i
  offset = i
*/
$stmt->bind_param(
    "issii",
    $authorId,
    $status,
    $status,
    $limit,
    $offset
);

$stmt->execute();

$result = $stmt->get_result();

$filesSql = "
    SELECT
        id,
        file_url,
        file_name,
        file_type,
        file_size,
        width,
        height,
        is_main_file
    FROM content_files
    WHERE content_id = ?
    ORDER BY is_main_file DESC, id ASC
";

$filesStmt = $mysqli->prepare($filesSql);

if (!$filesStmt) {
    echo json_encode([
        "success" => false,
        "message" => "Files query error: " . $mysqli->error,
        "data" => []
    ]);
    exit;
}

$contents = [];

while ($row = $result->fetch_assoc()) {
    $tags = json_decode($row["tags_json"], true);

    if (!is_array($tags)) {
        $tags = [];
    }

    $tags = array_values(array_filter($tags));

    $files = [];
    $contentId = (int) $row["id"];

    $filesStmt->bind_param("i", $contentId);
    $filesStmt->execute();

    $filesResult = $filesStmt->get_result();

    while ($file = $filesResult->fetch_assoc()) {
        $files[] = [
            "id" => (int) $file["id"],
            "file_url" => $file["file_url"],
            "file_name" => $file["file_name"],
            "file_type" => $file["file_type"],
            "file_size" => $file["file_size"] ? (int) $file["file_size"] : null,
            "width" => $file["width"] ? (int) $file["width"] : null,
            "height" => $file["height"] ? (int) $file["height"] : null,
            "is_main_file" => (bool) $file["is_main_file"]
        ];
    }

    $contents[] = [
        "id" => (int) $row["id"],
        "author_id" => (int) $row["author_id"],

        "main_category_id" => $row["main_category_id"]
            ? (int) $row["main_category_id"]
            : null,

        "subcategory_id" => $row["subcategory_id"]
            ? (int) $row["subcategory_id"]
            : null,

        "title" => $row["title"],
        "slug" => $row["slug"],
        "description" => $row["description"],
        "preview_image" => $row["preview_image"],
        "watermarked_preview_video" => $row["watermarked_preview_video"],
        "author_preview_url" => $row["author_preview_url"],

        "content_type" => $row["content_type"],
        "is_premium" => (bool) $row["is_premium"],
        "license_type" => $row["license_type"],
        "ai_generated" => (bool) $row["ai_generated"],

        "width" => $row["width"] ? (int) $row["width"] : null,
        "height" => $row["height"] ? (int) $row["height"] : null,
        "orientation" => $row["orientation"],
        "dominant_color" => $row["dominant_color"],

        "status" => $row["status"],
        "views_count" => (int)$row["views_count"],
        "downloads_count" => (int)$row["downloads_count"],
        "likes_count" => (int)$row["likes_count"],
        "rejection_reason" => $row["rejection_reason"],
        "reviewed_by" => $row["reviewed_by"]
            ? (int) $row["reviewed_by"]
            : null,
        "reviewed_at" => $row["reviewed_at"],
        "reviewer_note" => $row["reviewer_note"],
        "published_at" => $row["published_at"],

        "created_at" => $row["created_at"],
        "updated_at" => $row["updated_at"],

        "image_url" => $row["image_url"],
        "file_name" => $row["file_name"],
        "file_type" => $row["file_type"],

        "tags" => $tags,
        "files" => $files
    ];
}

$stmt->close();
$filesStmt->close();

echo json_encode([
    "success" => true,
    "author_id" => $authorId,
    "status" => $status,
    "page" => $page,
    "limit" => $limit,
    "total" => $total,
    "total_pages" => $totalPages,
    "has_next_page" => $page < $totalPages,
    "has_previous_page" => $page > 1,
    "count" => count($contents),
    "data" => $contents
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);