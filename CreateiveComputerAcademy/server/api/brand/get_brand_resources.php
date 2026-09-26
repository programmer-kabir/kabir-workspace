<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Fetch resources directly from database
$categoryFilter = $_GET['category'] ?? null;
$approvalStatusFilter = $_GET['approval_status'] ?? null;
$includeInactive = isset($_GET['all']) && $_GET['all'] === '1';

try {
    $sql = "SELECT * FROM `cca_brand_resources` ";
    $params = [];

    $where = [];
    if (!$includeInactive) {
        $where[] = "is_active = 1";
        $where[] = "(approval_status = 'approved' OR approval_status IS NULL)";
    }
    if ($categoryFilter) {
        $where[] = "category = :category";
        $params[':category'] = $categoryFilter;
    }
    if ($approvalStatusFilter) {
        $where[] = "approval_status = :approval_status";
        $params[':approval_status'] = $approvalStatusFilter;
    }

    if (!empty($where)) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }

    $sql .= " ORDER BY sort_order ASC, id ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group by category for frontend rendering
    $grouped = [
        'colors' => [],
        'palettes' => [],
        'logos' => [],
        'fonts' => [],
        'templates' => [],
        'guidelines' => []
    ];

    foreach ($resources as &$res) {
        if ($res['category'] === 'palette' || ($res['category'] === '' && strpos($res['value'], ',') !== false)) {
            $res['category'] = 'palette';
            $grouped['palettes'][] = $res;
        } else {
            $catKey = $res['category'] . 's'; // color -> colors, logo -> logos, etc.
            if (isset($grouped[$catKey])) {
                $grouped[$catKey][] = $res;
            }
        }
    }
    unset($res);

    echo json_encode([
        "status" => "success",
        "total" => count($resources),
        "data" => $resources,
        "grouped" => $grouped
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch brand resources: " . $e->getMessage()
    ]);
}
?>
