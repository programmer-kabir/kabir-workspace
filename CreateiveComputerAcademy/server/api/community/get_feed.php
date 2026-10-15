<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/CommunityDbHelper.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$viewer_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$category = isset($_GET['category']) ? strtolower(trim($_GET['category'])) : 'all';
$filter = isset($_GET['filter']) ? strtolower(trim($_GET['filter'])) : 'all';
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 15;
$offset = ($page - 1) * $limit;

try {
    CommunityDbHelper::ensureSchema($db);

    $where = ["p.status = 'active'"];
    $params = [':viewer_id' => $viewer_id];

    if ($category !== 'all' && !empty($category)) {
        $where[] = "LOWER(p.category) = :category";
        $params[':category'] = $category;
    }

    if ($filter === 'pinned') {
        $where[] = "p.is_pinned = 1";
    } elseif ($filter === 'my_posts' && $viewer_id > 0) {
        $where[] = "p.user_id = :my_user_id";
        $params[':my_user_id'] = $viewer_id;
    }

    $whereClause = implode(" AND ", $where);

    // Fetch posts
    $sql = "
        SELECT p.id, p.user_id, p.content, p.category, p.image_url, p.is_pinned,
               p.likes_count, p.comments_count, p.status, p.created_at, p.updated_at,
               u.name AS author_name,
               COALESCE(u.username, CONCAT('user_', u.id)) AS author_username,
               u.profile_picture AS author_avatar,
               COALESCE(MIN(ur.role), 'staff') AS author_role,
               COALESCE(MAX(e.designation), 'Academy Member') AS author_designation,
               COALESCE(MAX(d.name), 'Creative Computer Academy') AS author_department,
               (SELECT reaction_type FROM community_likes WHERE post_id = p.id AND user_id = :viewer_id LIMIT 1) AS my_reaction,
               (SELECT COUNT(*) FROM community_likes WHERE post_id = p.id) AS real_likes_count,
               (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS real_comments_count
        FROM community_posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE $whereClause
        GROUP BY p.id
        ORDER BY p.is_pinned DESC, p.created_at DESC
        LIMIT $offset, " . ($limit + 1) . "
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $has_more = count($rows) > $limit;
    if ($has_more) {
        array_pop($rows);
    }

    // Collect post IDs for batch comment preview
    $postIds = array_column($rows, 'id');
    $commentsByPost = [];

    if (!empty($postIds)) {
        $inPostIds = implode(',', array_map('intval', $postIds));
        $commentSql = "
            SELECT c.id, c.post_id, c.user_id, c.parent_id, c.comment, c.created_at,
                   u.name AS user_name,
                   COALESCE(u.username, CONCAT('user_', u.id)) AS user_username,
                   u.profile_picture AS user_avatar,
                   COALESCE(MIN(ur.role), 'staff') AS user_role
            FROM community_comments c
            INNER JOIN users u ON c.user_id = u.id
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE c.post_id IN ($inPostIds)
            GROUP BY c.id
            ORDER BY c.created_at ASC
        ";
        $commentStmt = $db->query($commentSql);
        $allComments = $commentStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($allComments as $c) {
            $pid = (int)$c['post_id'];
            if (!isset($commentsByPost[$pid])) {
                $commentsByPost[$pid] = [];
            }
            $commentsByPost[$pid][] = [
                "id" => (int)$c['id'],
                "post_id" => $pid,
                "user_id" => (int)$c['user_id'],
                "parent_id" => $c['parent_id'] ? (int)$c['parent_id'] : null,
                "comment" => $c['comment'],
                "created_at" => $c['created_at'],
                "author" => [
                    "id" => (int)$c['user_id'],
                    "name" => $c['user_name'],
                    "username" => $c['user_username'],
                    "avatar" => $c['user_avatar'],
                    "role" => $c['user_role']
                ]
            ];
        }
    }

    $posts = [];
    foreach ($rows as $r) {
        $pid = (int)$r['id'];
        $posts[] = [
            "id" => $pid,
            "content" => $r['content'],
            "category" => $r['category'],
            "image_url" => $r['image_url'],
            "is_pinned" => (int)$r['is_pinned'],
            "likes_count" => (int)$r['real_likes_count'],
            "comments_count" => (int)$r['real_comments_count'],
            "my_reaction" => $r['my_reaction'] ?: null,
            "created_at" => $r['created_at'],
            "author" => [
                "id" => (int)$r['user_id'],
                "name" => $r['author_name'],
                "username" => $r['author_username'],
                "role" => $r['author_role'],
                "avatar" => $r['author_avatar'],
                "designation" => $r['author_designation'],
                "department" => $r['author_department']
            ],
            "comments" => $commentsByPost[$pid] ?? []
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => $posts,
        "page" => $page,
        "limit" => $limit,
        "has_more" => $has_more
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to load community feed: " . $e->getMessage()
    ]);
}
