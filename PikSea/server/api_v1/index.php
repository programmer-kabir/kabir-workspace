<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'success',
    'message' => 'DayalStock Local API v1 is running successfully.',
    'environment' => 'local',
    'timestamp' => date('Y-m-d H:i:s')
]);
