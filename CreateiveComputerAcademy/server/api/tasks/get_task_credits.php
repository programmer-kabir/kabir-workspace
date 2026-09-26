<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../credits/CreditHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$taskId = isset($_GET['task_id']) ? intval($_GET['task_id']) : 0;
if (!$taskId) {
    echo json_encode(["status" => "error", "message" => "Task ID is required"]);
    exit();
}
try {
    $taskStmt = $db->prepare("
        SELECT t.id, t.title, t.status, t.assigned_to, t.reviewed_by, t.rejected_by,
               t.custom_credit, t.category_id, t.subcategory_id, t.child_category_id,
               u_staff.name as staff_name,
               u_rev.name as reviewer_name
        FROM tasks t
        LEFT JOIN users u_staff ON t.assigned_to = u_staff.id
        LEFT JOIN users u_rev ON t.reviewed_by = u_rev.id
        WHERE t.id = :task_id
        LIMIT 1
    ");
    $taskStmt->execute([':task_id' => $taskId]);
    $task = $taskStmt->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo json_encode(["status" => "error", "message" => "Task not found"]);
        exit();
    }

    $baseCredit = CreditHelper::getTaskCategoryCredit($db, $taskId);

    // 2. Fetch actual Credit Transactions
    $txStmt = $db->prepare("
        SELECT ct.id, ct.user_id, ct.sender_id, ct.receiver_id, ct.amount, ct.type, 
               ct.reference_id, ct.event_key, ct.description, ct.meta_data, ct.created_at,
               u.name AS user_name,
               s.name AS sender_name,
               r.name AS receiver_name
        FROM credit_transactions ct
        LEFT JOIN users u ON ct.user_id = u.id
        LEFT JOIN users s ON ct.sender_id = s.id
        LEFT JOIN users r ON ct.receiver_id = r.id
        WHERE ct.reference_id = :task_id
           OR ct.event_key LIKE :event_pattern
        ORDER BY ct.id ASC
    ");
    $eventPattern = "%_task_{$taskId}%";
    $txStmt->execute([
        ':task_id' => $taskId,
        ':event_pattern' => $eventPattern
    ]);
    $rawTransactions = $txStmt->fetchAll(PDO::FETCH_ASSOC);

    // Dedup transactions by id
    $transactions = [];
    $seenIds = [];
    foreach ($rawTransactions as $tx) {
        if (!in_array($tx['id'], $seenIds)) {
            $seenIds[] = $tx['id'];
            if ($tx['meta_data'] && is_string($tx['meta_data'])) {
                $tx['meta_data'] = json_decode($tx['meta_data'], true);
            }
            $transactions[] = $tx;
        }
    }

    // 3. Fetch task logs to determine rejection events and history
    $logStmt = $db->prepare("
        SELECT tl.id, tl.status_from, tl.status_to, tl.changed_by, tl.created_at, u.name as changed_by_name
        FROM task_logs tl
        LEFT JOIN users u ON tl.changed_by = u.id
        WHERE tl.task_id = :task_id
        ORDER BY tl.id ASC
    ");
    $logStmt->execute([':task_id' => $taskId]);
    $logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    $rejectionCount = 0;
    foreach ($logs as $l) {
        if ($l['status_to'] === 'Rejected') {
            $rejectionCount++;
        }
    }

    // 4. Calculate Summaries
    $staffId = intval($task['assigned_to']);
    $staffRewards = 0;
    $staffPenalties = 0;
    $reviewerEarnings = 0;

    foreach ($transactions as $tx) {
        $amt = floatval($tx['amount']);
        $uId = intval($tx['user_id']);
        $type = $tx['type'];

        if (strpos($type, 'reviewer_') === 0) {
            $reviewerEarnings += $amt;
        } else if ($uId === $staffId || $type === 'task_reward' || $type === 'rejection_penalty') {
            if ($amt > 0) {
                $staffRewards += $amt;
            } else {
                $staffPenalties += abs($amt);
            }
        }
    }

    $staffNetCredits = $staffRewards - $staffPenalties;

    // Fallback if no transactions recorded yet in DB (e.g. legacy tasks or active in progress)
    $isSimulated = false;
    if (empty($transactions)) {
        $isSimulated = true;
        if ($task['status'] === 'Completed') {
            $staffRewards = $baseCredit;
            $staffPenalties = $rejectionCount * 1;
            $staffNetCredits = $staffRewards - $staffPenalties;
            $reviewerEarnings = 1 + ($rejectionCount * 1);
        } else if ($task['status'] === 'Rejected') {
            $staffRewards = 0;
            $staffPenalties = $rejectionCount > 0 ? $rejectionCount * 1 : 1;
            $staffNetCredits = -$staffPenalties;
            $reviewerEarnings = $rejectionCount > 0 ? $rejectionCount * 1 : 1;
        } else {
            // In Progress / In Review
            $staffPenalties = $rejectionCount * 1;
            $staffNetCredits = -$staffPenalties;
            $reviewerEarnings = $rejectionCount * 1;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "task_id" => $taskId,
            "task_title" => $task['title'],
            "task_status" => $task['status'],
            "base_credit" => $baseCredit,
            "rejection_count" => $rejectionCount,
            "is_simulated" => $isSimulated,
            "staff" => [
                "id" => $task['assigned_to'],
                "name" => $task['staff_name'],
                "rewards_earned" => $staffRewards,
                "penalties_deducted" => $staffPenalties,
                "net_credits" => $staffNetCredits
            ],
            "reviewer" => [
                "id" => $task['reviewed_by'] ?: $task['rejected_by'],
                "name" => $task['reviewer_name'],
                "total_qa_credits" => $reviewerEarnings
            ],
            "transactions" => $transactions,
            "logs" => $logs
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
