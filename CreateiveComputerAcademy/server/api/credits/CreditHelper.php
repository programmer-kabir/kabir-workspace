<?php
// CreditHelper.php - Creative Computer Academy Credit Management Engine

class CreditHelper {

    /**
     * Ensure required tables and columns exist in DB
     */
    public static function ensureCreditSchema($db) {
        if (!$db) return;
        try {
            $db->exec("
                CREATE TABLE IF NOT EXISTS user_credits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    balance INT NOT NULL DEFAULT 0,
                    total_earned INT NOT NULL DEFAULT 0,
                    total_penalties INT NOT NULL DEFAULT 0,
                    total_sent INT NOT NULL DEFAULT 0,
                    total_received INT NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_user_credits_user (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

            $db->exec("
                CREATE TABLE IF NOT EXISTS credit_transactions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    sender_id INT NULL,
                    receiver_id INT NULL,
                    amount INT NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    reference_id INT NULL,
                    event_key VARCHAR(191) NULL,
                    description TEXT NULL,
                    meta_data LONGTEXT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_ref_id (reference_id),
                    INDEX idx_event_key (event_key)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");

            // Ensure columns and data types in credit_transactions
            $cols = $db->query("SHOW COLUMNS FROM credit_transactions")->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('event_key', $cols)) {
                $db->exec("ALTER TABLE credit_transactions ADD COLUMN event_key VARCHAR(191) NULL AFTER reference_id;");
            }
            if (!in_array('meta_data', $cols)) {
                $db->exec("ALTER TABLE credit_transactions ADD COLUMN meta_data LONGTEXT NULL AFTER description;");
            }
            if (!in_array('sender_id', $cols)) {
                $db->exec("ALTER TABLE credit_transactions ADD COLUMN sender_id INT NULL AFTER user_id;");
            }
            if (!in_array('receiver_id', $cols)) {
                $db->exec("ALTER TABLE credit_transactions ADD COLUMN receiver_id INT NULL AFTER sender_id;");
            }

            // Ensure type column is VARCHAR(50) not restrictive ENUM
            $db->exec("ALTER TABLE credit_transactions MODIFY COLUMN type VARCHAR(50) NOT NULL;");

            // Self-heal: ensure marketplace transactions belong to reviewer (added_by)
            try {
                $mktFixes = $db->query("
                    SELECT ct.id as tx_id, ct.amount, ct.user_id as current_uid, tms.added_by as correct_uid
                    FROM credit_transactions ct
                    JOIN task_marketplace_submissions tms ON (ct.event_key = CONCAT('mkt_dayal_upload_sub_', tms.id) OR ct.event_key = CONCAT('mkt_upload_sub_', tms.id) OR ct.event_key = CONCAT('mkt_approved_sub_', tms.id) OR ct.event_key = CONCAT('mkt_rejected_sub_', tms.id))
                    WHERE ct.user_id != tms.added_by AND tms.added_by > 0
                ")->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($mktFixes)) {
                    foreach ($mktFixes as $fix) {
                        $amt = intval($fix['amount']);
                        $db->prepare("UPDATE credit_transactions SET user_id = :c_uid, receiver_id = :c_uid WHERE id = :id")
                           ->execute([':c_uid' => $fix['correct_uid'], ':id' => $fix['tx_id']]);

                        $db->prepare("UPDATE user_credits SET balance = GREATEST(0, balance - :amt), total_earned = GREATEST(0, total_earned - :amt) WHERE user_id = :old_uid")
                           ->execute([':amt' => $amt, ':old_uid' => $fix['current_uid']]);

                        $db->prepare("INSERT INTO user_credits (user_id, balance, total_earned, total_penalties, total_sent, total_received, created_at, updated_at) VALUES (:u, :amt, :amt, 0, 0, 0, NOW(), NOW()) ON DUPLICATE KEY UPDATE balance = balance + :amt, total_earned = total_earned + :amt")
                           ->execute([':u' => $fix['correct_uid'], ':amt' => $amt]);
                    }
                }
            } catch (Throwable $fixErr) {}
        } catch (Throwable $t) {
            error_log("CreditHelper::ensureCreditSchema error: " . $t->getMessage());
        }
    }

    /**
     * Ensure a user has an initialized record in user_credits
     */
    public static function ensureUserWallet($db, $userId) {
        if (!$db || !$userId) return;

        try {
            self::ensureCreditSchema($db);

            $stmt = $db->prepare("
                INSERT INTO user_credits (user_id, balance, total_earned, total_penalties, total_sent, total_received, created_at, updated_at)
                VALUES (:user_id, 0, 0, 0, 0, 0, NOW(), NOW())
                ON DUPLICATE KEY UPDATE updated_at = updated_at
            ");
            $stmt->execute([':user_id' => $userId]);
        } catch (Throwable $e) {
            error_log("CreditHelper::ensureUserWallet error: " . $e->getMessage());
        }
    }

    /**
     * Get dynamic category credit for a given task ID.
     * Looks at child_category_id, subcategory_id, category_id, or task_categories matching category name.
     */
    public static function getTaskCategoryCredit($db, $taskId) {
        if (!$db || !$taskId) return 5;

        try {
            // First check by specific task category hierarchy
            $stmt = $db->prepare("
                SELECT t.id, t.custom_credit, t.category_id, t.subcategory_id, t.child_category_id, t.category,
                       c_child.credit as child_credit,
                       c_sub.credit as sub_credit,
                       c_main.credit as main_credit
                FROM tasks t
                LEFT JOIN task_categories c_child ON t.child_category_id = c_child.id
                LEFT JOIN task_categories c_sub ON t.subcategory_id = c_sub.id
                LEFT JOIN task_categories c_main ON t.category_id = c_main.id
                WHERE t.id = :task_id
                LIMIT 1
            ");
            $stmt->execute([':task_id' => $taskId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                // Priority 1: Task Custom Credit set during assignment/creation (Highest Priority)
                if (isset($row['custom_credit']) && $row['custom_credit'] !== null && trim((string)$row['custom_credit']) !== '' && intval($row['custom_credit']) > 0) {
                    error_log("CreditHelper::getTaskCategoryCredit - Task #{$taskId} using custom_credit: " . intval($row['custom_credit']));
                    return intval($row['custom_credit']);
                }

                // Priority 2: Child Category Credit (Only if explicitly defined > 0)
                if (isset($row['child_credit']) && $row['child_credit'] !== null && trim((string)$row['child_credit']) !== '' && intval($row['child_credit']) > 0) {
                    error_log("CreditHelper::getTaskCategoryCredit - Task #{$taskId} using child_credit: " . intval($row['child_credit']));
                    return intval($row['child_credit']);
                }

                // Priority 3: Subcategory Credit (e.g. Logo = 10, Business Card = 7, etc.)
                if (isset($row['sub_credit']) && $row['sub_credit'] !== null && trim((string)$row['sub_credit']) !== '' && intval($row['sub_credit']) > 0) {
                    error_log("CreditHelper::getTaskCategoryCredit - Task #{$taskId} using sub_credit: " . intval($row['sub_credit']));
                    return intval($row['sub_credit']);
                }

                // Priority 4: Main Category Credit (e.g. Graphic Design = 5)
                if (isset($row['main_credit']) && $row['main_credit'] !== null && trim((string)$row['main_credit']) !== '' && intval($row['main_credit']) > 0) {
                    error_log("CreditHelper::getTaskCategoryCredit - Task #{$taskId} using main_credit: " . intval($row['main_credit']));
                    return intval($row['main_credit']);
                }

                // Fallback: match by category name string
                if (!empty($row['category'])) {
                    $stmtName = $db->prepare("SELECT credit FROM task_categories WHERE name = :name AND status = 'active' LIMIT 1");
                    $stmtName->execute([':name' => $row['category']]);
                    $catCredit = $stmtName->fetchColumn();
                    if ($catCredit && intval($catCredit) > 0) {
                        return intval($catCredit);
                    }
                }
            }
        } catch (Throwable $e) {
            error_log("CreditHelper::getTaskCategoryCredit error: " . $e->getMessage());
        }

        return 5; // Safe default
    }

    /**
     * Find the staff user ID assigned to a task.
     */
    public static function getTaskStaffUserId($db, $taskId) {
        if (!$db || !$taskId) return null;

        try {
            $stmt = $db->prepare("
                SELECT e.user_id 
                FROM tasks t 
                JOIN employees e ON t.assigned_to = e.id 
                WHERE t.id = :task_id
                LIMIT 1
            ");
            $stmt->execute([':task_id' => $taskId]);
            $uid = $stmt->fetchColumn();
            if ($uid) return intval($uid);

            // Fallback: assigned_to might directly be user_id
            $stmt2 = $db->prepare("SELECT assigned_to FROM tasks WHERE id = :task_id LIMIT 1");
            $stmt2->execute([':task_id' => $taskId]);
            $directUid = $stmt2->fetchColumn();
            if ($directUid) {
                $chkUser = $db->prepare("SELECT id FROM users WHERE id = :uid LIMIT 1");
                $chkUser->execute([':uid' => $directUid]);
                if ($chkUser->fetchColumn()) {
                    return intval($directUid);
                }
            }
        } catch (Throwable $e) {
            error_log("CreditHelper::getTaskStaffUserId error: " . $e->getMessage());
        }
        return null;
    }

    /**
     * Reward staff upon task completion (+Category.credit)
     * Idempotent: duplicate calls for the same task completion cycle will not double-reward.
     */
    public static function rewardTaskCompletion($db, $taskId, $reviewerId = null, $overrideCredit = null) {
        if (!$db || !$taskId) return false;

        try {
            $staffUserId = self::getTaskStaffUserId($db, $taskId);
            if (!$staffUserId) return false;

            self::ensureUserWallet($db, $staffUserId);

            // Fetch task title and category credit
            $stmtTask = $db->prepare("SELECT title FROM tasks WHERE id = :id LIMIT 1");
            $stmtTask->execute([':id' => $taskId]);
            $taskTitle = $stmtTask->fetchColumn() ?: "Task #{$taskId}";

            if ($overrideCredit !== null && intval($overrideCredit) > 0) {
                $creditAmount = intval($overrideCredit);
            } else {
                $creditAmount = self::getTaskCategoryCredit($db, $taskId);
            }
            if ($creditAmount <= 0) $creditAmount = 5;

            // Idempotent event key for this task completion
            $eventKey = "task_reward_task_{$taskId}";

            // Check if already rewarded for this task
            $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :event_key LIMIT 1");
            $chkStmt->execute([':event_key' => $eventKey]);
            if ($chkStmt->fetchColumn()) {
                // Already rewarded
                return true;
            }

            $description = "+{$creditAmount} Credits for completing task: '{$taskTitle}'";

            // Insert transaction
            $txStmt = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, :sender_id, :receiver_id, :amount, 'task_reward', :ref_id, :event_key, :description, :meta, NOW())
            ");
            $txStmt->execute([
                ':user_id'     => $staffUserId,
                ':sender_id'   => $reviewerId ?: null,
                ':receiver_id' => $staffUserId,
                ':amount'      => $creditAmount,
                ':ref_id'      => $taskId,
                ':event_key'   => $eventKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'category_credit' => $creditAmount,
                    'reviewer_id' => $reviewerId
                ])
            ]);

            // Update user wallet balance & total_earned
            $updStmt = $db->prepare("
                UPDATE user_credits 
                SET balance = balance + :amount, 
                    total_earned = total_earned + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :user_id
            ");
            $updStmt->execute([
                ':amount'  => $creditAmount,
                ':user_id' => $staffUserId
            ]);

            // Notify staff
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $staffUserId,
                        $reviewerId,
                        "🪙 +{$creditAmount} Credits Earned!",
                        "You received {$creditAmount} credits for completing '{$taskTitle}'.",
                        "credit_reward",
                        "staff",
                        "/tasks",
                        "normal",
                        ["task_id" => $taskId, "credit_earned" => $creditAmount]
                    );
                }
            } catch (Throwable $e) {}

            return true;

        } catch (Throwable $e) {
            error_log("CreditHelper::rewardTaskCompletion error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Penalize staff upon task rejection (-1 Credit per rejection event).
     * Negative balances ARE permitted (e.g., 2 -> 1 -> 0 -> -1 -> -2).
     */
    public static function penalizeTaskRejection($db, $taskId, $reviewerId = null, $rejectionReason = '', $cycleId = null) {
        if (!$db || !$taskId) return false;

        try {
            $staffUserId = self::getTaskStaffUserId($db, $taskId);
            if (!$staffUserId) return false;

            self::ensureUserWallet($db, $staffUserId);

            $stmtTask = $db->prepare("SELECT title FROM tasks WHERE id = :id LIMIT 1");
            $stmtTask->execute([':id' => $taskId]);
            $taskTitle = $stmtTask->fetchColumn() ?: "Task #{$taskId}";

            $penaltyAmount = -1; // -1 Credit per rejection
            $now = time();
            $eventKey = "task_reject_task_{$taskId}_" . ($cycleId ? $cycleId : "ts_{$now}_" . uniqid());

            $reasonSnippet = $rejectionReason ? (" (\"" . mb_substr($rejectionReason, 0, 50) . "\")") : "";
            $description = "-1 Credit — Task Rejection: '{$taskTitle}'{$reasonSnippet}";

            // Insert transaction
            $txStmt = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, :sender_id, :receiver_id, :amount, 'rejection_penalty', :ref_id, :event_key, :description, :meta, NOW())
            ");
            $txStmt->execute([
                ':user_id'     => $staffUserId,
                ':sender_id'   => $reviewerId ?: null,
                ':receiver_id' => $staffUserId,
                ':amount'      => $penaltyAmount,
                ':ref_id'      => $taskId,
                ':event_key'   => $eventKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'rejection_reason' => $rejectionReason,
                    'reviewer_id' => $reviewerId
                ])
            ]);

            // Update user wallet balance & total_penalties (allows balance to become negative)
            $updStmt = $db->prepare("
                UPDATE user_credits 
                SET balance = balance - 1, 
                    total_penalties = total_penalties + 1, 
                    updated_at = NOW() 
                WHERE user_id = :user_id
            ");
            $updStmt->execute([':user_id' => $staffUserId]);

            // Notify staff
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $staffUserId,
                        $reviewerId,
                        "⚠️ -1 Credit Penalty",
                        "A 1-credit deduction was applied due to revision request on '{$taskTitle}'.",
                        "credit_penalty",
                        "staff",
                        "/tasks",
                        "high",
                        ["task_id" => $taskId, "penalty" => 1, "reason" => $rejectionReason]
                    );
                }
            } catch (Throwable $e) {}

            return true;

        } catch (Throwable $e) {
            error_log("CreditHelper::penalizeTaskRejection error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Peer-to-Peer (P2P) Credit Transfer between teammates.
     * Sender MUST have balance >= amount AND balance > 0.
     * Atomic transaction guarantees consistency.
     */
    public static function transferCredits($db, $senderId, $receiverId, $amount, $notes = '') {
        if (!$db || !$senderId || !$receiverId) {
            return ["status" => "error", "message" => "Sender and Receiver are required."];
        }

        if ($senderId === $receiverId) {
            return ["status" => "error", "message" => "You cannot send credits to yourself."];
        }

        $amount = intval($amount);
        if ($amount <= 0) {
            return ["status" => "error", "message" => "Transfer amount must be at least 1 credit."];
        }

        try {
            self::ensureUserWallet($db, $senderId);
            self::ensureUserWallet($db, $receiverId);

            // Fetch sender info and balance
            $sStmt = $db->prepare("SELECT u.name, uc.balance FROM users u JOIN user_credits uc ON u.id = uc.user_id WHERE u.id = :id");
            $sStmt->execute([':id' => $senderId]);
            $sender = $sStmt->fetch(PDO::FETCH_ASSOC);

            if (!$sender) {
                return ["status" => "error", "message" => "Sender account not found."];
            }

            if (intval($sender['balance']) < $amount) {
                return [
                    "status" => "error", 
                    "message" => "Insufficient credits. Your available balance is " . intval($sender['balance']) . " credits."
                ];
            }

            // Fetch receiver info
            $rStmt = $db->prepare("SELECT name, email FROM users WHERE id = :id");
            $rStmt->execute([':id' => $receiverId]);
            $receiver = $rStmt->fetch(PDO::FETCH_ASSOC);

            if (!$receiver) {
                return ["status" => "error", "message" => "Receiver user not found."];
            }

            // Begin atomic transaction safely
            $startedTx = false;
            if (!$db->inTransaction()) {
                $db->beginTransaction();
                $startedTx = true;
            }

            $eventKeySender = "xfer_sent_" . $senderId . "_" . $receiverId . "_" . time() . "_" . uniqid();
            $eventKeyReceiver = "xfer_recv_" . $senderId . "_" . $receiverId . "_" . time() . "_" . uniqid();

            $noteSuffix = $notes ? (" (\"" . htmlspecialchars($notes) . "\")") : "";

            // 1. Deduct from sender
            $stmtDecr = $db->prepare("
                UPDATE user_credits 
                SET balance = balance - :amount, 
                    total_sent = total_sent + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :sender_id AND balance >= :amount
            ");
            $stmtDecr->execute([':amount' => $amount, ':sender_id' => $senderId]);

            if ($stmtDecr->rowCount() === 0) {
                if ($startedTx && $db->inTransaction()) {
                    $db->rollBack();
                }
                return ["status" => "error", "message" => "Transfer failed. Insufficient balance."];
            }

            // 2. Add to receiver
            $stmtIncr = $db->prepare("
                UPDATE user_credits 
                SET balance = balance + :amount, 
                    total_received = total_received + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :receiver_id
            ");
            $stmtIncr->execute([':amount' => $amount, ':receiver_id' => $receiverId]);

            // 3. Sender transaction record
            $txSender = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, :sender_id, :receiver_id, :amount, 'transfer_sent', NULL, :event_key, :description, :meta, NOW())
            ");
            $txSender->execute([
                ':user_id'     => $senderId,
                ':sender_id'   => $senderId,
                ':receiver_id' => $receiverId,
                ':amount'      => -$amount,
                ':event_key'   => $eventKeySender,
                ':description' => "Sent {$amount} Credits to {$receiver['name']}{$noteSuffix}",
                ':meta'        => json_encode(['receiver_name' => $receiver['name'], 'notes' => $notes])
            ]);

            // 4. Receiver transaction record
            $txReceiver = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, :sender_id, :receiver_id, :amount, 'transfer_received', NULL, :event_key, :description, :meta, NOW())
            ");
            $txReceiver->execute([
                ':user_id'     => $receiverId,
                ':sender_id'   => $senderId,
                ':receiver_id' => $receiverId,
                ':amount'      => $amount,
                ':event_key'   => $eventKeyReceiver,
                ':description' => "Received {$amount} Credits from {$sender['name']}{$noteSuffix}",
                ':meta'        => json_encode(['sender_name' => $sender['name'], 'notes' => $notes])
            ]);

            if ($startedTx && $db->inTransaction()) {
                $db->commit();
            }

            // Fetch new sender balance
            $balStmt = $db->prepare("SELECT balance FROM user_credits WHERE user_id = :id");
            $balStmt->execute([':id' => $senderId]);
            $newBalance = intval($balStmt->fetchColumn() ?: 0);

            // Send notification to receiver
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $receiverId,
                        $senderId,
                        "🎁 +{$amount} Credits Received!",
                        "{$sender['name']} sent you {$amount} credits" . ($notes ? ": \"{$notes}\"" : "."),
                        "credit_transfer",
                        "staff",
                        "/credits",
                        "normal",
                        ["amount" => $amount, "sender_name" => $sender['name']]
                    );
                }
            } catch (Throwable $e) {}

            return [
                "status" => "success",
                "message" => "Successfully transferred {$amount} credits to {$receiver['name']}.",
                "new_balance" => $newBalance
            ];

        } catch (Throwable $e) {
            if (isset($startedTx) && $startedTx && $db->inTransaction()) {
                $db->rollBack();
            }
            return ["status" => "error", "message" => "Transfer error: " . $e->getMessage()];
        }
    }

    /**
     * Get complete wallet details and ledger history for a user with portal role split
     */
    public static function getWallet($db, $userId, $portal = 'all') {
        if (!$db || !$userId) {
            return [
                'balance' => 0,
                'reviewer_balance' => 0,
                'staff_balance' => 0,
                'total_combined' => 0,
                'total_earned' => 0,
                'total_sent' => 0,
                'total_received' => 0,
                'total_penalties' => 0,
                'rank' => 1,
                'updated_at' => date('Y-m-d H:i:s'),
                'transactions' => []
            ];
        }

        // Auto ensure credit_transactions.type supports reviewer strings (VARCHAR instead of restrictive ENUM)
        try {
            $db->exec("ALTER TABLE credit_transactions MODIFY COLUMN type VARCHAR(50) NOT NULL;");
            $db->exec("UPDATE credit_transactions SET type = 'reviewer_approval_reward' WHERE event_key LIKE 'rev_appr_%' AND (type = '' OR type IS NULL);");
            $db->exec("UPDATE credit_transactions SET type = 'reviewer_rejection_reward' WHERE event_key LIKE 'rev_rejc_%' AND (type = '' OR type IS NULL);");
            $db->exec("UPDATE credit_transactions SET type = 'reviewer_delivery_bonus' WHERE event_key LIKE 'rev_deliv_%' AND (type = '' OR type IS NULL);");
        } catch (Throwable $e) {}

        self::ensureUserWallet($db, $userId);

        // 1. Calculate Reviewer Balance (QA / Review rewards + Marketplace rewards)
        $revStmt = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) 
            FROM credit_transactions 
            WHERE user_id = :uid AND (type LIKE 'reviewer_%' OR type LIKE 'marketplace_%' OR event_key LIKE 'rev_%' OR event_key LIKE 'mkt_%')
        ");
        $revStmt->execute([':uid' => $userId]);
        $reviewerBalance = intval($revStmt->fetchColumn() ?: 0);

        // 2. Calculate Staff Balance (Task completions & design penalties)
        $stfStmt = $db->prepare("
            SELECT COALESCE(SUM(amount), 0) 
            FROM credit_transactions 
            WHERE user_id = :uid AND type NOT LIKE 'reviewer_%' AND type NOT LIKE 'marketplace_%' AND (event_key NOT LIKE 'rev_%' AND event_key NOT LIKE 'mkt_%' OR event_key IS NULL)
        ");
        $stfStmt->execute([':uid' => $userId]);
        $staffBalance = intval($stfStmt->fetchColumn() ?: 0);

        // Stats calculation based on portal
        if ($portal === 'reviewer') {
            $activeBalance = $reviewerBalance;
            $earnedStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE user_id = :uid AND amount > 0 AND (type LIKE 'reviewer_%' OR type LIKE 'marketplace_%' OR event_key LIKE 'rev_%' OR event_key LIKE 'mkt_%')
            ");
            $earnedStmt->execute([':uid' => $userId]);
            $totalEarned = intval($earnedStmt->fetchColumn() ?: 0);

            $penStmt = $db->prepare("
                SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions 
                WHERE user_id = :uid AND amount < 0 AND (type LIKE 'reviewer_%' OR type LIKE 'marketplace_%' OR event_key LIKE 'rev_%' OR event_key LIKE 'mkt_%')
            ");
            $penStmt->execute([':uid' => $userId]);
            $totalPenalties = intval($penStmt->fetchColumn() ?: 0);

            $totalSent = 0;
            $totalReceived = 0;
            $portalFilter = " AND (ct.type LIKE 'reviewer_%' OR ct.type LIKE 'marketplace_%' OR ct.event_key LIKE 'rev_%' OR ct.event_key LIKE 'mkt_%') ";
        } else if ($portal === 'staff') {
            $activeBalance = $staffBalance;
            $earnedStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE user_id = :uid AND amount > 0 AND type NOT LIKE 'reviewer_%' AND type NOT LIKE 'marketplace_%' AND (event_key NOT LIKE 'rev_%' AND event_key NOT LIKE 'mkt_%' OR event_key IS NULL)
            ");
            $earnedStmt->execute([':uid' => $userId]);
            $totalEarned = intval($earnedStmt->fetchColumn() ?: 0);

            $penStmt = $db->prepare("
                SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions 
                WHERE user_id = :uid AND amount < 0 AND type NOT LIKE 'reviewer_%' AND type NOT LIKE 'marketplace_%' AND (event_key NOT LIKE 'rev_%' AND event_key NOT LIKE 'mkt_%' OR event_key IS NULL)
            ");
            $penStmt->execute([':uid' => $userId]);
            $totalPenalties = intval($penStmt->fetchColumn() ?: 0);

            $sentStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE sender_id = :uid AND type = 'transfer_sent'
            ");
            $sentStmt->execute([':uid' => $userId]);
            $totalSent = intval($sentStmt->fetchColumn() ?: 0);

            $recStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE receiver_id = :uid AND type = 'transfer_received'
            ");
            $recStmt->execute([':uid' => $userId]);
            $totalReceived = intval($recStmt->fetchColumn() ?: 0);

            $portalFilter = " AND (ct.type NOT LIKE 'reviewer_%' AND ct.type NOT LIKE 'marketplace_%' AND (ct.event_key NOT LIKE 'rev_%' AND ct.event_key NOT LIKE 'mkt_%' OR ct.event_key IS NULL)) ";
        } else {
            $activeBalance = $totalCombined;
            $earnedStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE user_id = :uid AND amount > 0
            ");
            $earnedStmt->execute([':uid' => $userId]);
            $totalEarned = intval($earnedStmt->fetchColumn() ?: 0);

            $penStmt = $db->prepare("
                SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions 
                WHERE user_id = :uid AND amount < 0
            ");
            $penStmt->execute([':uid' => $userId]);
            $totalPenalties = intval($penStmt->fetchColumn() ?: 0);

            $sentStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE sender_id = :uid AND type = 'transfer_sent'
            ");
            $sentStmt->execute([':uid' => $userId]);
            $totalSent = intval($sentStmt->fetchColumn() ?: 0);

            $recStmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) FROM credit_transactions 
                WHERE receiver_id = :uid AND type = 'transfer_received'
            ");
            $recStmt->execute([':uid' => $userId]);
            $totalReceived = intval($recStmt->fetchColumn() ?: 0);

            $portalFilter = "";
        }

        // Fetch user ranking amongst all staff/members
        $rankStmt = $db->prepare("
            SELECT COUNT(*) + 1 as rank 
            FROM user_credits 
            WHERE balance > :balance
        ");
        $rankStmt->execute([':balance' => $totalCombined]);
        $rank = $rankStmt->fetchColumn() ?: 1;

        // Fetch recent transactions with participant user names and task details
        $txStmt = $db->prepare("
            SELECT 
                ct.id,
                ct.amount,
                ct.type,
                ct.description,
                ct.event_key,
                ct.reference_id,
                ct.meta_data,
                ct.created_at,
                u_s.name as sender_name,
                u_r.name as receiver_name,
                t.title as task_title,
                COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') as task_category_name,
                t.status as task_status
            FROM credit_transactions ct
            LEFT JOIN users u_s ON ct.sender_id = u_s.id
            LEFT JOIN users u_r ON ct.receiver_id = u_r.id
            LEFT JOIN tasks t ON ct.reference_id = t.id
            LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
            LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
            LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
            WHERE ct.user_id = :user_id {$portalFilter}
            ORDER BY ct.created_at DESC, ct.id DESC
            LIMIT 200
        ");
        $txStmt->execute([':user_id' => $userId]);
        $transactions = $txStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($transactions as &$tx) {
            if (!empty($tx['meta_data'])) {
                $meta = json_decode($tx['meta_data'], true);
                $tx['meta_data'] = is_array($meta) ? $meta : [];
            } else {
                $tx['meta_data'] = [];
            }
            if (!empty($tx['task_title']) && empty($tx['meta_data']['task_title'])) {
                $tx['meta_data']['task_title'] = $tx['task_title'];
            }
            if (!empty($tx['task_category_name']) && empty($tx['meta_data']['category_name'])) {
                $tx['meta_data']['category_name'] = $tx['task_category_name'];
            }
        }
        unset($tx);

        $policySettings = [
            'reviewer_approval_credit' => intval(self::getSystemSetting($db, 'reviewer_approval_credit', 1)),
            'reviewer_rejection_credit' => intval(self::getSystemSetting($db, 'reviewer_rejection_credit', 1)),
            'reviewer_delivery_bonus' => intval(self::getSystemSetting($db, 'reviewer_delivery_bonus', 3)),
            'max_review_rewards_per_task' => intval(self::getSystemSetting($db, 'max_review_rewards_per_task', 3)),
        ];

        return [
            "balance" => $activeBalance,
            "reviewer_balance" => $reviewerBalance,
            "staff_balance" => $staffBalance,
            "total_combined" => $totalCombined,
            "total_earned" => $totalEarned,
            "total_sent" => $totalSent,
            "total_received" => $totalReceived,
            "total_penalties" => $totalPenalties,
            "rank" => intval($rank),
            "updated_at" => date('Y-m-d H:i:s'),
            "policy_settings" => $policySettings,
            "transactions" => $transactions
        ];
    }

    /**
     * Fetch a system setting from `system_settings` table.
     */
    public static function getSystemSetting($db, $settingKey, $default = 0) {
        if (!$db || empty($settingKey)) return $default;

        try {
            $stmt = $db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = :key LIMIT 1");
            $stmt->execute([':key' => $settingKey]);
            $val = $stmt->fetchColumn();

            if ($val !== false && $val !== null) {
                return is_numeric($val) ? (float)$val : $val;
            }
        } catch (Throwable $e) {
            error_log("CreditHelper::getSystemSetting error: " . $e->getMessage());
        }

        return $default;
    }

    /**
     * Count reviewer rewards for a specific task (Anti-Abuse Cap).
     */
    public static function countReviewerTaskRewards($db, $taskId, $reviewerId) {
        if (!$db || !$taskId || !$reviewerId) return 0;
        try {
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM credit_transactions 
                WHERE user_id = :uid 
                  AND reference_id = :tid 
                  AND type IN ('reviewer_approval_reward', 'reviewer_rejection_reward', 'reviewer_delivery_bonus')
            ");
            $stmt->execute([':uid' => $reviewerId, ':tid' => $taskId]);
            return intval($stmt->fetchColumn() ?: 0);
        } catch (Throwable $e) {
            return 0;
        }
    }

    /**
     * Reward reviewer upon approving a task.
     */
    public static function rewardReviewerApproval($db, $taskId, $reviewerId, $overrideCredit = null) {
        if (!$db || !$taskId || !$reviewerId) return false;

        try {
            // Anti-Spam: Check maximum rewards cap per task
            $maxCap = intval(self::getSystemSetting($db, 'max_review_rewards_per_task', 3));
            $existingCount = self::countReviewerTaskRewards($db, $taskId, $reviewerId);
            if ($existingCount >= $maxCap) {
                error_log("CreditHelper::rewardReviewerApproval: Max review rewards cap ({$maxCap}) reached for task #{$taskId}.");
                return false;
            }

            self::ensureUserWallet($db, $reviewerId);

            $stmtTask = $db->prepare("SELECT title FROM tasks WHERE id = :id LIMIT 1");
            $stmtTask->execute([':id' => $taskId]);
            $taskTitle = $stmtTask->fetchColumn() ?: "Task #{$taskId}";

            if ($overrideCredit !== null && intval($overrideCredit) > 0) {
                $creditAmount = intval($overrideCredit);
            } else {
                $creditAmount = intval(self::getSystemSetting($db, 'reviewer_approval_credit', 1));
            }
            if ($creditAmount <= 0) $creditAmount = 1;

            $cycleKey = "rev_appr_task_{$taskId}_rev_{$reviewerId}_round_" . ($existingCount + 1);

            // Check duplicate
            $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :event_key LIMIT 1");
            $chkStmt->execute([':event_key' => $cycleKey]);
            if ($chkStmt->fetchColumn()) {
                return true; // Already rewarded
            }

            $description = "+{$creditAmount} Reviewer Credit — Approved task: '{$taskTitle}'";

            $txStmt = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, NULL, :receiver_id, :amount, 'reviewer_approval_reward', :ref_id, :event_key, :description, :meta, NOW())
            ");
            $txStmt->execute([
                ':user_id'     => $reviewerId,
                ':receiver_id' => $reviewerId,
                ':amount'      => $creditAmount,
                ':ref_id'      => $taskId,
                ':event_key'   => $cycleKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'action' => 'reviewer_approval',
                    'reviewer_id' => $reviewerId
                ])
            ]);

            // Update reviewer wallet
            $updStmt = $db->prepare("
                UPDATE user_credits 
                SET balance = balance + :amount, 
                    total_earned = total_earned + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :user_id
            ");
            $updStmt->execute([
                ':amount'  => $creditAmount,
                ':user_id' => $reviewerId
            ]);

            // Notify reviewer
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $reviewerId,
                        null,
                        "🪙 +{$creditAmount} Reviewer Credit!",
                        "You earned +{$creditAmount} credit for reviewing & approving '{$taskTitle}'.",
                        "credit_reward",
                        "reviewer",
                        "/pending",
                        "normal",
                        ["task_id" => $taskId, "credit_earned" => $creditAmount]
                    );
                }
            } catch (Throwable $e) {}

            return true;
        } catch (Throwable $e) {
            error_log("CreditHelper::rewardReviewerApproval error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Reward reviewer upon thorough QA rejection with constructive feedback.
     */
    public static function rewardReviewerRejection($db, $taskId, $reviewerId, $rejectionReason = '') {
        if (!$db || !$taskId || !$reviewerId) return false;

        try {
            // Anti-Spam: Check maximum rewards cap per task
            $maxCap = intval(self::getSystemSetting($db, 'max_review_rewards_per_task', 3));
            $existingCount = self::countReviewerTaskRewards($db, $taskId, $reviewerId);
            if ($existingCount >= $maxCap) {
                error_log("CreditHelper::rewardReviewerRejection: Max review rewards cap ({$maxCap}) reached for task #{$taskId}.");
                return false;
            }

            self::ensureUserWallet($db, $reviewerId);

            $stmtTask = $db->prepare("SELECT title FROM tasks WHERE id = :id LIMIT 1");
            $stmtTask->execute([':id' => $taskId]);
            $taskTitle = $stmtTask->fetchColumn() ?: "Task #{$taskId}";

            $creditAmount = intval(self::getSystemSetting($db, 'reviewer_rejection_credit', 1));
            if ($creditAmount <= 0) $creditAmount = 1;

            $now = time();
            $eventKey = "rev_rejc_task_{$taskId}_rev_{$reviewerId}_ts_{$now}_" . uniqid();

            $description = "+{$creditAmount} QA Credit — Detailed feedback & rejection on '{$taskTitle}'";

            $txStmt = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, NULL, :receiver_id, :amount, 'reviewer_rejection_reward', :ref_id, :event_key, :description, :meta, NOW())
            ");
            $txStmt->execute([
                ':user_id'     => $reviewerId,
                ':receiver_id' => $reviewerId,
                ':amount'      => $creditAmount,
                ':ref_id'      => $taskId,
                ':event_key'   => $eventKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'action' => 'reviewer_rejection',
                    'rejection_reason' => $rejectionReason,
                    'reviewer_id' => $reviewerId
                ])
            ]);

            // Update reviewer wallet
            $updStmt = $db->prepare("
                UPDATE user_credits 
                SET balance = balance + :amount, 
                    total_earned = total_earned + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :user_id
            ");
            $updStmt->execute([
                ':amount'  => $creditAmount,
                ':user_id' => $reviewerId
            ]);

            // Notify reviewer
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $reviewerId,
                        null,
                        "🪙 +{$creditAmount} QA Credit!",
                        "You earned +{$creditAmount} credit for thorough QA inspection on '{$taskTitle}'.",
                        "credit_reward",
                        "reviewer",
                        "/pending",
                        "normal",
                        ["task_id" => $taskId, "credit_earned" => $creditAmount]
                    );
                }
            } catch (Throwable $e) {}

            return true;
        } catch (Throwable $e) {
            error_log("CreditHelper::rewardReviewerRejection error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Super Delivery Bonus: Reward reviewer for fixing designs & delivering final files to R2.
     */
    public static function rewardReviewerDeliveryBonus($db, $taskId, $reviewerId, $overrideCredit = null) {
        if (!$db || !$taskId || !$reviewerId) return false;

        try {
            self::ensureUserWallet($db, $reviewerId);

            $stmtTask = $db->prepare("SELECT title FROM tasks WHERE id = :id LIMIT 1");
            $stmtTask->execute([':id' => $taskId]);
            $taskTitle = $stmtTask->fetchColumn() ?: "Task #{$taskId}";

            if ($overrideCredit !== null && intval($overrideCredit) > 0) {
                $bonusAmount = intval($overrideCredit);
            } else {
                $bonusAmount = intval(self::getSystemSetting($db, 'reviewer_delivery_bonus', 3));
            }
            if ($bonusAmount <= 0) $bonusAmount = 3;

            $eventKey = "rev_deliv_task_{$taskId}_rev_{$reviewerId}";

            // Check if already awarded delivery bonus for this task
            $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :event_key LIMIT 1");
            $chkStmt->execute([':event_key' => $eventKey]);
            if ($chkStmt->fetchColumn()) {
                return true; // Already awarded
            }

            $description = "+{$bonusAmount} Super Delivery Bonus — Fixed & delivered final assets for: '{$taskTitle}'";

            $txStmt = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, NULL, :receiver_id, :amount, 'reviewer_delivery_bonus', :ref_id, :event_key, :description, :meta, NOW())
            ");
            $txStmt->execute([
                ':user_id'     => $reviewerId,
                ':receiver_id' => $reviewerId,
                ':amount'      => $bonusAmount,
                ':ref_id'      => $taskId,
                ':event_key'   => $eventKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'action' => 'reviewer_final_delivery',
                    'reviewer_id' => $reviewerId
                ])
            ]);

            // Update reviewer wallet
            $updStmt = $db->prepare("
                UPDATE user_credits 
                SET balance = balance + :amount, 
                    total_earned = total_earned + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :user_id
            ");
            $updStmt->execute([
                ':amount'  => $bonusAmount,
                ':user_id' => $reviewerId
            ]);

            // Notify reviewer
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $reviewerId,
                        null,
                        "🚀 +{$bonusAmount} Super Delivery Bonus!",
                        "You earned +{$bonusAmount} bonus credits for fixing and uploading final stock delivery for '{$taskTitle}'!",
                        "credit_reward",
                        "reviewer",
                        "/completed",
                        "high",
                        ["task_id" => $taskId, "credit_earned" => $bonusAmount]
                    );
                }
            } catch (Throwable $e) {}

            return true;
        } catch (Throwable $e) {
            error_log("CreditHelper::rewardReviewerDeliveryBonus error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Handle Initial Marketplace Upload Credit (+1 Credit for reviewer who uploads)
     * For Dayal Stock: +1 Credit (Type: marketplace_dayal_upload)
     * For External Marketplace: +1 Credit (Type: marketplace_upload)
     * Idempotent: Never awards duplicate credit for the same submission upload.
     */
    public static function handleMarketplaceUploadCredit($db, $submissionId, $actorId = null) {
        if (!$db || !$submissionId) return false;

        try {
            $stmt = $db->prepare("
                SELECT tms.*, t.title as task_title 
                FROM task_marketplace_submissions tms
                LEFT JOIN tasks t ON tms.task_id = t.id
                WHERE tms.id = :id
                LIMIT 1
            ");
            $stmt->execute([':id' => $submissionId]);
            $sub = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$sub) return false;

            // Beneficiary is the Reviewer / Admin who added the marketplace submission
            $beneficiaryUserId = intval(!empty($sub['added_by']) ? $sub['added_by'] : $sub['user_id']);
            if (!$beneficiaryUserId) return false;

            $taskId = intval($sub['task_id']);
            $taskTitle = $sub['task_title'] ?: "Task #{$taskId}";
            $marketplace = trim($sub['marketplace'] ?: 'External Marketplace');
            $customMarket = trim($sub['custom_market'] ?: '');
            $displayMarket = ($marketplace === 'Custom' && $customMarket) ? $customMarket : $marketplace;
            $isDayalStock = (strcasecmp($marketplace, 'Dayal Stock') === 0);

            self::ensureUserWallet($db, $beneficiaryUserId);

            $eventKey = $isDayalStock 
                ? "mkt_dayal_upload_sub_{$submissionId}" 
                : "mkt_upload_sub_{$submissionId}";
            $txType = $isDayalStock 
                ? "marketplace_dayal_upload" 
                : "marketplace_upload";
            $creditAmount = 1;

            // Check duplicate
            $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :event_key LIMIT 1");
            $chkStmt->execute([':event_key' => $eventKey]);
            if ($chkStmt->fetchColumn()) {
                return true; // Already awarded
            }

            $description = $isDayalStock
                ? "+1 Credit — Dayal Stock Upload for: '{$taskTitle}'"
                : "+1 Credit — Marketplace Upload: {$displayMarket} for '{$taskTitle}'";

            $startedTx = false;
            if (!$db->inTransaction()) {
                $db->beginTransaction();
                $startedTx = true;
            }

            $txStmt = $db->prepare("
                INSERT INTO credit_transactions 
                (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                VALUES 
                (:user_id, :sender_id, :receiver_id, :amount, :type, :ref_id, :event_key, :description, :meta, NOW())
            ");
            $txStmt->execute([
                ':user_id'     => $beneficiaryUserId,
                ':sender_id'   => $actorId ?: null,
                ':receiver_id' => $beneficiaryUserId,
                ':amount'      => $creditAmount,
                ':type'        => $txType,
                ':ref_id'      => $taskId,
                ':event_key'   => $eventKey,
                ':description' => $description,
                ':meta'        => json_encode([
                    'task_id' => $taskId,
                    'task_title' => $taskTitle,
                    'submission_id' => (int)$submissionId,
                    'marketplace' => $displayMarket,
                    'is_dayal_stock' => $isDayalStock,
                    'event' => 'upload',
                    'actor_id' => $actorId
                ])
            ]);

            $updStmt = $db->prepare("
                UPDATE user_credits 
                SET balance = balance + :amount, 
                    total_earned = total_earned + :amount, 
                    updated_at = NOW() 
                WHERE user_id = :user_id
            ");
            $updStmt->execute([
                ':amount'  => $creditAmount,
                ':user_id' => $beneficiaryUserId
            ]);

            if ($startedTx && $db->inTransaction()) {
                $db->commit();
            }

            // Notification
            try {
                if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                    require_once __DIR__ . '/../notifications/notification_helper.php';
                    NotificationHelper::sendToUser(
                        $db,
                        $beneficiaryUserId,
                        $actorId,
                        "🪙 +1 Marketplace Credit Earned!",
                        $description,
                        "credit_reward",
                        "reviewer",
                        "/tasks",
                        "normal",
                        ["task_id" => $taskId, "submission_id" => $submissionId, "credit_earned" => 1, "marketplace" => $displayMarket]
                    );
                }
            } catch (Throwable $e) {}

            return true;
        } catch (Throwable $e) {
            if (isset($startedTx) && $startedTx && $db->inTransaction()) {
                $db->rollBack();
            }
            error_log("CreditHelper::handleMarketplaceUploadCredit error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Handle Marketplace Status Change Credit:
     * - For Dayal Stock: 0 credit change on Approved / Rejected.
     * - For External Marketplace:
     *   - Status 'approved': +2 Additional Credits (Total = +3 Credits)
     *   - Status 'rejected': -1 Credit Deduction (Net = 0 Credit)
     * Idempotent: Never applies duplicate approval or rejection credits.
     */
    public static function handleMarketplaceStatusChangeCredit($db, $submissionId, $oldStatus, $newStatus, $actorId = null, $rejectReason = '') {
        if (!$db || !$submissionId) return false;

        try {
            $stmt = $db->prepare("
                SELECT tms.*, t.title as task_title 
                FROM task_marketplace_submissions tms
                LEFT JOIN tasks t ON tms.task_id = t.id
                WHERE tms.id = :id
                LIMIT 1
            ");
            $stmt->execute([':id' => $submissionId]);
            $sub = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$sub) return false;

            // Beneficiary is the Reviewer / Admin who added/manages the marketplace submission
            $beneficiaryUserId = intval(!empty($sub['added_by']) ? $sub['added_by'] : $sub['user_id']);
            if (!$beneficiaryUserId) return false;

            $taskId = intval($sub['task_id']);
            $taskTitle = $sub['task_title'] ?: "Task #{$taskId}";
            $marketplace = trim($sub['marketplace'] ?: 'External Marketplace');
            $customMarket = trim($sub['custom_market'] ?: '');
            $displayMarket = ($marketplace === 'Custom' && $customMarket) ? $customMarket : $marketplace;
            $isDayalStock = (strcasecmp($marketplace, 'Dayal Stock') === 0);

            // Dayal Stock: No additional credits on Approved, No deduction on Rejected
            if ($isDayalStock) {
                return true;
            }

            // Ensure initial upload credit was granted
            self::handleMarketplaceUploadCredit($db, $submissionId, $actorId);
            self::ensureUserWallet($db, $beneficiaryUserId);

            // 1. APPROVAL: +2 Additional Credits
            if ($newStatus === 'approved') {
                $eventKey = "mkt_approved_sub_{$submissionId}";
                $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :event_key LIMIT 1");
                $chkStmt->execute([':event_key' => $eventKey]);
                if ($chkStmt->fetchColumn()) {
                    return true; // Already rewarded for approval
                }

                $creditAmount = 2; // +2 Additional
                $description = "+2 Credits — Approved on {$displayMarket} for '{$taskTitle}' (Total: +3 Credits)";

                $startedTx = false;
                if (!$db->inTransaction()) {
                    $db->beginTransaction();
                    $startedTx = true;
                }

                $txStmt = $db->prepare("
                    INSERT INTO credit_transactions 
                    (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                    VALUES 
                    (:user_id, :sender_id, :receiver_id, :amount, 'marketplace_approved', :ref_id, :event_key, :description, :meta, NOW())
                ");
                $txStmt->execute([
                    ':user_id'     => $beneficiaryUserId,
                    ':sender_id'   => $actorId ?: null,
                    ':receiver_id' => $beneficiaryUserId,
                    ':amount'      => $creditAmount,
                    ':ref_id'      => $taskId,
                    ':event_key'   => $eventKey,
                    ':description' => $description,
                    ':meta'        => json_encode([
                        'task_id' => $taskId,
                        'task_title' => $taskTitle,
                        'submission_id' => (int)$submissionId,
                        'marketplace' => $displayMarket,
                        'event' => 'approved',
                        'actor_id' => $actorId
                    ])
                ]);

                $updStmt = $db->prepare("
                    UPDATE user_credits 
                    SET balance = balance + :amount, 
                        total_earned = total_earned + :amount, 
                        updated_at = NOW() 
                    WHERE user_id = :user_id
                ");
                $updStmt->execute([
                    ':amount'  => $creditAmount,
                    ':user_id' => $beneficiaryUserId
                ]);

                if ($startedTx && $db->inTransaction()) {
                    $db->commit();
                }

                // Notification
                try {
                    if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                        require_once __DIR__ . '/../notifications/notification_helper.php';
                        NotificationHelper::sendToUser(
                            $db,
                            $beneficiaryUserId,
                            $actorId,
                            "🎉 +2 Marketplace Approval Credits!",
                            $description,
                            "credit_reward",
                            "reviewer",
                            "/tasks",
                            "high",
                            ["task_id" => $taskId, "submission_id" => $submissionId, "credit_earned" => 2, "marketplace" => $displayMarket]
                        );
                    }
                } catch (Throwable $e) {}

                return true;
            }

            // 2. REJECTION: -1 Credit Deduction (Reverts initial upload credit)
            if ($newStatus === 'rejected') {
                $eventKey = "mkt_rejected_sub_{$submissionId}";
                $chkStmt = $db->prepare("SELECT id FROM credit_transactions WHERE event_key = :event_key LIMIT 1");
                $chkStmt->execute([':event_key' => $eventKey]);
                if ($chkStmt->fetchColumn()) {
                    return true; // Already penalized for rejection
                }

                $penaltyAmount = -1;
                $reasonSnippet = $rejectReason ? (" (\"" . mb_substr($rejectReason, 0, 50) . "\")") : "";
                $description = "-1 Credit — Rejected on {$displayMarket} for '{$taskTitle}'{$reasonSnippet} (Net: 0 Credit)";

                $startedTx = false;
                if (!$db->inTransaction()) {
                    $db->beginTransaction();
                    $startedTx = true;
                }

                $txStmt = $db->prepare("
                    INSERT INTO credit_transactions 
                    (user_id, sender_id, receiver_id, amount, type, reference_id, event_key, description, meta_data, created_at)
                    VALUES 
                    (:user_id, :sender_id, :receiver_id, :amount, 'marketplace_rejected', :ref_id, :event_key, :description, :meta, NOW())
                ");
                $txStmt->execute([
                    ':user_id'     => $beneficiaryUserId,
                    ':sender_id'   => $actorId ?: null,
                    ':receiver_id' => $beneficiaryUserId,
                    ':amount'      => $penaltyAmount,
                    ':ref_id'      => $taskId,
                    ':event_key'   => $eventKey,
                    ':description' => $description,
                    ':meta'        => json_encode([
                        'task_id' => $taskId,
                        'task_title' => $taskTitle,
                        'submission_id' => (int)$submissionId,
                        'marketplace' => $displayMarket,
                        'event' => 'rejected',
                        'reject_reason' => $rejectReason,
                        'actor_id' => $actorId
                    ])
                ]);

                $updStmt = $db->prepare("
                    UPDATE user_credits 
                    SET balance = balance - 1, 
                        total_penalties = total_penalties + 1, 
                        updated_at = NOW() 
                    WHERE user_id = :user_id
                ");
                $updStmt->execute([':user_id' => $beneficiaryUserId]);

                if ($startedTx && $db->inTransaction()) {
                    $db->commit();
                }

                // Notification
                try {
                    if (file_exists(__DIR__ . '/../notifications/notification_helper.php')) {
                        require_once __DIR__ . '/../notifications/notification_helper.php';
                        NotificationHelper::sendToUser(
                            $db,
                            $beneficiaryUserId,
                            $actorId,
                            "⚠️ -1 Credit Marketplace Rejection Deduction",
                            $description,
                            "credit_penalty",
                            "reviewer",
                            "/tasks",
                            "high",
                            ["task_id" => $taskId, "submission_id" => $submissionId, "penalty" => 1, "marketplace" => $displayMarket, "reason" => $rejectReason]
                        );
                    }
                } catch (Throwable $e) {}

                return true;
            }

            return true;
        } catch (Throwable $e) {
            if (isset($startedTx) && $startedTx && $db->inTransaction()) {
                $db->rollBack();
            }
            error_log("CreditHelper::handleMarketplaceStatusChangeCredit error: " . $e->getMessage());
            return false;
        }
    }
}
?>
