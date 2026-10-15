<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? ($_GET['token'] ?? ''));
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

// ── 1. Curated priority overrides with fine-tuned payloads ───────────────────
$curatedMap = [
    "api/chat/get_chat_users.php" => [
        "name" => "Get Chat Users",
        "category" => "Chat & Messages",
        "method" => "GET",
        "desc" => "Fetches list of active staff users and their online status for messaging.",
        "params" => []
    ],
    "api/chat/get_chats.php" => [
        "name" => "Get Chat History",
        "category" => "Chat & Messages",
        "method" => "POST",
        "desc" => "Retrieves message history between current user and target user.",
        "params" => ["target_user_id" => 1, "limit" => 20]
    ],
    "api/chat/send_message.php" => [
        "name" => "Send Chat Message",
        "category" => "Chat & Messages",
        "method" => "POST",
        "desc" => "Dispatches a direct chat message with Pusher real-time push.",
        "params" => ["receiver_id" => 1, "message" => "Test ping from CCA Developer Suite API Tester"]
    ],
    "api/community/get_feed.php" => [
        "name" => "Get Community Feed",
        "category" => "Community Feed",
        "method" => "GET",
        "desc" => "Fetches community wall feed posts with comments and reactions.",
        "params" => ["page" => 1, "limit" => 15]
    ],
    "api/community/toggle_like.php" => [
        "name" => "Toggle Post Like",
        "category" => "Community Feed",
        "method" => "POST",
        "desc" => "Likes or unlikes a community wall post.",
        "params" => ["post_id" => 1, "user_id" => 1, "reaction_type" => "like"]
    ],
    "api/community/add_comment.php" => [
        "name" => "Add Post Comment",
        "category" => "Community Feed",
        "method" => "POST",
        "desc" => "Adds a comment to a community post.",
        "params" => ["post_id" => 1, "comment" => "Automated probe comment from API Tester"]
    ],
    "api/attendance/get_daily_attendance.php" => [
        "name" => "Get Daily Attendance",
        "category" => "Attendance & Clock-in",
        "method" => "POST",
        "desc" => "Daily attendance roster for staff & students with clock-in/out times.",
        "params" => ["date" => date('Y-m-d')]
    ],
    "api/attendance/check_status.php" => [
        "name" => "Check Shift Status",
        "category" => "Attendance & Clock-in",
        "method" => "POST",
        "desc" => "Verifies whether logged-in staff is currently clocked in.",
        "params" => []
    ],
    "api/breaks/get_user_breaks.php" => [
        "name" => "Get User Breaks",
        "category" => "Breaks & Tiffin",
        "method" => "GET",
        "desc" => "Lists break logs and active break status for logged-in user.",
        "params" => []
    ],
    "api/breaks/start_break.php" => [
        "name" => "Start Break Session",
        "category" => "Breaks & Tiffin",
        "method" => "POST",
        "desc" => "Initiates a break interval (e.g. Lunch, Prayer, Tea, Tiffin).",
        "params" => ["break_type" => "Tea"]
    ],
    "api/tasks/get_tasks.php" => [
        "name" => "Get Staff Tasks",
        "category" => "Tasks & Workflow",
        "method" => "GET",
        "desc" => "Lists assigned tasks with priority, deadline, and completion status.",
        "params" => ["status" => "all"]
    ],
    "api/payroll/get_wallet_balance.php" => [
        "name" => "Get Wallet Balance",
        "category" => "Payroll & Wallet",
        "method" => "GET",
        "desc" => "Returns total earnings, approved payouts, and pending balance.",
        "params" => []
    ],
    "api/server_time.php" => [
        "name" => "Server Time & Timezone",
        "category" => "System & Diagnostics",
        "method" => "GET",
        "desc" => "Returns server runtime time, timezone offset, and timestamp.",
        "params" => []
    ],
    "api/developer/get_dev_status.php" => [
        "name" => "Developer Telemetry Status",
        "category" => "System & Diagnostics",
        "method" => "GET",
        "desc" => "PHP runtime version, memory usage, database connection, and active tokens.",
        "params" => []
    ],
    "api/developer/test_ping.php" => [
        "name" => "WebSocket Ping Roundtrip",
        "category" => "System & Diagnostics",
        "method" => "POST",
        "desc" => "Dispatches developer test event to Pusher WebSocket gateway.",
        "params" => ["sender" => "CCA Developer Console Probe"]
    ]
];

