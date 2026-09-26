<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BlogDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

try {
    BlogDbHelper::ensureSchema($db);
} catch (Throwable $t) {}

$blog_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

if ($blog_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid Blog ID is required."]);
    exit;
}

$now = date('Y-m-d H:i:s');

try {
    // 1. Fetch Blog Record with author details and role from user_roles
    $stmt = $db->prepare("SELECT b.*, 
                                 u.name as author_name, 
                                 u.profile_picture as author_avatar, 
                                 COALESCE((SELECT role FROM user_roles WHERE user_id = u.id LIMIT 1), 'admin') as author_role 
                          FROM academy_blogs b 
                          LEFT JOIN users u ON b.author_id = u.id 
                          WHERE b.id = :id LIMIT 1");
    $stmt->execute([':id' => $blog_id]);
    $blog = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$blog) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Blog post not found."]);
        exit;
    }

    // 2. Increment Views Count
    try {
        $updViews = $db->prepare("UPDATE academy_blogs SET views_count = views_count + 1 WHERE id = :id");
        $updViews->execute([':id' => $blog_id]);
        $blog['views_count'] = (int)$blog['views_count'] + 1;
    } catch (Throwable $ve) {}

    // 3. Log Read Record if user_id is provided
    if ($user_id > 0) {
        try {
            $readStmt = $db->prepare("INSERT IGNORE INTO blog_reads (blog_id, user_id, read_at) VALUES (:blog_id, :user_id, :now)");
            $readStmt->execute([
                ':blog_id' => $blog_id,
                ':user_id' => $user_id,
                ':now' => $now
            ]);
        } catch (Throwable $re) {}
    }

    // 4. Fetch Comments List with user_roles join
    $commStmt = $db->prepare("SELECT bc.*, 
                                     u.name as user_name, 
                                     u.profile_picture as user_avatar, 
                                     COALESCE((SELECT role FROM user_roles WHERE user_id = u.id LIMIT 1), 'staff') as user_role 
                             FROM blog_comments bc 
                             LEFT JOIN users u ON bc.user_id = u.id 
                             WHERE bc.blog_id = :blog_id 
                             ORDER BY bc.created_at ASC");
    $commStmt->execute([':blog_id' => $blog_id]);
    $comments = $commStmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Fetch Reaction summary
    $reactionSummary = [];
    try {
        $reactStmt = $db->prepare("SELECT reaction_type, COUNT(*) as count 
                                   FROM blog_reactions 
                                   WHERE blog_id = :blog_id 
                                   GROUP BY reaction_type");
        $reactStmt->execute([':blog_id' => $blog_id]);
        $reactionSummary = $reactStmt->fetchAll(PDO::FETCH_KEY_PAIR);
    } catch (Throwable $re) {}

    // Check user's own reaction
    $userReaction = null;
    if ($user_id > 0) {
        try {
            $uReactStmt = $db->prepare("SELECT reaction_type FROM blog_reactions WHERE blog_id = :blog_id AND user_id = :user_id LIMIT 1");
            $uReactStmt->execute([':blog_id' => $blog_id, ':user_id' => $user_id]);
            $uRow = $uReactStmt->fetch(PDO::FETCH_ASSOC);
            if ($uRow) $userReaction = $uRow['reaction_type'];
        } catch (Throwable $ue) {}
    }

    // Total readers count
    $readersCount = 0;
    try {
        $readersStmt = $db->prepare("SELECT COUNT(*) as count FROM blog_reads WHERE blog_id = :blog_id");
        $readersStmt->execute([':blog_id' => $blog_id]);
        $row = $readersStmt->fetch(PDO::FETCH_ASSOC);
        if ($row) $readersCount = (int)$row['count'];
    } catch (Throwable $rce) {}

    $blog['id'] = (int)$blog['id'];
    $blog['is_pinned'] = (bool)$blog['is_pinned'];
    $blog['read_time_mins'] = (int)$blog['read_time_mins'];
    $blog['readers_count'] = $readersCount;
    $blog['is_read'] = ($user_id > 0);
    $blog['user_reaction'] = $userReaction;
    $blog['reactions_summary'] = $reactionSummary;
    $blog['comments'] = $comments;

    echo json_encode([
        "status" => "success",
        "data" => $blog
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
