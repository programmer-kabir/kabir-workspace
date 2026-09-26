<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/PusherHelper.php';
require_once '../notifications/notification_helper.php';
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
} catch (Throwable $t) {
    // Ignore schema check error if already exists
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON payload."]);
    exit;
}

if (empty($data->title) || empty($data->content)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Post Title and Content are required."]);
    exit;
}

$title = trim($data->title);
$category = !empty($data->category) ? trim($data->category) : 'General';
$summary = !empty($data->summary) ? trim($data->summary) : null;
$content = trim($data->content);
$author_id = !empty($data->author_id) ? (int)$data->author_id : 1;
$status = (!empty($data->status) && in_array(strtolower($data->status), ['published', 'draft'])) ? strtolower($data->status) : 'published';
$is_pinned = !empty($data->is_pinned) ? 1 : 0;
$cover_image = !empty($data->cover_image) ? trim($data->cover_image) : null;

// Calculate estimated read time (approx 180 words per minute)
$rawText = trim(strip_tags($content));
$wordCount = $rawText ? count(preg_split('/\s+/u', $rawText)) : 0;
$readTimeMins = max(1, (int)ceil($wordCount / 180));

// Slug generation with random entropy to prevent duplicate key constraint
$cleanTitle = preg_replace('/[^A-Za-z0-9-]+/', '-', $title);
$slug = strtolower(trim($cleanTitle, '-'));
if (empty($slug)) $slug = 'post';
$slug .= '-' . time() . '-' . substr(bin2hex(random_bytes(3)), 0, 4);

$now = date('Y-m-d H:i:s');
$published_at = ($status === 'published') ? $now : null;

try {
    $stmt = $db->prepare("INSERT INTO academy_blogs 
        (title, slug, category, cover_image, summary, content, author_id, status, is_pinned, views_count, read_time_mins, published_at, created_at, updated_at) 
        VALUES (:title, :slug, :category, :cover_image, :summary, :content, :author_id, :status, :is_pinned, 0, :read_time, :published_at, :now, :now)");

    $stmt->execute([
        ':title' => $title,
        ':slug' => $slug,
        ':category' => $category,
        ':cover_image' => $cover_image,
        ':summary' => $summary,
        ':content' => $content,
        ':author_id' => $author_id,
        ':status' => $status,
        ':is_pinned' => $is_pinned,
        ':read_time' => $readTimeMins,
        ':published_at' => $published_at,
        ':now' => $now
    ]);

    $blog_id = $db->lastInsertId();

    // Fetch author details
    $author = ['name' => 'Admin'];
    try {
        $authStmt = $db->prepare("SELECT name, email, profile_picture as avatar FROM users WHERE id = :id LIMIT 1");
        $authStmt->execute([':id' => $author_id]);
        $row = $authStmt->fetch(PDO::FETCH_ASSOC);
        if ($row) $author = $row;
    } catch (Throwable $ae) {}

    // If published, broadcast via Pusher & NotificationHelper (Isolated from main flow)
    if ($status === 'published') {
        try {
            $payload = [
                'id' => $blog_id,
                'title' => $title,
                'category' => $category,
                'summary' => $summary,
                'cover_image' => $cover_image,
                'author_name' => $author['name'] ?? 'Admin',
                'published_at' => $published_at,
                'is_pinned' => $is_pinned
            ];
            PusherHelper::trigger('academy-feed', 'new-blog-published', $payload);
        } catch (Throwable $pe) {
            error_log("Pusher broadcast error: " . $pe->getMessage());
        }

        try {
            // Send notification to staff role
            NotificationHelper::sendToRole(
                $db,
                'staff',
                $author_id,
                "📢 New Academy Feed: " . $title,
                !empty($summary) ? $summary : "Admin published a new guideline/article in the Academy Feed.",
                "academy_feed",
                "staff",
                "/feed",
                $is_pinned ? "high" : "normal",
                ['blog_id' => $blog_id, 'title' => $title]
            );
        } catch (Throwable $ne) {
            error_log("Notification error: " . $ne->getMessage());
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "🎉 Academy blog post created successfully!",
        "blog_id" => $blog_id,
        "data" => [
            "id" => $blog_id,
            "title" => $title,
            "slug" => $slug,
            "category" => $category,
            "status" => $status,
            "read_time_mins" => $readTimeMins
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Database error: " . $e->getMessage(),
        "error" => $e->getMessage()
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Server error: " . $e->getMessage(),
        "error" => $e->getMessage()
    ]);
}
?>
