<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/PusherHelper.php';
require_once __DIR__ . '/BreakDbHelper.php';
require_once __DIR__ . '/../developer/developer_guard.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

// 1. Authenticate Developer or Admin Access
$token = null;
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}
if (!$token && isset($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
    $token = $matches[1];
}
if (!$token && isset($_GET['token'])) {
    $token = trim($_GET['token']);
}

$payload = json_decode(file_get_contents("php://input"), true) ?: [];
if (!$token && isset($payload['token'])) {
    $token = trim($payload['token']);
}

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode([
        "status" => "error",
        "message" => "Forbidden: Administrator or Developer privileges required."
    ]);
    exit;
}

$action = isset($_GET['action']) ? trim($_GET['action']) : ($payload['action'] ?? 'get_overview');

try {
    switch ($action) {
        case 'get_overview':
            // Fetch all active employees
            $empStmt = $db->query("
                SELECT 
                    u.id as user_id,
                    u.name,
                    u.email,
                    u.profile_picture,
                    e.employee_code,
                    COALESCE(e.designation, 'Staff Member') as designation,
                    COALESCE(e.shift_hours, 8) as shift_hours,
                    COALESCE(e.shift_start, '09:00:00') as shift_start,
                    COALESCE(e.shift_end, '17:00:00') as shift_end,
                    COALESCE(d.name, 'General') as department_name
                FROM users u
                INNER JOIN employees e ON u.id = e.user_id
                LEFT JOIN departments d ON e.department_id = d.id
                WHERE u.status = 'active'
                ORDER BY u.name ASC
            ");
            $employees = $empStmt->fetchAll(PDO::FETCH_ASSOC);

            $staffData = [];
            $totalAcademyMangoes = 0;
            $totalVaultHeldMangoes = 0;
            $totalVisibleMangoes = 0;
            $staffWithVaultHoldsCount = 0;
            $staffInDebtCount = 0;
            $totalDebtHours = 0.0;

            foreach ($employees as $emp) {
                $uid = (int)$emp['user_id'];
                $shiftHours = (float)$emp['shift_hours'];
                if ($shiftHours <= 0) $shiftHours = 8.0;
                $shiftMins = max(60, (int)round($shiftHours * 60));

                $rawEarnedMins = BreakDbHelper::getTotalEarnedMangoMinutes($db, $uid);
                $vaultSummary = BreakDbHelper::getVaultSummary($db, $uid, $shiftHours);
                $visibleMins = BreakDbHelper::getAvailableMangoMinutes($db, $uid);

                $hasDebt = ($rawEarnedMins < 0);
                $debtMinutes = $hasDebt ? abs($rawEarnedMins) : 0;
                $debtHours = round($debtMinutes / 60.0, 1);
                $debtH = floor($debtMinutes / 60);
                $debtM = $debtMinutes % 60;
                $debtFormatted = $hasDebt ? ($debtH > 0 ? "{$debtH}h {$debtM}m" : "{$debtM}m") : null;

                $totalEarnedMangoes = $hasDebt ? 0 : (int)floor($rawEarnedMins / $shiftMins);
                $vaultHeldMangoes = (int)$vaultSummary['held_mangoes'];
                $visibleMangoes = (int)floor($visibleMins / $shiftMins);

                $totalAcademyMangoes += $totalEarnedMangoes;
                $totalVaultHeldMangoes += $vaultHeldMangoes;
                $totalVisibleMangoes += $visibleMangoes;
                if ($vaultHeldMangoes > 0) {
                    $staffWithVaultHoldsCount++;
                }
                if ($hasDebt) {
                    $staffInDebtCount++;
                    $totalDebtHours += $debtHours;
                }

                $staffData[] = [
                    'user_id' => $uid,
                    'name' => $emp['name'],
                    'email' => $emp['email'],
                    'avatar' => $emp['profile_picture'],
                    'employee_code' => $emp['employee_code'],
                    'designation' => $emp['designation'],
                    'department' => $emp['department_name'],
                    'shift_hours' => $shiftHours,
                    'shift_start' => $emp['shift_start'],
                    'shift_end' => $emp['shift_end'],
                    'has_debt' => $hasDebt,
                    'debt_minutes' => $debtMinutes,
                    'debt_hours' => $debtHours,
                    'debt_formatted' => $debtFormatted,
                    'net_balance_hours' => round($rawEarnedMins / 60.0, 1),
                    'net_balance_minutes' => $rawEarnedMins,
                    'total_earned_mangoes' => $totalEarnedMangoes,
                    'total_earned_minutes' => $rawEarnedMins,
                    'total_earned_hours' => round($rawEarnedMins / 60, 1),
                    'vault_held_mangoes' => $vaultHeldMangoes,
                    'vault_held_minutes' => (int)$vaultSummary['held_minutes'],
                    'vault_held_hours' => round($vaultSummary['held_minutes'] / 60, 1),
                    'visible_mangoes' => $visibleMangoes,
                    'visible_minutes' => $visibleMins,
                    'visible_hours' => round($visibleMins / 60, 1),
                    'transferred_out_mangoes' => (int)$vaultSummary['transferred_out_mangoes'],
                    'transferred_in_mangoes' => (int)$vaultSummary['transferred_in_mangoes'],
                    'is_special_shift' => ($shiftHours == 6.0)
                ];
            }

            // Fetch recent 50 audit logs
            $logStmt = $db->query("
                SELECT 
                    l.id,
                    l.user_id,
                    l.action_type,
                    l.mango_count,
                    l.minutes_amount,
                    l.from_source,
                    l.note,
                    l.created_at,
                    u.name as staff_name,
                    p.name as performed_by_name,
                    s.name as source_name,
                    t.name as target_name
                FROM mango_vault_ledger l
                LEFT JOIN users u ON l.user_id = u.id
                LEFT JOIN users p ON l.performed_by = p.id
                LEFT JOIN users s ON l.source_user_id = s.id
                LEFT JOIN users t ON l.target_user_id = t.id
                ORDER BY l.id DESC
                LIMIT 50
            ");
            $logs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "data" => [
                    "stats" => [
                        "total_academy_mangoes" => $totalAcademyMangoes,
                        "total_vault_held_mangoes" => $totalVaultHeldMangoes,
                        "total_visible_mangoes" => $totalVisibleMangoes,
                        "total_staff_count" => count($employees),
                        "staff_with_vault_holds_count" => $staffWithVaultHoldsCount,
                        "staff_in_debt_count" => $staffInDebtCount,
                        "total_debt_hours" => round($totalDebtHours, 1)
                    ],
                    "staff" => $staffData,
                    "logs" => $logs,
                    "current_user" => [
                        "id" => $devUser['id'],
                        "name" => $devUser['name'],
                        "roles" => $devUser['roles']
                    ]
                ]
            ]);
            break;

        case 'hold':
            $targetUserId = (int)($payload['user_id'] ?? 0);
            $mangoCount = (int)($payload['mango_count'] ?? 0);
            $note = trim($payload['note'] ?? 'Reserved in Admin Vault to regulate break consumption.');

            if (!$targetUserId || $mangoCount <= 0) {
                echo json_encode(["status" => "error", "message" => "Valid user_id and mango_count (> 0) required."]);
                exit;
            }

            $uStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours, u.name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :uid LIMIT 1");
            $uStmt->execute([':uid' => $targetUserId]);
            $targetUser = $uStmt->fetch(PDO::FETCH_ASSOC);
            if (!$targetUser) {
                echo json_encode(["status" => "error", "message" => "Target staff not found."]);
                exit;
            }

            $shiftHours = (float)$targetUser['shift_hours'];
            if ($shiftHours <= 0) $shiftHours = 8.0;
            $shiftMins = (int)round($shiftHours * 60);

            // Verify staff has at least that many currently visible mangoes
            $visibleMins = BreakDbHelper::getAvailableMangoMinutes($db, $targetUserId);
            $availableMangoes = (int)floor($visibleMins / $shiftMins);

            if ($mangoCount > $availableMangoes) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Cannot hold {$mangoCount} mangoes. Staff currently only has {$availableMangoes} visible mango(es) on tree."
                ]);
                exit;
            }

            $minutesAmount = $mangoCount * $shiftMins;
            $insStmt = $db->prepare("
                INSERT INTO mango_vault_ledger 
                (user_id, action_type, mango_count, minutes_amount, note, performed_by) 
                VALUES (:uid, 'hold', :cnt, :mins, :note, :perf)
            ");
            $insStmt->execute([
                ':uid' => $targetUserId,
                ':cnt' => $mangoCount,
                ':mins' => $minutesAmount,
                ':note' => $note,
                ':perf' => $devUser['id']
            ]);

            // Pusher Realtime Ping
            try {
                PusherHelper::trigger("user-{$targetUserId}", 'mango-vault-updated', [
                    'message' => 'Mango bank updated.'
                ]);
            } catch (Throwable $pe) {}

            echo json_encode([
                "status" => "success",
                "message" => "Successfully reserved {$mangoCount} mango(es) ({$minutesAmount} mins) into Admin Vault for {$targetUser['name']}."
            ]);
            break;

        case 'release':
            $targetUserId = (int)($payload['user_id'] ?? 0);
            $mangoCount = (int)($payload['mango_count'] ?? 0);
            $note = trim($payload['note'] ?? 'Released from Admin Vault to staff tree for emergency / approved break.');

            if (!$targetUserId || $mangoCount <= 0) {
                echo json_encode(["status" => "error", "message" => "Valid user_id and mango_count (> 0) required."]);
                exit;
            }

            $uStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours, u.name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :uid LIMIT 1");
            $uStmt->execute([':uid' => $targetUserId]);
            $targetUser = $uStmt->fetch(PDO::FETCH_ASSOC);
            if (!$targetUser) {
                echo json_encode(["status" => "error", "message" => "Target staff not found."]);
                exit;
            }

            $shiftHours = (float)$targetUser['shift_hours'];
            if ($shiftHours <= 0) $shiftHours = 8.0;
            $shiftMins = (int)round($shiftHours * 60);

            // Verify staff has at least that many currently held in vault
            $vaultSummary = BreakDbHelper::getVaultSummary($db, $targetUserId, $shiftHours);
            $heldMangoes = (int)$vaultSummary['held_mangoes'];

            if ($mangoCount > $heldMangoes) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Cannot release {$mangoCount} mangoes. Currently only {$heldMangoes} mango(es) held in Admin Vault for this staff."
                ]);
                exit;
            }

            $minutesAmount = $mangoCount * $shiftMins;
            $insStmt = $db->prepare("
                INSERT INTO mango_vault_ledger 
                (user_id, action_type, mango_count, minutes_amount, note, performed_by) 
                VALUES (:uid, 'release', :cnt, :mins, :note, :perf)
            ");
            $insStmt->execute([
                ':uid' => $targetUserId,
                ':cnt' => $mangoCount,
                ':mins' => $minutesAmount,
                ':note' => $note,
                ':perf' => $devUser['id']
            ]);

            // Pusher Realtime Ping
            try {
                PusherHelper::trigger("user-{$targetUserId}", 'mango-vault-updated', [
                    'message' => 'Mango bank updated.'
                ]);
            } catch (Throwable $pe) {}

            echo json_encode([
                "status" => "success",
                "message" => "Successfully released {$mangoCount} mango(es) ({$minutesAmount} mins) back to {$targetUser['name']}'s tree."
            ]);
            break;

        case 'transfer':
            $sourceUserId = (int)($payload['source_user_id'] ?? 0);
            $targetUserId = (int)($payload['target_user_id'] ?? 0);
            $mangoCount = (int)($payload['mango_count'] ?? 0);
            $fromSource = trim($payload['from_source'] ?? 'vault'); // 'vault' or 'tree'
            $note = trim($payload['note'] ?? 'Administrative Mango Transfer.');

            if (!$sourceUserId || !$targetUserId || $mangoCount <= 0) {
                echo json_encode(["status" => "error", "message" => "Valid source_user_id, target_user_id and mango_count required."]);
                exit;
            }

            if ($sourceUserId === $targetUserId) {
                echo json_encode(["status" => "error", "message" => "Source and Target cannot be the same user."]);
                exit;
            }

            // Fetch source and target info
            $sStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours, u.name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :uid LIMIT 1");
            $sStmt->execute([':uid' => $sourceUserId]);
            $sourceUser = $sStmt->fetch(PDO::FETCH_ASSOC);

            $tStmt = $db->prepare("SELECT COALESCE(e.shift_hours, 8) as shift_hours, u.name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = :uid LIMIT 1");
            $tStmt->execute([':uid' => $targetUserId]);
            $targetUser = $tStmt->fetch(PDO::FETCH_ASSOC);

            if (!$sourceUser || !$targetUser) {
                echo json_encode(["status" => "error", "message" => "Source or Target user not found."]);
                exit;
            }

            $sourceShiftHours = (float)$sourceUser['shift_hours'] ?: 8.0;
            $targetShiftHours = (float)$targetUser['shift_hours'] ?: 8.0;
            $sourceShiftMins = (int)round($sourceShiftHours * 60);
            $targetShiftMins = (int)round($targetShiftHours * 60);

            // Check sender availability
            if ($fromSource === 'vault') {
                $vaultSummary = BreakDbHelper::getVaultSummary($db, $sourceUserId, $sourceShiftHours);
                if ($mangoCount > (int)$vaultSummary['held_mangoes']) {
                    echo json_encode([
                        "status" => "error",
                        "message" => "Source only has {$vaultSummary['held_mangoes']} mango(es) held in vault."
                    ]);
                    exit;
                }
            } else {
                $visibleMins = BreakDbHelper::getAvailableMangoMinutes($db, $sourceUserId);
                $availableMangoes = (int)floor($visibleMins / $sourceShiftMins);
                if ($mangoCount > $availableMangoes) {
                    echo json_encode([
                        "status" => "error",
                        "message" => "Source only has {$availableMangoes} visible mango(es) on tree."
                    ]);
                    exit;
                }
            }

            $sourceMinutesAmount = $mangoCount * $sourceShiftMins;
            $targetMinutesAmount = $mangoCount * $targetShiftMins;

            // 1. Record transfer_out for sender
            $outStmt = $db->prepare("
                INSERT INTO mango_vault_ledger 
                (user_id, action_type, mango_count, minutes_amount, target_user_id, from_source, note, performed_by) 
                VALUES (:uid, 'transfer_out', :cnt, :mins, :tgt, :src, :note, :perf)
            ");
            $outStmt->execute([
                ':uid' => $sourceUserId,
                ':cnt' => $mangoCount,
                ':mins' => $sourceMinutesAmount,
                ':tgt' => $targetUserId,
                ':src' => $fromSource,
                ':note' => "Transferred {$mangoCount} mango(es) to {$targetUser['name']}. Note: {$note}",
                ':perf' => $devUser['id']
            ]);

            // 2. Record transfer_in for recipient
            $inStmt = $db->prepare("
                INSERT INTO mango_vault_ledger 
                (user_id, action_type, mango_count, minutes_amount, source_user_id, from_source, note, performed_by) 
                VALUES (:uid, 'transfer_in', :cnt, :mins, :src_uid, 'tree', :note, :perf)
            ");
            $inStmt->execute([
                ':uid' => $targetUserId,
                ':cnt' => $mangoCount,
                ':mins' => $targetMinutesAmount,
                ':src_uid' => $sourceUserId,
                ':note' => "Received {$mangoCount} mango(es) from {$sourceUser['name']}. Note: {$note}",
                ':perf' => $devUser['id']
            ]);

            // Pusher notifications
            try {
                PusherHelper::trigger("user-{$sourceUserId}", 'mango-vault-updated', ['message' => 'Mango bank updated.']);
                PusherHelper::trigger("user-{$targetUserId}", 'mango-vault-updated', ['message' => 'Mango bank updated.']);
            } catch (Throwable $pe) {}

            echo json_encode([
                "status" => "success",
                "message" => "Successfully transferred {$mangoCount} mango(es) from {$sourceUser['name']} to {$targetUser['name']}."
            ]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Unknown action: {$action}"]);
            break;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
