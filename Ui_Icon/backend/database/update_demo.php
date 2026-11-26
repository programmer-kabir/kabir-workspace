<?php
require_once __DIR__ . '/../config/database.php';

$hash = password_hash('password123', PASSWORD_BCRYPT);
$stmt = $pdo->prepare("UPDATE users SET password_hash = :p WHERE username = :u");
$stmt->execute([':p' => $hash, ':u' => 'demo']);
echo "Demo user password updated successfully!\n";
