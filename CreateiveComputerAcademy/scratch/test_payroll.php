<?php
$_GET['user_id'] = 1; // Or staff ID
ob_start();
require_once __DIR__ . '/../server/api/payroll/get_my_payroll.php';
$out = ob_get_clean();
echo $out;
