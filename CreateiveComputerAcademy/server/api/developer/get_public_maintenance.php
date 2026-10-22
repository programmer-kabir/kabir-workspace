<?php
require_once dirname(__DIR__, 2) . '/config/cors.php';

$configFile = dirname(__DIR__, 2) . '/config/maintenance_status.json';

$enabled = false;
$message = "সিস্টেম আপগ্রেড ও অপটিমাইজেশন চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।";
$userMessage = "আপনার অ্যাকাউন্টে ডাটাবেজ অপটিমাইজেশন ও মেইনটেনেন্স চলছে। সাময়িক অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।";
$updatedBy = "Developer";
$updatedAt = null;
$allowedUserIds = [];
$blockedUserIds = [];
$userRestrictedRoutes = [];

if (file_exists($configFile)) {
    $data = json_decode(file_get_contents($configFile), true);
    if (is_array($data)) {
        $enabled = !empty($data['maintenance_enabled']);
        if (!empty($data['maintenance_message'])) {
            $message = $data['maintenance_message'];
        }
        if (!empty($data['user_maintenance_message'])) {
            $userMessage = $data['user_maintenance_message'];
        }
        if (!empty($data['allowed_user_ids']) && is_array($data['allowed_user_ids'])) {
            $allowedUserIds = array_values(array_map('intval', $data['allowed_user_ids']));
        }
        if (!empty($data['blocked_user_ids']) && is_array($data['blocked_user_ids'])) {
            $blockedUserIds = array_values(array_map('intval', $data['blocked_user_ids']));
        }
        if (!empty($data['user_restricted_routes']) && is_array($data['user_restricted_routes'])) {
            $userRestrictedRoutes = $data['user_restricted_routes'];
        }
        if (!empty($data['updated_by'])) {
            $updatedBy = $data['updated_by'];
        }
        if (!empty($data['updated_at'])) {
            $updatedAt = $data['updated_at'];
        }
    }
}

$checkUserId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$isAllowedUser = ($checkUserId > 0 && in_array($checkUserId, $allowedUserIds));
$isBlockedUser = ($checkUserId > 0 && in_array($checkUserId, $blockedUserIds));

$currentUserRestrictedRoutes = [];
$currentUserRouteMessage = '';

if ($checkUserId > 0) {
    $ruleKey = isset($userRestrictedRoutes[(string)$checkUserId]) ? (string)$checkUserId : (isset($userRestrictedRoutes[$checkUserId]) ? $checkUserId : null);
    if ($ruleKey !== null && is_array($userRestrictedRoutes[$ruleKey])) {
        $rule = $userRestrictedRoutes[$ruleKey];
        $currentUserRestrictedRoutes = isset($rule['routes']) && is_array($rule['routes']) ? $rule['routes'] : [];
        $currentUserRouteMessage = isset($rule['message']) ? trim($rule['message']) : '';
    }
}

echo json_encode([
    "status" => "success",
    "maintenance_enabled" => $enabled,
    "maintenance_message" => $message,
    "user_maintenance_message" => $userMessage,
    "allowed_user_ids" => $allowedUserIds,
    "blocked_user_ids" => $blockedUserIds,
    "user_restricted_routes" => $userRestrictedRoutes,
    "current_user_restricted_routes" => $currentUserRestrictedRoutes,
    "current_user_route_message" => $currentUserRouteMessage,
    "is_allowed_user" => $isAllowedUser,
    "is_blocked_user" => $isBlockedUser,
    "updated_by" => $updatedBy,
    "updated_at" => $updatedAt
]);
?>
