<?php
// server/api/admin/payroll/toggle_cycle_unlock.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';
require_once __DIR__ . '/../../notifications/notification_helper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

// Self-heal table
PayrollHelper::ensureSchema($pdo);

try {
    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

    $monthKey = !empty($data['month_key']) ? trim($data['month_key']) : '';
    $isUnlocked = isset($data['is_unlocked']) ? (intval($data['is_unlocked']) ? 1 : 0) : 1;
    $adminId = !empty($data['admin_id']) ? intval($data['admin_id']) : null;
    $notes = !empty($data['notes']) ? trim($data['notes']) : null;

    if (empty($monthKey) || !preg_match('/^\d{4}-\d{2}$/', $monthKey)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid month_key (YYYY-MM) is required.']);
        exit();
    }

    $monthLabel = date('F Y', strtotime($monthKey . '-01'));

    // Check if record exists
    $stmtCheck = $pdo->prepare("SELECT id FROM payroll_cycle_controls WHERE month_key = :mk LIMIT 1");
    $stmtCheck->execute([':mk' => $monthKey]);
    $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $stmtUpdate = $pdo->prepare("
            UPDATE payroll_cycle_controls SET
                is_unlocked = :is_unlocked,
                unlocked_at = " . ($isUnlocked ? "NOW()" : "NULL") . ",
                unlocked_by = :admin_id,
                notes = :notes
            WHERE id = :id
        ");
        $stmtUpdate->execute([
            ':is_unlocked' => $isUnlocked,
            ':admin_id' => $adminId,
            ':notes' => $notes,
            ':id' => $existing['id']
        ]);
    } else {
        $stmtInsert = $pdo->prepare("
            INSERT INTO payroll_cycle_controls (
                month_key, is_unlocked, unlocked_at, unlocked_by, notes
            ) VALUES (
                :mk, :is_unlocked, " . ($isUnlocked ? "NOW()" : "NULL") . ", :admin_id, :notes
            )
        ");
        $stmtInsert->execute([
            ':mk' => $monthKey,
            ':is_unlocked' => $isUnlocked,
            ':admin_id' => $adminId,
            ':notes' => $notes
        ]);
    }

    $actionWord = $isUnlocked ? 'unlocked' : 'locked';

    // Broadcast in-app notification to all active staff if unlocked
    if ($isUnlocked) {
        try {
            $msg = "📢 পে-রোল আপডেট: {$monthLabel} মাসের পে-রোল সাইকেল অ্যাডমিন কর্তৃক আনলক করা হয়েছে। আপনি এখন আপনার পে-রোল ওয়ালেট চেক করতে পারেন।";
            NotificationHelper::sendToRole(
                $pdo,
                'staff',
                $adminId,
                "🎉 {$monthLabel} পে-রোল সাইকেল আনলক!",
                $msg,
                'payroll_unlocked',
                'staff',
                '/payroll',
                'high',
                ['month_key' => $monthKey, 'cycle_label' => $monthLabel]
            );
        } catch (Throwable $e) {}
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Payroll cycle for {$monthLabel} has been {$actionWord} successfully.",
        'data' => [
            'month_key' => $monthKey,
            'month_label' => $monthLabel,
            'is_unlocked' => $isUnlocked,
            'unlocked_at' => $isUnlocked ? date('Y-m-d H:i:s') : null,
            'admin_id' => $adminId
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

