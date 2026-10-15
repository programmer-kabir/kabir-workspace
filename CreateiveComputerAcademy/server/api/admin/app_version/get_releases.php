<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/AppVersionHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    AppVersionHelper::ensureSchema($db);

    // 1. Fetch all releases
    $relStmt = $db->query("SELECT r.*, u.name as publisher_name 
        FROM app_releases r 
        LEFT JOIN users u ON r.published_by = u.id 
        ORDER BY r.id DESC");
    $releases = $relStmt->fetchAll(PDO::FETCH_ASSOC);

    $latestRelease = !empty($releases) ? $releases[0] : null;
    $latestVersion = $latestRelease ? $latestRelease['version'] : '1.0.0';

    // 2. Fetch fleet status & staff versions
    $staffSql = "SELECT sav.*, u.name as staff_name, u.email as staff_email, u.avatar as staff_avatar, u.role, u.department
        FROM staff_app_versions sav
        JOIN users u ON sav.user_id = u.id
        ORDER BY sav.last_seen_at DESC";
    $staffStmt = $db->query($staffSql);
    $staffVersions = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalStaff = count($staffVersions);
    $onLatestCount = 0;
    $outdatedCount = 0;

    $formattedStaff = [];
    foreach ($staffVersions as $s) {
        $isLatest = version_compare($s['current_version'], $latestVersion, '>=');
        if ($isLatest) {
            $onLatestCount++;
        } else {
            $outdatedCount++;
        }

        $s['is_latest'] = $isLatest;
        $formattedStaff[] = $s;
    }

    $adoptionRate = $totalStaff > 0 ? round(($onLatestCount / $totalStaff) * 100) : 100;

    echo json_encode([
        "status"   => "success",
        "releases" => $releases,
        "latest"   => $latestRelease,
        "fleet"    => [
            "total_workstations" => $totalStaff,
            "on_latest_count"    => $onLatestCount,
            "outdated_count"     => $outdatedCount,
            "adoption_percent"   => $adoptionRate,
            "staff_list"         => $formattedStaff
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to fetch releases: " . $e->getMessage()
    ]);
}
