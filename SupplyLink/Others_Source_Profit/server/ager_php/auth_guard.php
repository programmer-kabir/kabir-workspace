<?php
function getAuthenticatedUser() {
    if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $isLocal = (strpos($host, 'localhost') !== false) || (strpos($host, '127.0.0.1') !== false);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => $isLocal ? '' : '.supplylinkbd.com',
            'secure' => $isLocal ? false : true,
            'httponly' => true,
            'samesite' => $isLocal ? 'Lax' : 'None',
        ]);
        session_start();
    }
    return $_SESSION['user'] ?? null;
}

// 2. Check if request is authenticated
function isAuthenticated() {
    $user = getAuthenticatedUser();
    return !empty($user) && !empty($user['id']);
}

// 3. Check if user has specific role
function hasRole($requiredRoles) {
    if (!isAuthenticated()) {
        return false;
    }
    $user = getAuthenticatedUser();
    $userRoles = isset($user['role']) 
        ? (is_array($user['role']) ? $user['role'] : [$user['role']])
        : [];
    
    // Developer has super-admin role
    if (in_array('developer', $userRoles)) {
        return true;
    }

    $required = is_array($requiredRoles) ? $requiredRoles : [$requiredRoles];
    return count(array_intersect($userRoles, $required)) > 0;
}

// 4. Require authentication (Kills request with 401 if not logged in)
function requireAuth($customMessage = "অননুমোদিত অ্যাক্সেস: এই তথ্য দেখতে হলে প্রথমে লগইন করতে হবে।") {
    if (isCronOrCli()) {
        return true;
    }

    if (!isAuthenticated()) {
        // If someone directly pasted URL in browser address bar (Navigate mode), redirect to sign in
        if (isDirectBrowserNavigation()) {
            $host = $_SERVER['HTTP_HOST'] ?? '';
            $isLocal = (strpos($host, 'localhost') !== false) || (strpos($host, '127.0.0.1') !== false);
            $redirectUrl = $isLocal ? 'http://localhost:5175/sign_in' : 'https://admin.supplylinkbd.com/sign_in';
            header("Location: " . $redirectUrl);
            exit;
        }

        http_response_code(401);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "success" => false,
            "error" => "Unauthorized",
            "message" => $customMessage
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return true;
}

// 5. Require specific role (e.g. admin, manager, staff)
function requireRole($roles, $customMessage = "প্রবেশাধিকার নিষিদ্ধ: এই সেকশনে প্রবেশের অনুমতি আপনার একাউন্টের নেই।") {
    requireAuth();

    if (!hasRole($roles)) {
        http_response_code(403);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "success" => false,
            "error" => "Forbidden",
            "message" => $customMessage
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return true;
}

// 6. Admin & Staff Only Guard
function guardAdminOnly() {
    return requireRole(['admin', 'developer', 'manager', 'staff']);
}

// 7. Strict Management Only (Admin & Developer)
function guardManagerAdminOnly() {
    return requireRole(['admin', 'developer', 'manager']);
}

// 8. Detect if request is direct browser address bar visit
function isDirectBrowserNavigation() {
    $secFetchMode = $_SERVER['HTTP_SEC_FETCH_MODE'] ?? '';
    $secFetchDest = $_SERVER['HTTP_SEC_FETCH_DEST'] ?? '';
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';

    // If browser is directly navigating to the URL as a document
    if ($secFetchMode === 'navigate' || $secFetchDest === 'document') {
        return true;
    }
    
    // Direct address bar hit without origin, asking for HTML
    if (empty($_SERVER['HTTP_ORIGIN']) && strpos($accept, 'text/html') !== false && $secFetchMode !== 'cors') {
        return true;
    }

    return false;
}

// 9. Allow Cron and CLI
function isCronOrCli() {
    if (php_sapi_name() === 'cli') {
        return true;
    }
    $cronHeader = $_SERVER['HTTP_X_CRON_KEY'] ?? $_GET['cron_key'] ?? '';
    if (!empty($cronHeader) && $cronHeader === 'supplylink_cron_secure_key_2026') {
        return true;
    }
    return false;
}
