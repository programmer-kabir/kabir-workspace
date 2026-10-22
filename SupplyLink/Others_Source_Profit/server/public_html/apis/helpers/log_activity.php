<?php
require_once __DIR__ . '/../db.php';

function logActivity($module, $action, $summary = '', $entityType = null, $entityId = null, $amount = null, $meta = []) {
    global $mysqli;

    try {
        if (session_status() === PHP_SESSION_NONE) session_start();

        // ✅ Support both session formats:
        // 1) $_SESSION['user']['id'], $_SESSION['user']['role']  (your current)
        // 2) $_SESSION['user_id'], $_SESSION['role']            (optional/old)
        $actorUserId = null;
        $actorRole = null;

        if (!empty($_SESSION['user']['id'])) {
            $actorUserId = (int)$_SESSION['user']['id'];
            $actorRole = $_SESSION['user']['role'] ?? null;
        } elseif (!empty($_SESSION['user_id'])) {
            $actorUserId = (int)$_SESSION['user_id'];
            $actorRole = $_SESSION['role'] ?? null;
        }

        if (is_array($actorRole)) {
            $actorRole = implode(',', array_filter($actorRole));
        } elseif ($actorRole !== null) {
            $actorRole = (string)$actorRole;
        }

        // actor_user_id table এ NOT NULL
        if (!$actorUserId) {
            return false;
        }

        $ip        = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $sessionId = session_id();

        $metaJson = !empty($meta) ? json_encode($meta, JSON_UNESCAPED_UNICODE) : null;

        // amount nullable safe
        $amountVal = ($amount === null || $amount === '') ? null : (string)$amount;

        $stmt = $mysqli->prepare("
            INSERT INTO activity_logs
            (actor_user_id, actor_role, module, action, entity_type, entity_id, amount, summary, meta, ip, user_agent, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        if (!$stmt) {
            return false;
        }

        // i s s s s i s s s s s s  (amount string)
        $stmt->bind_param(
            "issssissssss",
            $actorUserId,
            $actorRole,
            $module,
            $action,
            $entityType,
            $entityId,
            $amountVal,
            $summary,
            $metaJson,
            $ip,
            $userAgent,
            $sessionId
        );

        $stmt->execute();
        return true;
    } catch (Throwable $e) {
        error_log("logActivity failed: " . $e->getMessage());
        return false;
    }
}
