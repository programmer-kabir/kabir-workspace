<?php
declare(strict_types=1);

define('SUNAM_TESTING', true);

require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Response.php';
$db = \SunamShop\Core\Database::getConnection();
$adminHash = password_hash('AdminPassword123#', PASSWORD_BCRYPT);
$db->prepare('UPDATE users SET password_hash = ? WHERE phone = "01700000000"')->execute([$adminHash]);

/**
 * SUNAM SHOP — Backend API Integration Test Suite
 */

function runRequest(string $method, string $uri, array $body = [], ?string $token = null): array
{
    \SunamShop\Core\Response::$hasResponded = false;
    // Reset superglobals
    $_SERVER['REQUEST_METHOD'] = $method;
    $_SERVER['REQUEST_URI'] = $uri;
    $_GET = [];
    $_POST = [];
    
    // Setup query params if GET
    $parts = parse_url($uri);
    if (isset($parts['query'])) {
        parse_str($parts['query'], $_GET);
    }
    
    if ($token) {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
    } else {
        unset($_SERVER['HTTP_AUTHORIZATION']);
    }

    if (!empty($body)) {
        $_SERVER['CONTENT_TYPE'] = 'application/json';
        // Mock php://input via stream filter or standard POST
        $_POST = $body;
    }

    ob_start();
    try {
        require __DIR__ . '/../api/index.php';
    } catch (\Throwable $e) {
        return [
            'success' => false,
            'status_code' => 500,
            'message' => $e->getMessage()
        ];
    }
    $raw = ob_get_clean();
    $decoded = json_decode($raw, true);

    return $decoded ?: ['raw' => $raw];
}

echo "========================================================\n";
echo "SUNAM SHOP — BACKEND INTEGRATION TEST SUITE\n";
echo "========================================================\n\n";

// Test 1: Health Check
echo "[TEST 1] GET /api/v1/health ... ";
$health = runRequest('GET', '/api/v1/health');
if ($health['success'] && $health['data']['database']['connected']) {
    echo "PASS (DB Connected: " . $health['data']['database']['version'] . ")\n";
} else {
    echo "FAIL\n";
    print_r($health);
    exit(1);
}

// Test 2: Delivery Zones
echo "[TEST 2] GET /api/v1/delivery-zones ... ";
$zones = runRequest('GET', '/api/v1/delivery-zones');
if ($zones['success'] && count($zones['data']) >= 2) {
    echo "PASS (" . count($zones['data']) . " zones found, " . count($zones['data'][0]['areas']) . " areas in Zone 1)\n";
} else {
    echo "FAIL\n";
    print_r($zones);
    exit(1);
}

// Test 3: Categories
echo "[TEST 3] GET /api/v1/categories ... ";
$cats = runRequest('GET', '/api/v1/categories');
if ($cats['success'] && count($cats['data']) >= 9) {
    echo "PASS (" . count($cats['data']) . " categories seeded)\n";
} else {
    echo "FAIL\n";
    print_r($cats);
    exit(1);
}

// Test 4: Admin Login
echo "[TEST 4] POST /api/v1/auth/login (Admin User) ... ";
$adminLogin = runRequest('POST', '/api/v1/auth/login', [
    'phone' => '01700000000',
    'password' => 'AdminPassword123#'
]);
if ($adminLogin['success'] && !empty($adminLogin['data']['token'])) {
    $adminToken = $adminLogin['data']['token'];
    echo "PASS (JWT Generated for " . $adminLogin['data']['user']['full_name'] . ")\n";
} else {
    echo "FAIL\n";
    print_r($adminLogin);
    exit(1);
}

// Test 5: Protected Route with Admin Token
echo "[TEST 5] GET /api/v1/auth/me (Protected Route) ... ";
$me = runRequest('GET', '/api/v1/auth/me', [], $adminToken);
if ($me['success'] && $me['data']['role_name'] === 'SUPER_ADMIN') {
    echo "PASS (Authenticated as " . $me['data']['full_name'] . ")\n";
} else {
    echo "FAIL\n";
    print_r($me);
    exit(1);
}

// Test 6: Protected Admin Dashboard Stats
echo "[TEST 6] GET /api/v1/admin/dashboard/stats (Role Guard) ... ";
$stats = runRequest('GET', '/api/v1/admin/dashboard/stats', [], $adminToken);
if ($stats['success'] && isset($stats['data']['today_sales'])) {
    echo "PASS (Sales: ৳" . $stats['data']['today_sales'] . ", Orders: " . $stats['data']['today_orders'] . ")\n";
} else {
    echo "FAIL\n";
    print_r($stats);
    exit(1);
}

// Test 7: Unauthorized Access Without Token
echo "[TEST 7] GET /api/v1/admin/dashboard/stats (Without Token - Must Reject) ... ";
$rejected = runRequest('GET', '/api/v1/admin/dashboard/stats');
if (!$rejected['success'] && $rejected['status_code'] === 401) {
    echo "PASS (Properly Rejected with 401 Unauthorized)\n";
} else {
    echo "FAIL\n";
    print_r($rejected);
    exit(1);
}

echo "\nALL 7 BACKEND API TESTS PASSED SUCCESSFULLY! 🚀\n";
