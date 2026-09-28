<?php
// backend/helpers/rate_limit.php
// IP-based Rate Limiter to prevent brute-force attacks and abuse

function getClientIpAddress() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // May contain comma-separated IPs
        $list = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($list[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function initRateLimitTable($pdo) {
    static $initialized = false;
    if ($initialized) return;

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            action VARCHAR(50) NOT NULL,
            attempts INT NOT NULL DEFAULT 1,
            last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_ip_action (ip_address, action),
            KEY idx_ip_action (ip_address, action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    // If table existed previously without unique index, add it
    try {
        $pdo->exec("ALTER TABLE login_attempts ADD UNIQUE KEY uq_ip_action (ip_address, action)");
    } catch (Exception $e) {
        // already exists or duplicate rows
    }
    $initialized = true;
}

function checkRateLimit($pdo, $action, $ip, $maxAttempts = 5, $decaySeconds = 300) {
    try {
        initRateLimitTable($pdo);

        $stmt = $pdo->prepare("
            SELECT attempts, UNIX_TIMESTAMP(last_attempt) AS last_ts
            FROM login_attempts
            WHERE ip_address = :ip AND action = :action
            LIMIT 1
        ");
        $stmt->execute([':ip' => $ip, ':action' => $action]);
        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record) {
            return ['allowed' => true, 'remaining_seconds' => 0, 'attempts' => 0];
        }

        $now = time();
        $elapsed = $now - (int)$record['last_ts'];

        // If decayed, clear old attempts
        if ($elapsed > $decaySeconds) {
            clearFailedAttempts($pdo, $action, $ip);
            return ['allowed' => true, 'remaining_seconds' => 0, 'attempts' => 0];
        }

        if ((int)$record['attempts'] >= $maxAttempts) {
            $remaining = $decaySeconds - $elapsed;
            return ['allowed' => false, 'remaining_seconds' => max(1, $remaining), 'attempts' => (int)$record['attempts']];
        }

        return ['allowed' => true, 'remaining_seconds' => 0, 'attempts' => (int)$record['attempts']];

    } catch (Exception $e) {
        // Fallback open if db issue
        return ['allowed' => true, 'remaining_seconds' => 0, 'attempts' => 0];
    }
}

function recordFailedAttempt($pdo, $action, $ip) {
    try {
        initRateLimitTable($pdo);

        $stmt = $pdo->prepare("
            INSERT INTO login_attempts (ip_address, action, attempts, last_attempt)
            VALUES (:ip, :action, 1, NOW())
            ON DUPLICATE KEY UPDATE 
                attempts = attempts + 1,
                last_attempt = NOW()
        ");
        $stmt->execute([':ip' => $ip, ':action' => $action]);
    } catch (Exception $e) {
        // ignore
    }
}

function clearFailedAttempts($pdo, $action, $ip) {
    try {
        initRateLimitTable($pdo);

        $stmt = $pdo->prepare("
            DELETE FROM login_attempts
            WHERE ip_address = :ip AND action = :action
        ");
        $stmt->execute([':ip' => $ip, ':action' => $action]);
    } catch (Exception $e) {
        // ignore
    }
}

/**
 * Enforces API rate limits by IP.
 * Halts execution with HTTP 429 Too Many Requests if threshold is exceeded.
 */
function enforceRateLimit($pdo, $action, $maxRequests = 90, $windowSeconds = 60) {
    $ip = getClientIpAddress();
    $status = checkRateLimit($pdo, $action, $ip, $maxRequests, $windowSeconds);
    if (!$status['allowed']) {
        http_response_code(429);
        header('Retry-After: ' . $status['remaining_seconds']);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'message' => 'Rate limit exceeded. Too many requests. Please wait ' . $status['remaining_seconds'] . 's before making more requests.',
            'retry_after' => $status['remaining_seconds']
        ]);
        exit;
    }
    recordFailedAttempt($pdo, $action, $ip);
}

