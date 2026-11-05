<?php
/**
 * ============================================================================
 * SupplyLink - Central Activity & Audit Logger Helper
 * ফাইল: server/apis/helpers/activity_logger.php
 * ============================================================================
 */

if (!function_exists('getClientIpAddress')) {
    function getClientIpAddress() {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            return $_SERVER['HTTP_X_REAL_IP'];
        }
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}

if (!function_exists('logSystemActivity')) {
    /**
     * Records a system audit log entry into `system_activity_logs`.
     * 
     * @param array $params [
     *   'user_id' => int|null,
     *   'user_name' => string|null,
     *   'user_role' => string|null,
     *   'action_type' => string,
     *   'category' => 'financial'|'navigation'|'auth'|'modification'|'system',
     *   'entity_type' => string|null,
     *   'entity_id' => string|null,
     *   'amount' => float|null,
     *   'description' => string,
     *   'details' => array|string|null,
     * ]
     * @return int|bool Inserted log ID or false
     */
    function logSystemActivity($params = []) {
        global $mysqli;

        // If mysqli is not initialized, try to connect via db.php
        if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
            $dbPath = dirname(__DIR__) . '/db.php';
            if (file_exists($dbPath)) {
                require_once $dbPath;
            }
        }

        if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
            return false;
        }

        try {
            date_default_timezone_set('Asia/Dhaka');

            // 1. Resolve User Context
            $userId = !empty($params['user_id']) ? (int)$params['user_id'] : null;
            $userName = !empty($params['user_name']) ? trim($params['user_name']) : null;
            $userRole = !empty($params['user_role']) ? trim($params['user_role']) : null;

            // Fallback to active PHP session if available
            if (!$userId && session_status() === PHP_SESSION_ACTIVE && !empty($_SESSION['user'])) {
                $sessionUser = $_SESSION['user'];
                $userId = $sessionUser['id'] ?? null;
                $userName = $sessionUser['name'] ?? $sessionUser['fullName'] ?? $userName;
                $userRole = is_array($sessionUser['role'] ?? null) 
                    ? implode(',', $sessionUser['role']) 
                    : ($sessionUser['role'] ?? $userRole);
            }

            // 2. Action and Category
            $actionType = !empty($params['action_type']) ? strtoupper(trim($params['action_type'])) : 'ACTION';
            $validCategories = ['financial', 'navigation', 'auth', 'modification', 'system'];
            $category = !empty($params['category']) && in_array($params['category'], $validCategories, true)
                ? $params['category']
                : 'financial';

            // 3. Entity Details
            $entityType = !empty($params['entity_type']) ? trim($params['entity_type']) : null;
            $entityId = isset($params['entity_id']) ? (string)$params['entity_id'] : null;
            $amount = isset($params['amount']) ? (float)$params['amount'] : 0.00;

            // 4. Description
            $description = !empty($params['description']) ? trim($params['description']) : ($actionType . ' performed');

            // 5. Details JSON
            $detailsJson = null;
            if (isset($params['details'])) {
                if (is_array($params['details']) || is_object($params['details'])) {
                    $detailsJson = json_encode($params['details'], JSON_UNESCAPED_UNICODE);
                } elseif (is_string($params['details'])) {
                    $detailsJson = $params['details'];
                }
            }

            // 6. Network and Device Metadata
            $ipAddress = substr(getClientIpAddress(), 0, 45);
            $rawAgent = $_SERVER['HTTP_USER_AGENT'] ?? ($params['user_agent'] ?? '');
            $userAgent = substr($rawAgent, 0, 500);
            $createdAt = date('Y-m-d H:i:s');

            // 7. Insert Prepared Statement
            $stmt = $mysqli->prepare("
                INSERT INTO `system_activity_logs` (
                    `user_id`, `user_name`, `user_role`, `action_type`, `category`,
                    `entity_type`, `entity_id`, `amount`, `description`, `details_json`,
                    `ip_address`, `user_agent`, `created_at`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            if (!$stmt) {
                return false;
            }

            $stmt->bind_param(
                "issssssdsssss",
                $userId,
                $userName,
                $userRole,
                $actionType,
                $category,
                $entityType,
                $entityId,
                $amount,
                $description,
                $detailsJson,
                $ipAddress,
                $userAgent,
                $createdAt
            );

            $stmt->execute();
            $insertedId = $stmt->insert_id;
            $stmt->close();

            return $insertedId > 0 ? $insertedId : true;

        } catch (Throwable $e) {
            // Silently fail to avoid breaking business transactions
            error_log("logSystemActivity Exception: " . $e->getMessage());
            return false;
        }
    }
}

