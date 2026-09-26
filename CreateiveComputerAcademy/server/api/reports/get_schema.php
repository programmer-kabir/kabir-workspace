<?php
require_once '../../config/database.php';
$db = (new Database())->getConnection();
$res1 = $db->query('DESCRIBE users')->fetchAll(PDO::FETCH_ASSOC);
$res2 = $db->query('DESCRIBE employees')->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['users' => $res1, 'employees' => $res2], JSON_PRETTY_PRINT);
?>
