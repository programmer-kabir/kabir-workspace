<?php
@ini_set('display_errors', '0');
error_reporting(0);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
    @require_once __DIR__ . '/../notifications/notification_helper.php';
}
if (file_exists(__DIR__ . '/../credits/CreditHelper.php')) {
    @require_once __DIR__ . '/../credits/CreditHelper.php';
}

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

if (!$db) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// ── Auto ensure tables exist ───────────────────────────────────────────────
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS task_marketplace_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            added_by INT NOT NULL,
            added_by_role VARCHAR(50) DEFAULT 'admin',
            marketplace VARCHAR(100) NOT NULL,
            custom_market VARCHAR(100) NULL,
            status VARCHAR(50) DEFAULT 'pending',
            approval_url VARCHAR(500) NULL,
            reject_reason TEXT NULL,
            submitted_date DATE NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_task_id (task_id),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS task_marketplace_submission_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            submission_id INT NOT NULL,
            status_from VARCHAR(50) NULL,
            status_to VARCHAR(50) NOT NULL,
            changed_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sub_id (submission_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (Throwable $t) {
    error_log("Table ensure error in marketplace_submissions: " . $t->getMessage());
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);
$action = isset($data->action) ? trim($data->action) : '';

// ── Helper: resolve staff user_id accurately from task and employees ───────
function resolveUserId($db, $user_id, $task_id) {
    // 1. First priority: look up the employee assigned to the task and get their actual user_id
    if (!empty($task_id)) {
        try {
            $stmt = $db->prepare("
                SELECT e.user_id 
                FROM tasks t
                INNER JOIN employees e ON t.assigned_to = e.id
                WHERE t.id = :tid
                LIMIT 1
            ");
            $stmt->execute([':tid' => $task_id]);
            $uid = $stmt->fetchColumn();
            if ($uid) return (int)$uid;
        } catch (Throwable $e) {}
    }

    // 2. If user_id was passed and matches an employee's record (employees.id), get employees.user_id
    if (!empty($user_id)) {
        try {
            $stmt2 = $db->prepare("SELECT user_id FROM employees WHERE id = :eid LIMIT 1");
            $stmt2->execute([':eid' => $user_id]);
            $uid2 = $stmt2->fetchColumn();
            if ($uid2) return (int)$uid2;

            // 3. Check if user_id is already an employee's user_id (employees.user_id)
            $stmt3 = $db->prepare("SELECT user_id FROM employees WHERE user_id = :uid LIMIT 1");
            $stmt3->execute([':uid' => $user_id]);
            $uid3 = $stmt3->fetchColumn();
            if ($uid3) return (int)$uid3;

            // 4. Fallback: valid user in users table
            $stmt4 = $db->prepare("SELECT id FROM users WHERE id = :uid LIMIT 1");
            $stmt4->execute([':uid' => $user_id]);
            $uid4 = $stmt4->fetchColumn();
            if ($uid4) return (int)$uid4;
        } catch (Throwable $e) {}
    }

    return (int)$user_id;
}

// ── Helper: insert audit log for status changes ─────────────────────────────
function insertSubmissionLog($db, $submission_id, $status_from, $status_to, $changed_by) {
    try {
        $stmt = $db->prepare("
            INSERT INTO task_marketplace_submission_logs 
                (submission_id, status_from, status_to, changed_by, created_at)
            VALUES 
                (:sid, :s_from, :s_to, :changed_by, NOW())
        ");
        $stmt->execute([
            ':sid'        => (int)$submission_id,
            ':s_from'     => $status_from ?: null,
            ':s_to'       => $status_to,
            ':changed_by' => (int)$changed_by,
        ]);
    } catch (Throwable $e) {
        // Silently continue if log table issue
    }
}

// ── Helper: get task title ─────────────────────────────────────────────────
function getTaskTitle($db, $task_id) {
    try {
        $stmt = $db->prepare("SELECT title FROM tasks WHERE id = :tid LIMIT 1");
        $stmt->execute([':tid' => $task_id]);
        return $stmt->fetchColumn() ?: 'Unknown Task';
    } catch (Throwable $e) {
        return 'Task #' . $task_id;
    }
}

// ── GET — fetch all submissions for a task ──────────────────────────────────
if ($action === 'get') {
    $task_id = isset($data->task_id) ? (int)$data->task_id : 0;
    if (!$task_id) {
        echo json_encode(['status' => 'error', 'message' => 'task_id required']);
        exit;
    }

    $stmt = $db->prepare("
        SELECT tms.*,
               u.name AS added_by_name,
               u.profile_picture AS added_by_avatar
        FROM task_marketplace_submissions tms
        LEFT JOIN users u ON tms.added_by = u.id
        WHERE tms.task_id = :task_id
        ORDER BY tms.created_at ASC
    ");
    $stmt->execute([':task_id' => $task_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    echo json_encode([
        'status' => 'success',
        'data' => $rows,
        'submissions' => $rows
    ]);
    exit;
}

// ── ADD — add new marketplace submission (Admin/Reviewer only) ──────────────
if ($action === 'add') {
    $task_id        = isset($data->task_id)       ? (int)$data->task_id       : 0;
    $raw_user_id    = isset($data->user_id)       ? (int)$data->user_id       : (isset($data->employee_id) ? (int)$data->employee_id : 0);
    $added_by       = isset($data->added_by)      ? (int)$data->added_by      : 0;
    $added_by_role  = isset($data->added_by_role) ? trim($data->added_by_role) : '';
    $marketplace    = isset($data->marketplace)   ? trim($data->marketplace)  : '';
    $custom_market  = isset($data->custom_market)  ? trim($data->custom_market) : null;
    $status         = isset($data->status)        ? trim($data->status)       : 'uploaded';
    $submitted_date = isset($data->submitted_date) ? trim($data->submitted_date) : date('Y-m-d');

    $user_id = resolveUserId($db, $raw_user_id, $task_id);

    if (!$task_id || !$user_id || !$added_by || !$marketplace || !in_array($added_by_role, ['admin', 'reviewer'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    $valid_statuses = ['pending', 'approved', 'rejected', 'resubmitted', 'uploaded'];
    if (!in_array($status, $valid_statuses)) $status = 'pending';

    $display_market = ($marketplace === 'Custom' && $custom_market) ? $custom_market : $marketplace;

    try {
        $stmt = $db->prepare("
            INSERT INTO task_marketplace_submissions
                (task_id, user_id, added_by, added_by_role, marketplace, custom_market, status, submitted_date)
            VALUES
                (:task_id, :user_id, :added_by, :added_by_role, :marketplace, :custom_market, :status, :submitted_date)
        ");
        $stmt->execute([
            ':task_id'        => $task_id,
            ':user_id'        => $user_id,
            ':added_by'       => $added_by,
            ':added_by_role'  => $added_by_role,
            ':marketplace'    => $marketplace,
            ':custom_market'  => $custom_market ?: null,
            ':status'         => $status,
            ':submitted_date' => $submitted_date,
        ]);
        $new_id = $db->lastInsertId();

        // Record initial status log
        insertSubmissionLog($db, $new_id, null, $status, $added_by);

        // 🪙 Trigger Marketplace Upload Credit (+1 Credit for Dayal Stock or External Marketplace)
        if (class_exists('CreditHelper')) {
            CreditHelper::handleMarketplaceUploadCredit($db, $new_id, $added_by);

            // If created directly in approved or rejected state
            if ($status === 'approved' || $status === 'rejected') {
                CreditHelper::handleMarketplaceStatusChangeCredit($db, $new_id, 'pending', $status, $added_by);
            }
        }

        // Notify staff user
        $task_title = getTaskTitle($db, $task_id);
        if ($user_id) {
            NotificationHelper::sendToUser(
                $db, $user_id, $added_by,
                "📦 Marketplace Submission Added",
                "আপনার কাজ \"{$task_title}\" {$display_market}-এ submit করা হয়েছে। Status: " . strtoupper($status),
                'marketplace_update', 'staff',
                '/tasks', 'normal'
            );
        }

        echo json_encode(['status' => 'success', 'id' => $new_id, 'message' => 'Submission added']);
    } catch (Throwable $e) {
        error_log("Marketplace add error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// ── UPDATE — update status, approval_url, reject_reason ────────────────────
if ($action === 'update') {
    $id           = isset($data->id)           ? (int)$data->id           : 0;
    $updated_by   = isset($data->updated_by)   ? (int)$data->updated_by   : 0;
    $status       = isset($data->status)       ? trim($data->status)       : null;
    $approval_url = isset($data->approval_url) ? trim($data->approval_url) : null;
    $reject_reason = isset($data->reject_reason) ? trim($data->reject_reason) : null;

    if (!$id || !$updated_by) {
        echo json_encode(['status' => 'error', 'message' => 'id and updated_by required']);
        exit;
    }

    // Fetch existing record
    $fetch = $db->prepare("SELECT * FROM task_marketplace_submissions WHERE id = :id LIMIT 1");
    $fetch->execute([':id' => $id]);
    $row = $fetch->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        echo json_encode(['status' => 'error', 'message' => 'Submission not found']);
        exit;
    }

    $valid_statuses = ['uploaded', 'pending', 'approved', 'rejected', 'resubmitted'];
    $new_status = ($status && in_array($status, $valid_statuses)) ? $status : $row['status'];
    $new_url    = ($approval_url !== null) ? $approval_url : $row['approval_url'];
    $new_reason = ($reject_reason !== null) ? $reject_reason : $row['reject_reason'];

    // Clear opposing fields when switching status
    if ($new_status === 'approved')   $new_reason = null;
    if ($new_status === 'rejected')   $new_url    = null;
    if ($new_status === 'resubmitted') { $new_url = null; $new_reason = null; }

    try {
        $stmt = $db->prepare("
            UPDATE task_marketplace_submissions
            SET status = :status, approval_url = :approval_url, reject_reason = :reject_reason, updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':status'        => $new_status,
            ':approval_url'  => $new_url ?: null,
            ':reject_reason' => $new_reason ?: null,
            ':id'            => $id,
        ]);

        // Record status change log & trigger Credit Logic
        if ($new_status !== $row['status']) {
            insertSubmissionLog($db, $id, $row['status'], $new_status, $updated_by);

            // 🪙 Trigger Status Change Credit (+2 for External Approved, -1 for External Rejected, 0 for Dayal Stock)
            if (class_exists('CreditHelper')) {
                CreditHelper::handleMarketplaceStatusChangeCredit($db, $id, $row['status'], $new_status, $updated_by, $new_reason);
            }
        }

        // Notify staff if status changed
        if ($new_status !== $row['status']) {
            $staff_user_id = (int)$row['user_id'];
            $task_title    = getTaskTitle($db, $row['task_id']);
            $display_market = ($row['marketplace'] === 'Custom' && $row['custom_market'])
                ? $row['custom_market'] : $row['marketplace'];

            $notif_title   = '';
            $notif_message = '';
            $priority      = 'normal';

            if ($new_status === 'approved') {
                $notif_title   = "✅ Marketplace Approved!";
                $notif_message = "আপনার কাজ \"{$task_title}\" {$display_market}-এ APPROVED হয়েছে! 🎉";
                $priority      = 'high';
            } elseif ($new_status === 'rejected') {
                $notif_title   = "❌ Marketplace Rejected";
                $notif_message = "আপনার কাজ \"{$task_title}\" {$display_market}-এ Rejected হয়েছে।" .
                    ($new_reason ? " কারণ: {$new_reason}" : "");
                $priority      = 'high';
            } elseif ($new_status === 'pending') {
                $notif_title   = "🕐 Under Review";
                $notif_message = "আপনার কাজ \"{$task_title}\" {$display_market}-এ এখন Review-এ আছে।";
            } elseif ($new_status === 'resubmitted') {
                $notif_title   = "🔄 Resubmitted";
                $notif_message = "আপনার কাজ \"{$task_title}\" {$display_market}-এ আবার Submit করা হয়েছে।";
            }

            if ($staff_user_id && $notif_title) {
                NotificationHelper::sendToUser(
                    $db, $staff_user_id, $updated_by,
                    $notif_title, $notif_message,
                    'marketplace_update', 'staff',
                    '/tasks', $priority
                );
            }
        }

        echo json_encode(['status' => 'success', 'message' => 'Submission updated']);
    } catch (Throwable $e) {
        error_log("Marketplace update error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// ── GET LOGS — fetch status change history for a submission ─────────────────
if ($action === 'get_logs') {
    $submission_id = isset($data->submission_id) ? (int)$data->submission_id : 0;
    if (!$submission_id) {
        echo json_encode(['status' => 'error', 'message' => 'submission_id required']);
        exit;
    }

    try {
        $stmt = $db->prepare("
            SELECT l.*,
                   u.name AS changed_by_name,
                   u.profile_picture AS changed_by_avatar
            FROM task_marketplace_submission_logs l
            LEFT JOIN users u ON l.changed_by = u.id
            WHERE l.submission_id = :sid
            ORDER BY l.created_at DESC, l.id DESC
        ");
        $stmt->execute([':sid' => $submission_id]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        echo json_encode(['status' => 'success', 'data' => $logs, 'logs' => $logs]);
    } catch (Throwable $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage(), 'data' => [], 'logs' => []]);
    }
    exit;
}

// ── DELETE ──────────────────────────────────────────────────────────────────
if ($action === 'delete') {
    $id         = isset($data->id)         ? (int)$data->id         : 0;
    $deleted_by = isset($data->deleted_by) ? (int)$data->deleted_by : 0;

    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Valid id is required']);
        exit;
    }

    try {
        // Delete logs first if any exist
        try {
            $logStmt = $db->prepare("DELETE FROM task_marketplace_submission_logs WHERE submission_id = :id");
            $logStmt->execute([':id' => $id]);
        } catch (Throwable $e) {}

        $stmt = $db->prepare("DELETE FROM task_marketplace_submissions WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['status' => 'success', 'message' => 'Submission record deleted successfully']);
    } catch (Throwable $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// ── GET_SUMMARY — lightweight count per task (for task cards) ───────────────
if ($action === 'get_summary') {
    $task_ids = isset($data->task_ids) && is_array($data->task_ids)
        ? array_map('intval', $data->task_ids) : [];

    if (empty($task_ids)) {
        echo json_encode(['status' => 'success', 'data' => []]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($task_ids), '?'));
    $stmt = $db->prepare("
        SELECT task_id,
               COUNT(*) AS total,
               SUM(status = 'approved')    AS approved,
               SUM(status = 'rejected')    AS rejected,
               SUM(status = 'pending')     AS pending,
               SUM(status = 'uploaded')    AS uploaded,
               SUM(status = 'resubmitted') AS resubmitted
        FROM task_marketplace_submissions
        WHERE task_id IN ({$placeholders})
        GROUP BY task_id
    ");
    $stmt->execute($task_ids);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];
    foreach ($rows as $r) {
        $result[$r['task_id']] = $r;
    }

    echo json_encode(['status' => 'success', 'data' => $result]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
