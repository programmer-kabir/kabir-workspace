<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$user_id      = isset($input['user_id']) && $input['user_id'] !== '' ? (int)$input['user_id'] : 'NULL';
$session_id   = $mysqli->real_escape_string($input['session_id'] ?? '');
$page_url     = $mysqli->real_escape_string($input['page_url'] ?? '');
$page_title   = $mysqli->real_escape_string($input['page_title'] ?? '');
$referrer     = $mysqli->real_escape_string($input['referrer'] ?? '');
$browser      = $mysqli->real_escape_string($input['browser'] ?? '');
$os           = $mysqli->real_escape_string($input['os'] ?? '');
$device_type  = $mysqli->real_escape_string($input['device_type'] ?? 'Unknown');
$user_agent   = $mysqli->real_escape_string($input['user_agent'] ?? '');
$language     = $mysqli->real_escape_string($input['language'] ?? '');
$is_logged_in = isset($input['is_logged_in']) && $input['is_logged_in'] ? 1 : 0;

$ip_address = $_SERVER['REMOTE_ADDR'];

// Fetch Geo data from ip-api
$country = 'Unknown';
$region = 'Unknown';
$city = 'Unknown';
$is_vpn = 0;

if ($ip_address && $ip_address !== '::1' && $ip_address !== '127.0.0.1') {
    // fields: status,country,regionName,city,proxy,hosting
    $apiUrl = "http://ip-api.com/json/{$ip_address}?fields=status,country,regionName,city,proxy,hosting";
    $geoData = @file_get_contents($apiUrl);
    
    if ($geoData) {
        $geo = json_decode($geoData, true);
        if (isset($geo['status']) && $geo['status'] === 'success') {
            $country = $geo['country'] ?? 'Unknown';
            $region  = $geo['regionName'] ?? 'Unknown';
            $city    = $geo['city'] ?? 'Unknown';
            // proxy or hosting is true usually means vpn/proxy
            $is_vpn  = (!empty($geo['proxy']) || !empty($geo['hosting'])) ? 1 : 0;
        }
    }
}

$country = $mysqli->real_escape_string($country);
$region = $mysqli->real_escape_string($region);
$city = $mysqli->real_escape_string($city);

$sql = "INSERT INTO visitor_logs (
    user_id, session_id, ip_address, is_vpn, country, region, city, 
    page_url, page_title, referrer, browser, os, device_type, user_agent, language, is_logged_in, visit_duration
) VALUES (
    $user_id, '$session_id', '$ip_address', $is_vpn, '$country', '$region', '$city', 
    '$page_url', '$page_title', '$referrer', '$browser', '$os', '$device_type', '$user_agent', '$language', $is_logged_in, 0
)";

if ($mysqli->query($sql)) {
    echo json_encode([
        'success' => true, 
        'visitor_log_id' => $mysqli->insert_id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $mysqli->error]);
}
?>