// ── 2. Category mapping dictionary ───────────────────────────────────────────
$categoryMap = [
    "admin/attendance" => "Admin Attendance",
    "admin/courses" => "Admin Courses",
    "admin/database" => "Admin Database",
    "admin/leaves" => "Admin Leaves",
    "admin/payroll" => "Admin Payroll",
    "admin/reports" => "Admin Reports",
    "admin/roles" => "Admin Roles & Permissions",
    "admin/staff" => "Admin Staff Roster",
    "admin/students" => "Admin Students",
    "admin" => "Admin Control",
    "ai" => "AI & Assistant",
    "attendance" => "Attendance & Clock-in",
    "auth" => "Authentication & Sessions",
    "blogs" => "Blogs & Articles",
    "brand" => "Brand Kit",
    "breaks" => "Breaks & Tiffin",
    "categories" => "Categories & Taxonomy",
    "chat" => "Chat & Messages",
    "community" => "Community Feed",
    "content_studio" => "Content Studio",
    "credits" => "Credits & Wallet",
    "crons" => "Crons & Automation",
    "dashboard" => "Dashboard & Metrics",
    "developer" => "Developer Suite",
    "emails" => "Emails & Mailing",
    "leave" => "Leave Management",
    "notifications" => "Push Notifications",
    "payroll" => "Payroll & Wallet",
    "profile" => "User Profile",
    "reports" => "Reports & Exports",
    "reviewer" => "Reviewer Approvals",
    "settings" => "Settings & Config",
    "student" => "Student Portal",
    "tasks" => "Tasks & Workflow"
];

// ── 3. Recursive Deep Scanner of server/api directory ────────────────────────
$apiBaseDir = realpath(__DIR__ . '/..'); // server/api
$endpoints = [];
$processedPaths = [];

// Helper to determine category from relative folder
function getCategoryName($relDir, $categoryMap) {
    $norm = trim(str_replace('\\', '/', $relDir), '/');
    if (isset($categoryMap[$norm])) {
        return $categoryMap[$norm];
    }
    // Check two-level prefix (e.g. admin/staff)
    foreach ($categoryMap as $key => $val) {
        if (strpos($norm, $key) === 0) {
            return $val;
        }
    }
    // Fallback: title-case the directory name
    return ucwords(str_replace(['_', '/'], [' ', ' & '], $norm));
}

// Helper to format clean title from filename
function formatEndpointTitle($filename) {
    $base = basename($filename, '.php');
    $title = str_replace('_', ' ', $base);
    return ucwords($title);
}

// Helper to analyze PHP file content
function analyzePhpEndpoint($filePath) {
    $content = @file_get_contents($filePath, false, null, 0, 8192) ?: '';
    
    // Method detection
    $method = 'GET';
    if (
        stripos($content, 'php://input') !== false ||
        stripos($content, '$_POST') !== false ||
        stripos($content, 'INSERT INTO') !== false ||
        stripos($content, 'UPDATE ') !== false ||
        stripos($content, 'DELETE FROM') !== false
    ) {
        $method = 'POST';
    }

    // Parameters discovery via regex
    $params = [];
    
    // 1. $data['...']
    if (preg_match_all("/\\\$data\s*\[\s*['\"]([a-zA-Z0-9_]+)['\"]\s*\]/", $content, $m1)) {
        foreach ($m1[1] as $p) {
            $params[$p] = inferParamSampleValue($p);
        }
    }

    // 2. $_POST['...']
    if (preg_match_all("/\\\$_POST\s*\[\s*['\"]([a-zA-Z0-9_]+)['\"]\s*\]/", $content, $m2)) {
        foreach ($m2[1] as $p) {
            $params[$p] = inferParamSampleValue($p);
        }
    }

    // 3. $_GET['...']
    if (preg_match_all("/\\\$_GET\s*\[\s*['\"]([a-zA-Z0-9_]+)['\"]\s*\]/", $content, $m3)) {
        foreach ($m3[1] as $p) {
            $params[$p] = inferParamSampleValue($p);
        }
    }

    // Filter out internal tokens
    unset($params['token']);

    // Extract docblock description if present
    $desc = '';
    if (preg_match("/\/\*\*[\s\S]*?@desc\s+([^\r\n*]+)/i", $content, $mDesc)) {
        $desc = trim($mDesc[1]);
    }

    return [
        'method' => $method,
        'params' => $params,
        'desc' => $desc
    ];
}

