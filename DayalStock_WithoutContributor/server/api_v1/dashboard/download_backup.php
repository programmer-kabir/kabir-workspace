<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/Logger.php';

// Increase memory and execution time limits for large backups
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', '300');

// Ensure only authenticated requests can trigger this (assuming session or token check in a real scenario, adding basic check placeholder)
// Note: You should add your internal-auth/middleware check here if this is a protected endpoint.

$timestamp = date("Y-m-d_H-i-s");
$dbName = getenv('DB_NAME') ?: 'u647959341_dayaldb'; 
$sqlFilename = sys_get_temp_dir() . "/db_backup_{$timestamp}.sql";
$zipFilename = sys_get_temp_dir() . "/full_backup_{$timestamp}.zip";

try {
    // 1. Export MySQL Database to a .sql file
    $tables = array();
    $result = $mysqli->query("SHOW TABLES");
    while ($row = $result->fetch_row()) {
        $tables[] = $row[0];
    }
    
    $sqlContent = "-- Database Backup\n-- Generated: " . date("Y-m-d H:i:s") . "\n\n";
    $sqlContent .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\nSET time_zone = '+00:00';\n\n";
    
    foreach ($tables as $table) {
        $result = $mysqli->query("SELECT * FROM `$table`");
        $numColumns = $result->field_count;
        
        $sqlContent .= "DROP TABLE IF EXISTS `$table`;\n";
        $row2 = $mysqli->query("SHOW CREATE TABLE `$table`")->fetch_row();
        $sqlContent .= $row2[1] . ";\n\n";
        
        while ($row = $result->fetch_row()) {
            $sqlContent .= "INSERT INTO `$table` VALUES(";
            for ($j = 0; $j < $numColumns; $j++) {
                $row[$j] = $row[$j] ? addslashes($row[$j]) : NULL;
                $row[$j] = $row[$j] ? preg_replace("/\n/", "\\n", $row[$j]) : NULL;
                if (isset($row[$j])) {
                    $sqlContent .= '"' . $row[$j] . '"' ;
                } else {
                    $sqlContent .= '""';
                }
                if ($j < ($numColumns - 1)) {
                    $sqlContent .= ',';
                }
            }
            $sqlContent .= ");\n";
        }
        $sqlContent .= "\n";
    }
    file_put_contents($sqlFilename, $sqlContent);

    // 2. Create ZIP file containing the api_v1 (2) folder and the SQL file
    $zip = new ZipArchive();
    if ($zip->open($zipFilename, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
        throw new Exception("Cannot open <$zipFilename>\n");
    }

    // Add the SQL file to the root of the ZIP
    $zip->addFile($sqlFilename, "database_backup_{$timestamp}.sql");

    // Add the api_v1 directory
    $sourceDir = realpath(__DIR__ . '/../'); 
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($sourceDir),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($files as $name => $file) {
        // Skip directories (they would be added automatically)
        if (!$file->isDir()) {
            // Get real and relative path for current file
            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen($sourceDir) + 1);
            
            // Do not include git folders or other unnecessary large temp files if any
            if (strpos($relativePath, '.git') === false) {
                $zip->addFile($filePath, "api_v1/" . $relativePath);
            }
        }
    }
    
    $zip->close();
    
    // 3. Serve the ZIP file for download
    if (file_exists($zipFilename)) {
        header('Content-Description: File Transfer');
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="site_backup_' . $timestamp . '.zip"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($zipFilename));
        
        // Clear output buffer and flush
        ob_clean();
        flush();
        
        // Output file contents
        readfile($zipFilename);
        
        // 4. Cleanup temp files
        @unlink($sqlFilename);
        @unlink($zipFilename);
        exit;
    } else {
        throw new Exception("ZIP file was not created successfully.");
    }

} catch (Exception $e) {
    Logger::log("Backup failed: " . $e->getMessage(), 'ERROR');
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    // Cleanup on error
    @unlink($sqlFilename);
    @unlink($zipFilename);
    exit;
}
