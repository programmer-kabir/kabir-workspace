<?php
// backend/api/auth/update.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/validator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$user = requireAuth($pdo);
$input = getJsonInput();

$fullName = isset($input['full_name']) ? sanitizeString($input['full_name']) : $user['full_name'];
$password = $input['password'] ?? null;

$params = [
    ':full_name' => $fullName,
    ':id' => $user['id']
];
$passwordClause = '';

if (!empty($password)) {
    if (strlen($password) < 6) {
        jsonResponse(false, null, 'Password must be at least 6 characters long', 400);
    }
    $passwordClause = ', password_hash = :pwd';
    $params[':pwd'] = password_hash($password, PASSWORD_BCRYPT);
}

$stmt = $pdo->prepare("UPDATE users SET full_name = :full_name {$passwordClause} WHERE id = :id");
$stmt->execute($params);

jsonResponse(true, [
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $fullName,
        'role' => $user['role']
    ]
], 'Profile updated successfully');
