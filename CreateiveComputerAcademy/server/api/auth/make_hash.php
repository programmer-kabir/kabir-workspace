<?php
// Temporary helper — delete after use!
// Visit: https://api.creativecomputeracademy.com/api/auth/make_hash.php?pass=YourPassword
$pass = $_GET['pass'] ?? 'Admin@123';
echo password_hash($pass, PASSWORD_DEFAULT);
?>
