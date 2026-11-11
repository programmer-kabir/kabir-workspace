<?php
// =========================================================================
// SupplyLink - Central Staff Activity & Financial Audit Logger
// Records logins, page navigation, investment entries, installment collections,
// cash flow, and data modifications to `system_activity_logs`.
// =========================================================================

require_once __DIR__ . '/../db.php';

if (!function_exists('logStaffActivity')) {
    function logStaffActivity(
        $actionType,
        $category = 'financial',
        $entityType = null,
        $entityId = null,
        $amount = 0.00,
        $description = '',
        $details = null,
        $customUserId = null,
        $customUserName = null,
        $customUserRole = null
    ) {
        global $mysqli;

        try {
            if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
                session_start();
            }

            // 1. Identify Actor
            $userId = $customUserId;
            $userName = $customUserName;
            $userRole = $customUserRole;

            if (empty($userId)) {
                $sessionUser = $_SESSION['user'] ?? null;
                if (!empty($sessionUser['id'])) {
                    $userId = (int)$sessionUser['id'];
                    $userName = $sessionUser['name'] ?? $sessionUser['full_name'] ?? $sessionUser['username'] ?? null;
                    $userRole = is_array($sessionUser['role'] ?? null) 
                        ? implode(',', $sessionUser['role']) 
                        : ($sessionUser['role'] ?? $sessionUser['roles'] ?? null);
                } elseif (!empty($_SESSION['user_id'])) {
                    $userId = (int)$_SESSION['user_id'];
                    $userName = $_SESSION['user_name'] ?? null;
                    $userRole = $_SESSION['role'] ?? null;
                }
            }

            // If user_name is still empty but we have user_id, fetch user_name from users table
            if (!empty($userId) && empty($userName)) {
                $uStmt = $mysqli->prepare("SELECT name, full_name, role FROM users WHERE id = ? LIMIT 1");
                if ($uStmt) {
                    $uStmt->bind_param("i", $userId);
                    $uStmt->execute();
                    $uRes = $uStmt->get_result();
                    if ($uRow = $uRes->fetch_assoc()) {
                        $userName = $uRow['name'] ?? $uRow['full_name'] ?? "User #{$userId}";
                        if (empty($userRole)) {
                            $userRole = $uRow['role'];
                        }
                    }
                }
            }

            // 2. Client Metadata
            $ipAddress = $_SERVER['HTTP_CF_CONNECTING_IP'] 
                ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
                ?? $_SERVER['REMOTE_ADDR'] 
                ?? '127.0.0.1';
            
            // Clean IP in case of comma separated proxy chain
            if (strpos($ipAddress, ',') !== false) {
                $ipAddress = trim(explode(',', $ipAddress)[0]);
            }

            $rawUserAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            // Simplify user agent for readable display (e.g., Android Chrome, Windows Chrome, iOS Safari)
            $userAgent = substr($rawUserAgent, 0, 250);

            // 3. Prepare parameters
            $amountVal = ($amount !== null && is_numeric($amount)) ? (float)$amount : 0.00;
            $detailsJson = (!empty($details) && (is_array($details) || is_object($details))) 
                ? json_encode($details, JSON_UNESCAPED_UNICODE) 
                : ($details ? (string)$details : null);

            date_default_timezone_set('Asia/Dhaka');
            $createdAt = date('Y-m-d H:i:s');

            // 4. Insert into system_activity_logs
            $sql = "
                INSERT INTO system_activity_logs
                (user_id, user_name, user_role, action_type, category, entity_type, entity_id, amount, description, details_json, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            $stmt = $mysqli->prepare($sql);
            if (!$stmt) {
                error_log("logStaffActivity prepare failed: " . $mysqli->error);
                return false;
            }

            $entityIdStr = $entityId !== null ? (string)$entityId : null;
            $stmt->bind_param(
                "issssssdsssss",
                $userId,
                $userName,
                $userRole,
                $actionType,
                $category,
                $entityType,
                $entityIdStr,
                $amountVal,
                $description,
                $detailsJson,
                $ipAddress,
                $userAgent,
                $createdAt
            );

            $stmt->execute();
            return true;

        } catch (Throwable $e) {
            error_log("logStaffActivity error: " . $e->getMessage());
            return false;
        }
    }
}

// Backward compatibility alias for any existing caller
if (!function_exists('logActivity')) {
    function logActivity($module, $action, $summary = '', $entityType = null, $entityId = null, $amount = null, $meta = []) {
        return logStaffActivity(
            $action,
            'financial',
            $entityType ?: $module,
            $entityId,
            $amount,
            $summary,
            $meta
        );
    }
}
