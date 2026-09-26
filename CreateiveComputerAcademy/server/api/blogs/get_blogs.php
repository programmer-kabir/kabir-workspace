<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BlogDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BlogDbHelper::ensureSchema($db);

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$category = isset($_GET['category']) ? trim($_GET['category']) : 'all';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : 'published';
$role = isset($_GET['role']) ? strtolower(trim($_GET['role'])) : 'staff';

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
$offset = ($page - 1) * $limit;

try {
    $where = [];
    $params = [];

    // Role-based status filter: staff only sees published blogs
    if ($role !== 'admin') {
        $where[] = "b.status = 'published'";
    } elseif ($status !== 'all') {
        $where[] = "b.status = :status";
        $params[':status'] = $status;
    }

    if ($category !== 'all' && !empty($category)) {
        $where[] = "b.category = :category";
        $params[':category'] = $category;
    }

    if (!empty($search)) {
        $where[] = "(b.title LIKE :search OR b.summary LIKE :search OR b.content LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    // Count query
    $countSql = "SELECT COUNT(*) as total FROM academy_blogs b {$whereClause}";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Main fetch query (Pinned posts always come first, then latest created_at)
    $sql = "SELECT 
                b.id, b.title, b.slug, b.category, b.cover_image, b.summary, b.author_id,
                b.status, b.is_pinned, b.views_count, b.read_time_mins, b.published_at, b.created_at, b.updated_at,
                u.name as author_name, u.profile_picture as author_avatar,
                (SELECT COUNT(*) FROM blog_comments bc WHERE bc.blog_id = b.id) as comments_count,
                (SELECT COUNT(*) FROM blog_reactions br WHERE br.blog_id = b.id) as reactions_count,
                (SELECT COUNT(*) FROM blog_reads brd WHERE brd.blog_id = b.id) as readers_count,
                " . ($user_id > 0 ? "(SELECT COUNT(*) FROM blog_reads brd_u WHERE brd_u.blog_id = b.id AND brd_u.user_id = {$user_id}) > 0" : "0") . " as is_read,
                " . ($user_id > 0 ? "(SELECT reaction_type FROM blog_reactions br_u WHERE br_u.blog_id = b.id AND br_u.user_id = {$user_id} LIMIT 1)" : "NULL") . " as user_reaction
            FROM academy_blogs b
            LEFT JOIN users u ON b.author_id = u.id
            {$whereClause}
            ORDER BY b.is_pinned DESC, b.created_at DESC
            LIMIT :offset, :limit";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format boolean fields and dates
    foreach ($blogs as &$blog) {
        $blog['id'] = (int)$blog['id'];
        $blog['is_pinned'] = (bool)$blog['is_pinned'];
        $blog['is_read'] = (bool)$blog['is_read'];
        $blog['comments_count'] = (int)$blog['comments_count'];
        $blog['reactions_count'] = (int)$blog['reactions_count'];
        $blog['readers_count'] = (int)$blog['readers_count'];
        $blog['views_count'] = (int)$blog['views_count'];
        $blog['read_time_mins'] = (int)$blog['read_time_mins'];
    }

    echo json_encode([
        "status" => "success",
        "data" => $blogs,
        "pagination" => [
            "total" => $totalCount,
            "page" => $page,
            "limit" => $limit,
            "total_pages" => ceil($totalCount / $limit)
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
