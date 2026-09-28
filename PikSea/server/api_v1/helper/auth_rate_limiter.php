<?php
/**
 * DayalStock Authentication Rate Limiter & Security Guard
 * Enforces a strict 3-attempt limit with a 30-minute lockout per email.
 */

class AuthRateLimiter {

    /**
     * Check if an email is currently rate limited / locked for a specific action.
     * @param mysqli $mysqli
     * @param string $email
     * @param string $action ('login', 'otp_verify', 'otp_request')
     * @return array ['allowed' => bool, 'message' => string, 'remaining_minutes' => int]
     */
    public static function check($mysqli, string $email, string $action): array {
        $email = strtolower(trim($email));
        if (empty($email)) {
            return ['allowed' => true];
        }

        $stmt = $mysqli->prepare("
            SELECT attempts, locked_until, last_attempt,
                   TIMESTAMPDIFF(MINUTE, NOW(), locked_until) as lock_mins_left,
                   TIMESTAMPDIFF(MINUTE, last_attempt, NOW()) as mins_since_last
            FROM auth_rate_limits
            WHERE email = ? AND action = ?
            LIMIT 1
        ");
        $stmt->bind_param("ss", $email, $action);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$row) {
            return ['allowed' => true];
        }

        // If currently locked
        if (!empty($row['locked_until']) && strtotime($row['locked_until']) > time()) {
            $minsLeft = max(1, (int)$row['lock_mins_left']);
            return [
                'allowed' => false,
                'remaining_minutes' => $minsLeft,
                'message' => "Too many attempts on this email. You can try again in {$minsLeft} minute(s)."
            ];
        }

        // If 30 minutes have passed since last activity, reset counter
        if ((int)$row['mins_since_last'] >= 30) {
            self::clear($mysqli, $email, $action);
            return ['allowed' => true];
        }

        return ['allowed' => true];
    }

    /**
     * Record a failed attempt (e.g. wrong password, wrong OTP, or repeated request)
     * @param mysqli $mysqli
     * @param string $email
     * @param string $action ('login', 'otp_verify', 'otp_request')
     * @param int $maxAttempts Default 3
     * @param int $lockMinutes Default 30
     * @return array ['locked' => bool, 'attempts_left' => int, 'message' => string]
     */
    public static function recordFailure($mysqli, string $email, string $action, int $maxAttempts = 3, int $lockMinutes = 30): array {
        $email = strtolower(trim($email));
        if (empty($email)) {
            return ['locked' => false, 'attempts_left' => 0, 'message' => ''];
        }

        // Upsert record
        $stmt = $mysqli->prepare("
            INSERT INTO auth_rate_limits (email, action, attempts, last_attempt)
            VALUES (?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
                attempts = IF(TIMESTAMPDIFF(MINUTE, last_attempt, NOW()) >= 30, 1, attempts + 1),
                last_attempt = NOW()
        ");
        $stmt->bind_param("ss", $email, $action);
        $stmt->execute();
        $stmt->close();

        // Read current attempts count
        $readStmt = $mysqli->prepare("SELECT attempts FROM auth_rate_limits WHERE email = ? AND action = ? LIMIT 1");
        $readStmt->bind_param("ss", $email, $action);
        $readStmt->execute();
        $curr = $readStmt->get_result()->fetch_assoc();
        $readStmt->close();

        $currentAttempts = (int)($curr['attempts'] ?? 1);

        if ($currentAttempts >= $maxAttempts) {
            // Apply 30-minute lock
            $lockStmt = $mysqli->prepare("
                UPDATE auth_rate_limits 
                SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
                WHERE email = ? AND action = ?
            ");
            $lockStmt->bind_param("iss", $lockMinutes, $email, $action);
            $lockStmt->execute();
            $lockStmt->close();

            return [
                'locked' => true,
                'remaining_minutes' => $lockMinutes,
                'message' => "You have exceeded the maximum of {$maxAttempts} attempts. For security reasons, this email is locked for {$lockMinutes} minutes."
            ];
        }

        $attemptsLeft = $maxAttempts - $currentAttempts;
        return [
            'locked' => false,
            'attempts_left' => $attemptsLeft,
            'message' => "Invalid entry. You have {$attemptsLeft} attempt(s) remaining before a {$lockMinutes}-minute lockout."
        ];
    }

    /**
     * Clear / reset attempts upon successful operation
     */
    public static function clear($mysqli, string $email, string $action): void {
        $email = strtolower(trim($email));
        $stmt = $mysqli->prepare("DELETE FROM auth_rate_limits WHERE email = ? AND action = ?");
        if ($stmt) {
            $stmt->bind_param("ss", $email, $action);
            $stmt->execute();
            $stmt->close();
        }
    }
}
