<?php
// backend/api/icons/quota.php
// Returns the daily export & copy quota status for the current user or guest

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/quota.php';

$user = getAuthenticatedUser($pdo);
$status = getDailyQuotaStatus($pdo, $user);

jsonResponse(true, $status, 'Quota status retrieved successfully');
