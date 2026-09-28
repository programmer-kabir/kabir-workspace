<?php
// backend/public_html/api_v1/middleware/rate_limit.php

// Ensure DB is loaded first
if (!isset($mysqli)) {
    // Attempt to load db.php if not present, though it should be.
    $dbPath = __DIR__ . '/../config/db.php';
    if (file_exists($dbPath)) {
        require_once $dbPath;
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database configuration missing for rate limiter."]);
        exit;
    }
}

/**
 * Apply rate limiting to an endpoint.
 * 
 * @param mysqli $mysqli The database connection
 * @param string $endpoint The name/category of the endpoint (e.g., 'search', 'upload')
 * @param int $maxRequests Maximum allowed requests in the time window
 * @param int $windowSeconds The time window in seconds
 * @param string|null $identifier Optional specific identifier (e.g., user_id). Defaults to IP address.
 */
function applyRateLimit($mysqli, $endpoint, $maxRequests, $windowSeconds, $identifier = null) {
    // 1. Create table if not exists (Efficient Memory table if possible, fallback to InnoDB)
    // We do this check rarely in production, but good for setup.
    // In a high-traffic production app, remove this auto-create after setup.
    static $tableChecked = false;
    if (!$tableChecked) {
        $mysqli->query("
            CREATE TABLE IF NOT EXISTS api_rate_limits (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                endpoint VARCHAR(50) NOT NULL,
                requests INT NOT NULL DEFAULT 1,
                reset_time INT NOT NULL,
                INDEX idx_ident_end (identifier, endpoint),
                INDEX idx_reset_time (reset_time)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
        
        // Cleanup expired limits (10% probability to avoid overhead on every request)
        if (mt_rand(1, 10) === 1) {
            $now = time();
            $mysqli->query("DELETE FROM api_rate_limits WHERE reset_time < $now");
        }
        $tableChecked = true;
    }

    $now = time();
    $resetTime = $now + $windowSeconds;
    
    // Use user_id if provided, otherwise IP address, handling proxies safely
    if (!$identifier) {
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Only trust X-Forwarded-For if REMOTE_ADDR is a known trusted proxy (e.g., localhost, or specific Cloudflare IPs)
        // For now, if no proxy is configured, use REMOTE_ADDR strictly to prevent spoofing.
        $trustedProxies = ['127.0.0.1', '::1']; // Add Cloudflare IPs here if needed
        
        if (in_array($clientIp, $trustedProxies) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $identifier = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } else {
            $identifier = $clientIp;
        }
    }
    
    $identSafe = $mysqli->real_escape_string(trim($identifier));
    $endSafe = $mysqli->real_escape_string($endpoint);
    
    // Check current usage
    $stmt = $mysqli->prepare("SELECT requests, reset_time FROM api_rate_limits WHERE identifier = ? AND endpoint = ? AND reset_time > ? LIMIT 1");
    if ($stmt) {
        $stmt->bind_param("ssi", $identSafe, $endSafe, $now);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();
        
        if ($row) {
            if ($row['requests'] >= $maxRequests) {
                $retryAfter = $row['reset_time'] - $now;
                header('HTTP/1.1 429 Too Many Requests');
                header("Retry-After: $retryAfter");
                echo json_encode([
                    "success" => false, 
                    "message" => "Rate limit exceeded. Please wait $retryAfter seconds."
                ]);
                exit;
            } else {
                // Increment counter
                $mysqli->query("UPDATE api_rate_limits SET requests = requests + 1 WHERE identifier = '$identSafe' AND endpoint = '$endSafe' AND reset_time > $now");
            }
        } else {
            // Insert new record
            $mysqli->query("INSERT INTO api_rate_limits (identifier, endpoint, requests, reset_time) VALUES ('$identSafe', '$endSafe', 1, $resetTime)");
        }
    }
}
?>
