<?php
// backend/api_v1/config/Logger.php

class Logger {
    private static $logDir = __DIR__ . '/../logs/';

    public static function log($message, $level = 'INFO') {
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true);
        }
        
        $date = date('Y-m-d');
        $time = date('Y-m-d H:i:s');
        $logFile = self::$logDir . "error-{$date}.log";
        
        $method = $_SERVER['REQUEST_METHOD'] ?? 'CLI';
        $uri = $_SERVER['REQUEST_URI'] ?? 'N/A';
        
        $formattedMessage = "[{$time}] [{$level}] [{$method} {$uri}] - {$message}\n";
        
        error_log($formattedMessage, 3, $logFile);
    }
}

// Global Exception Handler
set_exception_handler(function($e) {
    $msg = "Exception: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine();
    Logger::log($msg, 'ERROR');
    
    // Output actual error for debugging
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => $msg]);
    exit;
});

// Global Error Handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    
    $level = 'WARNING';
    if (in_array($errno, [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        $level = 'ERROR';
    }
    
    $msg = "PHP Error [{$errno}]: {$errstr} in {$errfile} on line {$errline}";
    Logger::log($msg, $level);
    
    // If it's a fatal error, stop execution
    if ($level === 'ERROR') {
        header('Content-Type: application/json', true, 500);
        echo json_encode(['error' => $msg]);
        exit;
    }
    
    return true; // Don't execute PHP internal error handler
});

// Catch fatal errors that bypass the error handler
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        $msg = "Fatal Error: {$error['message']} in {$error['file']} on line {$error['line']}";
        Logger::log($msg, 'FATAL');
        
        // Output actual error for debugging
        header('Content-Type: application/json', true, 500);
        echo json_encode(['error' => $msg]);
    }
});
?>
