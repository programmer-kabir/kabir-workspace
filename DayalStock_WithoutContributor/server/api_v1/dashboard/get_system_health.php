<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/Logger.php';
require_once __DIR__ . '/../config/r2_config.php';

$response = [
    'success' => true,
    'data' => [
        'storage' => [],
        'database' => [],
        'logs' => [],
        'r2' => []
    ]
];

try {
    // Helper function to calculate directory size
    function getDirectorySize($path) {
        $bytestotal = 0;
        $path = realpath($path);
        if($path!==false && $path!='' && file_exists($path)){
            foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $object){
                $bytestotal += $object->getSize();
            }
        }
        return $bytestotal;
    }

    // 1. Storage Info
    // Set your Hostinger plan's total limit here (in GB), for example 100 GB
    $hostingPlanLimitGB = 100; 
    $totalSpace = $hostingPlanLimitGB * 1073741824; 
    
    // We try to get the size of the Document Root (or the parent directory if possible)
    // to estimate the used space of your projects.
    $docRoot = $_SERVER['DOCUMENT_ROOT'] ?: __DIR__ . '/../../../'; 
    $usedSpace = getDirectorySize($docRoot); 
    
    // Fallback: If used space seems 0 (due to permissions), we just show 0
    $freeSpace = $totalSpace - $usedSpace;
    
    $response['data']['storage'] = [
        'total' => round($totalSpace / 1073741824, 2),
        'free' => round($freeSpace / 1073741824, 2),
        'used' => round($usedSpace / 1073741824, 2),
        'percent' => round(($usedSpace / $totalSpace) * 100, 2)
    ];

    // 2. Database Info
    $dbName = getenv('DB_NAME');
    $query = "SELECT SUM(data_length + index_length) AS size FROM information_schema.tables WHERE table_schema = '{$dbName}'";
    $result = $mysqli->query($query);
    if ($result && $row = $result->fetch_assoc()) {
        $dbSize = $row['size'];
        $response['data']['database'] = [
            'size_mb' => round($dbSize / 1048576, 2),
            'status' => 'Connected',
            'version' => $mysqli->server_info
        ];
    }



    // 5. Read recent logs
    $logDir = __DIR__ . '/../logs/';
    $logs = [];
    $logFiles = glob($logDir . '*.log');
    rsort($logFiles); // Get newest logs first
    
    if (!empty($logFiles)) {
        $latestLogFile = $logFiles[0];
        $fileContent = file($latestLogFile);
        $fileContent = array_reverse($fileContent); // Newest lines first
        $count = 0;
        
        foreach ($fileContent as $line) {
            if ($count >= 50) break; // Get last 50 logs max
            if (trim($line) === '') continue;
            
            // Format: [2026-07-28 10:27:00] [ERROR] [GET /api] - Message
            preg_match('/^\[(.*?)\] \[(.*?)\] \[(.*?)\] - (.*)$/', $line, $matches);
            
            if (count($matches) === 5) {
                $logs[] = [
                    'id' => uniqid(),
                    'time' => $matches[1],
                    'type' => strtolower($matches[2]),
                    'source' => $matches[3],
                    'message' => $matches[4]
                ];
                $count++;
            }
        }
    }
    $response['data']['logs'] = $logs;
    
    // 6. Cloudflare R2 Stats (S3 API + GraphQL API)
    $r2Stats = R2Helper::getBucketStats();
    
    $classA = 0;
    $classB = 0;
    
    // Cloudflare GraphQL API for Operations count
    $cfAccountId = 'b88add0e4d3eae3a5a32ad34b2cc0096';
    $cfToken = 'cfut_GqMuxKDmTShEhGOaXNEbNQfGBnVkocfYLoz7b14xf60dc71b';
    
    // Cloudflare GraphQL API requires a datetime filter
    $datetimeGeq = gmdate('Y-m-d\TH:i:s\Z', strtotime('-30 days'));
    $datetimeLeq = gmdate('Y-m-d\TH:i:s\Z');
    
    $query = '{"query": "{ viewer { accounts(filter: { accountTag: \"' . $cfAccountId . '\" }) { r2OperationsAdaptiveGroups(limit: 1000, filter: { datetime_geq: \"' . $datetimeGeq . '\", datetime_leq: \"' . $datetimeLeq . '\" }) { sum { requests } dimensions { actionType } } } } }"}';
    
    $ch = curl_init('https://api.cloudflare.com/client/v4/graphql');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $cfToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
    $cfResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($cfResponse) {
        file_put_contents(__DIR__ . '/cf_debug.json', $cfResponse);
    } else {
        file_put_contents(__DIR__ . '/cf_debug.json', 'CURL ERROR: ' . $curlError);
    }
    
    if ($cfResponse) {
        $cfData = json_decode($cfResponse, true);
        if (isset($cfData['data']['viewer']['accounts'][0]['r2OperationsAdaptiveGroups'])) {
            $ops = $cfData['data']['viewer']['accounts'][0]['r2OperationsAdaptiveGroups'];
            $classATypes = ['PutObject', 'ListObjects', 'CopyObject', 'CompleteMultipartUpload', 'CreateMultipartUpload', 'UploadPart'];
            
            foreach ($ops as $op) {
                $type = $op['dimensions']['actionType'];
                $count = $op['sum']['requests'];
                if (in_array($type, $classATypes)) {
                    $classA += $count;
                } else {
                    $classB += $count;
                }
            }
        }
    }
    
    $response['data']['r2'] = [
        'size_gb' => round($r2Stats['totalSize'] / 1073741824, 2),
        'size_mb' => round($r2Stats['totalSize'] / 1048576, 2),
        'objects' => $r2Stats['objectCount'],
        'class_a' => $classA,
        'class_b' => $classB
    ];
    
} catch (Exception $e) {
    Logger::log("System health error: " . $e->getMessage(), 'ERROR');
    $response = [
        'success' => false,
        'error' => 'Failed to retrieve system health data.'
    ];
}

header('Content-Type: application/json');
echo json_encode($response);
exit;
