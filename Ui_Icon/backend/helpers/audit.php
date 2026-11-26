<?php
// backend/helpers/audit.php
// Admin Audit Log Helper

function logAdminAction($pdo, $userId, $action, $entityType, $entityId = null, $details = []) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("
            INSERT INTO admin_audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
            VALUES (:user_id, :action, :entity_type, :entity_id, :details, :ip, NOW())
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':action' => $action,
            ':entity_type' => $entityType,
            ':entity_id' => $entityId,
            ':details' => !empty($details) ? json_encode($details, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
            ':ip' => $ip
        ]);
    } catch (Exception $e) {
        // Silent catch to prevent logging failure from blocking main transactions
        error_log("Audit log failed: " . $e->getMessage());
    }
}
