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

$blog_id = isset($_GET['blog_id']) ? (int)$_GET['blog_id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

if ($blog_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid Blog ID is required."]);
    exit;
}

try {
    // 1. Fetch Blog Record
    $bStmt = $db->prepare("SELECT id, title, created_at FROM academy_blogs WHERE id = :id LIMIT 1");
    $bStmt->execute([':id' => $blog_id]);
    $blog = $bStmt->fetch(PDO::FETCH_ASSOC);

    if (!$blog) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Blog post not found."]);
        exit;
    }

    // 2. Fetch all active staff members with their read timestamp if they read it
    $query = "SELECT 
                u.id as user_id, 
                u.name as staff_name, 
                u.email, 
                u.profile_picture as avatar, 
                COALESCE(e.designation, 'Staff Member') as designation, 
                br.read_at,
                (br.read_at IS NOT NULL) as has_read
              FROM users u
              INNER JOIN user_roles ur ON u.id = ur.user_id
              LEFT JOIN employees e ON u.id = e.user_id
              LEFT JOIN blog_reads br ON br.blog_id = :blog_id AND br.user_id = u.id
              WHERE ur.role IN ('staff', 'manager', 'instructor', 'reviewer', 'employee')
                AND (u.status = 'active' OR u.status IS NULL)
              ORDER BY has_read DESC, br.read_at DESC, u.name ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([':blog_id' => $blog_id]);
    $readers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fallback if no specific staff found by role
    if (empty($readers)) {
        $fallbackQuery = "SELECT 
                            u.id as user_id, 
                            u.name as staff_name, 
                            u.email, 
                            u.profile_picture as avatar, 
                            COALESCE(e.designation, 'Staff Member') as designation, 
                            br.read_at,
                            (br.read_at IS NOT NULL) as has_read
                          FROM users u
                          LEFT JOIN employees e ON u.id = e.user_id
                          LEFT JOIN blog_reads br ON br.blog_id = :blog_id AND br.user_id = u.id
                          WHERE u.status = 'active' OR u.status IS NULL
                          ORDER BY has_read DESC, br.read_at DESC, u.name ASC";
        $fStmt = $db->prepare($fallbackQuery);
        $fStmt->execute([':blog_id' => $blog_id]);
        $readers = $fStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    $totalStaff = count($readers);
    $readCount = 0;

    foreach ($readers as &$r) {
        $r['user_id'] = (int)$r['user_id'];
        $r['has_read'] = (bool)$r['has_read'];
        if ($r['has_read']) $readCount++;
    }

    $readPercentage = ($totalStaff > 0) ? round(($readCount / $totalStaff) * 100) : 0;

    echo json_encode([
        "status" => "success",
        "data" => [
            "blog" => $blog,
            "total_staff" => $totalStaff,
            "read_count" => $readCount,
            "unread_count" => ($totalStaff - $readCount),
            "read_percentage" => $readPercentage,
            "readers" => $readers
        ]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
