<?php
// backend/api/auth/logout.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$token = getBearerToken();
if ($token) {
    $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE token = :token");
    $stmt->execute([':token' => $token]);
}

jsonResponse(true, null, 'Logged out successfully');
