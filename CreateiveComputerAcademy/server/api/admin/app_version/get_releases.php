<?php
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/AppVersionHelper.php';
require_once __DIR__ . '/../../../config/cors.php';

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
    $staffSql = "SELECT sav.*, 
                        u.name as staff_name, 
                        u.email as staff_email, 
                        COALESCE(u.profile_picture, '') as staff_avatar, 
                        COALESCE(e.designation, 'Staff') as role, 
                        COALESCE(d.name, 'General') as department
        FROM staff_app_versions sav
        JOIN users u ON sav.user_id = u.id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
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
