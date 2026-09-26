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

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

if (!$data || empty($data->id) || empty($data->title) || empty($data->content)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Blog ID, title, and content are required."]);
    exit;
}

$blog_id = (int)$data->id;
$title = trim($data->title);
$category = !empty($data->category) ? trim($data->category) : 'General';
$summary = !empty($data->summary) ? trim($data->summary) : null;
$content = trim($data->content);
$status = (!empty($data->status) && in_array(strtolower($data->status), ['published', 'draft'])) ? strtolower($data->status) : 'published';
$is_pinned = !empty($data->is_pinned) ? 1 : 0;
$cover_image = isset($data->cover_image) ? trim($data->cover_image) : null;

// Calculate estimated read time
$rawText = trim(strip_tags($content));
$wordCount = $rawText ? count(preg_split('/\s+/u', $rawText)) : 0;
$readTimeMins = max(1, (int)ceil($wordCount / 180));

$cleanTitle = preg_replace('/[^A-Za-z0-9-]+/', '-', $title);
$slug = strtolower(trim($cleanTitle, '-'));
if (empty($slug)) $slug = 'post-' . $blog_id;

$now = date('Y-m-d H:i:s');

try {
    $stmt = $db->prepare("UPDATE academy_blogs 
        SET title = :title, 
            slug = :slug, 
            category = :category, 
            cover_image = :cover_image, 
            summary = :summary, 
            content = :content, 
            status = :status, 
            is_pinned = :is_pinned, 
            read_time_mins = :read_time, 
            updated_at = :now 
        WHERE id = :id");

    $stmt->execute([
        ':title' => $title,
        ':slug' => $slug,
        ':category' => $category,
        ':cover_image' => $cover_image,
        ':summary' => $summary,
        ':content' => $content,
        ':status' => $status,
        ':is_pinned' => $is_pinned,
        ':read_time' => $readTimeMins,
        ':now' => $now,
        ':id' => $blog_id
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Blog post updated successfully!"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