function inferParamSampleValue($name) {
    $lower = strtolower($name);
    if ($lower === 'id' || substr($lower, -3) === '_id') {
        return 1;
    }
    if (in_array($lower, ['page', 'limit', 'status_id', 'amount', 'duration'])) {
        return 1;
    }
    if (in_array($lower, ['date', 'attendance_date', 'target_date'])) {
        return date('Y-m-d');
    }
    if (in_array($lower, ['status', 'type', 'action', 'filter'])) {
        return 'all';
    }
    if (in_array($lower, ['force', 'is_active', 'confirmed'])) {
        return 1;
    }
    return 'sample_value';
}

if ($apiBaseDir && is_dir($apiBaseDir)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($apiBaseDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        if ($item->isFile() && $item->getExtension() === 'php') {
            $fullPath = $item->getPathname();
            $filename = $item->getFilename();

            // Filter out non-endpoint utility scripts
            if (
                preg_match('/(helper|guard|config|cors|db_helper|database)\.php$/i', $filename) ||
                strpos(str_replace('\\', '/', $fullPath), '/libs/') !== false
            ) {
                continue;
            }

            // Relative path from "server/" folder (e.g. api/attendance/get_daily.php)
            $subPath = str_replace('\\', '/', substr($fullPath, strlen($apiBaseDir)));
            $relPath = 'api' . $subPath;

            $relDir = dirname(substr($fullPath, strlen($apiBaseDir)));
            $category = getCategoryName($relDir, $categoryMap);
            $name = formatEndpointTitle($filename);

            // Check if we have a curated override
            if (isset($curatedMap[$relPath])) {
                $curated = $curatedMap[$relPath];
                $endpoints[] = [
                    "id" => md5($relPath),
                    "category" => $curated['category'] ?? $category,
                    "name" => $curated['name'] ?? $name,
                    "method" => $curated['method'] ?? 'POST',
                    "path" => $relPath,
                    "desc" => $curated['desc'] ?? "Executes {$name} in {$category}.",
                    "params" => $curated['params'] ?? [],
                    "is_curated" => true
                ];
            } else {
                $analysis = analyzePhpEndpoint($fullPath);
                $endpoints[] = [
                    "id" => md5($relPath),
                    "category" => $category,
                    "name" => $name,
                    "method" => $analysis['method'],
                    "path" => $relPath,
                    "desc" => !empty($analysis['desc']) ? $analysis['desc'] : "Executes {$name} in {$category} module.",
                    "params" => $analysis['params'],
                    "is_curated" => false
                ];
            }

            $processedPaths[$relPath] = true;
        }
    }
}

// Add any root level endpoints like api/server_time.php if not in api/
if (isset($curatedMap['api/server_time.php']) && empty($processedPaths['api/server_time.php'])) {
    $cur = $curatedMap['api/server_time.php'];
    $endpoints[] = [
        "id" => md5('api/server_time.php'),
        "category" => $cur['category'],
        "name" => $cur['name'],
        "method" => $cur['method'],
        "path" => 'api/server_time.php',
        "desc" => $cur['desc'],
        "params" => $cur['params'],
        "is_curated" => true
    ];
}

// Sort alphabetically by category, then name
usort($endpoints, function($a, $b) {
    if ($a['category'] === $b['category']) {
        return strcmp($a['name'], $b['name']);
    }
    return strcmp($a['category'], $b['category']);
});

// Extract unique categories for easy filtering
$categories = array_values(array_unique(array_column($endpoints, 'category')));
sort($categories);

echo json_encode([
    "status" => "success",
    "total_endpoints" => count($endpoints),
    "categories" => $categories,
    "data" => $endpoints,
    "scanned_at" => date('Y-m-d H:i:s')
]);
?>
