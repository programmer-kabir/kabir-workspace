<?php
// =========================================================================
// SupplyLink - Page Navigation Activity Logger
// =========================================================================

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../helpers/log_activity.php';

header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$path = trim($input['path'] ?? '');
$pageTitle = trim($input['title'] ?? $path);

if (empty($path)) {
    echo json_encode(["success" => false, "message" => "Path is required"]);
    exit;
}

$description = "পেজ ভিজিট করেছেন: {$pageTitle}";

$logged = logStaffActivity(
    'PAGE_VISIT',
    'navigation',
    'page',
    $path,
    0.00,
    $description,
    ["path" => $path, "title" => $pageTitle]
);

echo json_encode(["success" => $logged]);
exit;
