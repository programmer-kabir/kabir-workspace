<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/Logger.php';

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
    
    // 6. Hostinger Server Local Storage Stats
    $uploadsDir = realpath(__DIR__ . '/../../../uploads') ?: (realpath(__DIR__ . '/../../uploads') ?: __DIR__ . '/../../uploads');
    $totalSize = 0;
    $objectCount = 0;
    if (is_dir($uploadsDir)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($uploadsDir, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            $totalSize += $file->getSize();
            $objectCount++;
        }
    }
    
    $storageStats = [
        'size_gb' => round($totalSize / 1073741824, 2),
        'size_mb' => round($totalSize / 1048576, 2),
        'objects' => $objectCount
    ];
    $response['data']['storage_stats'] = $storageStats;
    $response['data']['r2'] = $storageStats;
    
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
