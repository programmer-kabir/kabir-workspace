<?php

// Ensure auth is loaded first
require_once __DIR__ . '/auth.php';

function requireRole($requiredRole) {
    if (!isset($GLOBALS['user']) || empty($GLOBALS['user'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit;
    }

    $roles = $GLOBALS['user']['roles'] ?? [];

    // Admins bypass all role checks
    if (!in_array($requiredRole, $roles) && !in_array('admin', $roles)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Forbidden - Insufficient permissions"]);
        exit;
    }
}
?>
