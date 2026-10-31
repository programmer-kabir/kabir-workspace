<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");
date_default_timezone_set('Asia/Dhaka');

function sendJson($status, $payload) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function checkAdminRole($role) {
    $r = strtolower(trim((string)$role));
    return ($r === 'admin' || $r === 'developer' || $r === 'manager');
}

// -------------------------------------------------------------
// Auto-Ensure Tables & Categories Exist
// -------------------------------------------------------------
$mysqli->query("
CREATE TABLE IF NOT EXISTS `historical_cash_gaps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL DEFAULT 'অতীত ক্যাশ ঘাটতি সমন্বয়',
  `gap_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `cut_off_date` DATE NOT NULL,
  `cash_id` INT NULL,
  `notes` TEXT NULL,
  `created_by` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cutoff (cut_off_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

$mysqli->query("
CREATE TABLE IF NOT EXISTS `historical_gap_recoveries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `gap_id` INT NULL,
  `recovery_date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `received_from` VARCHAR(255) NOT NULL,
  `cash_id` INT NULL,
  `remarks` TEXT NULL,
  `created_by` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rec_date (recovery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// Ensure Categories Exist in cash_categories
$mysqli->query("
INSERT IGNORE INTO `cash_categories` (`slug`, `name_bn`, `name_en`, `type`, `color_bg`, `color_text`, `color_border`, `icon`, `status`)
VALUES 
('historical_gap_parking', 'অতীত ঘাটতি সমন্বয়', 'Historical Gap Parking', 'out', 'bg-amber-500/15', 'text-amber-400', 'border-amber-500/30', 'FaHistory', 'active'),
('historical_gap_recovery', 'অতীত ঘাটতি আদায়', 'Historical Gap Recovery', 'in', 'bg-emerald-500/15', 'text-emerald-400', 'border-emerald-500/30', 'FaHandHoldingUsd', 'active')
ON DUPLICATE KEY UPDATE `status`='active';
");

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// =========================================================================
// 1. GET: Fetch Summary, All Gaps & All Recoveries
// =========================================================================
if ($method === 'GET') {
    // 1. Total Gaps
    $gapsSumRes = $mysqli->query("SELECT COALESCE(SUM(gap_amount), 0) AS total_gap FROM historical_cash_gaps");
    $totalGap = floatval($gapsSumRes ? ($gapsSumRes->fetch_assoc()['total_gap'] ?? 0) : 0);

    // 2. Total Recoveries
    $recSumRes = $mysqli->query("SELECT COALESCE(SUM(amount), 0) AS total_rec FROM historical_gap_recoveries");
    $totalRecovered = floatval($recSumRes ? ($recSumRes->fetch_assoc()['total_rec'] ?? 0) : 0);

    $remainingGap = max(0, $totalGap - $totalRecovered);
    $recoveryPct = ($totalGap > 0) ? round(($totalRecovered / $totalGap) * 100, 1) : 0;

    // 3. List of Gaps
    $gapsStmt = $mysqli->query("
        SELECT g.id, g.title, g.gap_amount, g.cut_off_date, g.cash_id, g.notes, g.created_at,
               COALESCE(u.name, 'Admin') AS created_by_name
        FROM historical_cash_gaps g
        LEFT JOIN users u ON u.id = g.created_by
        ORDER BY g.cut_off_date DESC, g.id DESC
    ");
    $gaps = $gapsStmt ? $gapsStmt->fetch_all(MYSQLI_ASSOC) : [];

    // 4. List of Recoveries
    $recStmt = $mysqli->query("
        SELECT r.id, r.gap_id, r.recovery_date, r.amount, r.received_from, r.cash_id, r.remarks, r.created_at,
               COALESCE(u.name, 'Admin') AS created_by_name
        FROM historical_gap_recoveries r
        LEFT JOIN users u ON u.id = r.created_by
        ORDER BY r.recovery_date DESC, r.id DESC
    ");
    $recoveries = $recStmt ? $recStmt->fetch_all(MYSQLI_ASSOC) : [];

    sendJson(200, [
        "success" => true,
        "summary" => [
            "total_gap_amount"   => $totalGap,
            "total_recovered"    => $totalRecovered,
            "remaining_gap"      => $remainingGap,
            "recovery_percentage"=> $recoveryPct,
            "gaps_count"         => count($gaps),
            "recoveries_count"   => count($recoveries)
        ],
        "gaps" => $gaps,
        "recoveries" => $recoveries
    ]);
}

// =========================================================================
// 2. POST: Admin-Only Operations (Add Gap, Edit Gap, Delete Gap, Add Recovery, Delete Recovery)
// =========================================================================
if ($method === 'POST') {
    $raw = file_get_contents("php://input");
    $body = json_decode($raw, true) ?? $_POST;

    $userRole = strtolower(trim($body['user_role'] ?? ''));
    if (!checkAdminRole($userRole)) {
        sendJson(403, [
            "success" => false,
            "message" => "অননুমোদিত অ্যাকশন! শুধুমাত্র এডমিন বা ডেভেলপার এই এন্ট্রি দিতে বা পরিবর্তন করতে পারবেন।"
        ]);
    }

    $action = strtolower(trim($body['action'] ?? ''));
    $createdBy = intval($body['created_by'] ?? 290);

    // -------------------------------------------------------------
    // ACTION: ADD GAP (নতুন ক্যাশ ঘাটতি এন্ট্রি ও Cash Out)
    // -------------------------------------------------------------
    if ($action === 'add_gap') {
        $amount = floatval($body['gap_amount'] ?? 0);
        $cutOffDate = trim($body['cut_off_date'] ?? date('Y-m-d'));
        $title = trim($body['title'] ?? 'অতীত ক্যাশ ঘাটতি সমন্বয়');
        $notes = trim($body['notes'] ?? '');

        if ($amount <= 0) {
            sendJson(400, ["success" => false, "message" => "সঠিক টাকার পরিমাণ দিন"]);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $cutOffDate)) {
            $cutOffDate = date('Y-m-d');
        }

        $mysqli->begin_transaction();
        try {
            $refId = 'HGAP-' . time();
            $category = 'historical_gap_parking';
            $source = 'অতীত ক্যাশ ঘাটতি সমন্বয়';

            // 1. Insert into Cash table (Cash Out)
            $cashStmt = $mysqli->prepare("
                INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, approval_status, approved_by, approved_at, createdAt)
                VALUES ('out', ?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW(), NOW())
            ");
            $cashStmt->bind_param("ssdssssi", $source, $title, $amount, $category, $refId, $notes, $cutOffDate, $createdBy);
            $cashStmt->execute();
            $cashId = $cashStmt->insert_id;
            $cashStmt->close();

            // 2. Insert into historical_cash_gaps
            $gapStmt = $mysqli->prepare("
                INSERT INTO historical_cash_gaps (title, gap_amount, cut_off_date, cash_id, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $gapStmt->bind_param("sdsisi", $title, $amount, $cutOffDate, $cashId, $notes, $createdBy);
            $gapStmt->execute();
            $gapStmt->close();

            $mysqli->commit();

            sendJson(200, [
                "success" => true,
                "message" => "৳ " . number_format($amount, 2) . " টাকার নতুন ঘাটতি সফলভাবে এন্ট্রি হয়েছে এবং ক্যাশ থেকে আউট করা হয়েছে 🟢"
            ]);
        } catch (Exception $e) {
            $mysqli->rollback();
            sendJson(500, ["success" => false, "message" => "ত্রুটি: " . $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------
    // ACTION: EDIT GAP (বিদ্যমান ঘাটতি এন্ট্রি সংশোধন)
    // -------------------------------------------------------------
    if ($action === 'edit_gap') {
        $gapId = intval($body['id'] ?? 0);
        $amount = floatval($body['gap_amount'] ?? 0);
        $cutOffDate = trim($body['cut_off_date'] ?? date('Y-m-d'));
        $title = trim($body['title'] ?? 'অতীত ক্যাশ ঘাটতি সমন্বয়');
        $notes = trim($body['notes'] ?? '');

        if ($gapId <= 0 || $amount <= 0) {
            sendJson(400, ["success" => false, "message" => "সঠিক তথ্য ও টাকার পরিমাণ দিন"]);
        }

        // Fetch existing gap
        $fStmt = $mysqli->prepare("SELECT cash_id FROM historical_cash_gaps WHERE id = ?");
        $fStmt->bind_param("i", $gapId);
        $fStmt->execute();
        $exRow = $fStmt->get_result()->fetch_assoc();
        $fStmt->close();

        if (!$exRow) {
            sendJson(404, ["success" => false, "message" => "ঘাটতি রেকর্ড পাওয়া যায়নি"]);
        }

        $cashId = intval($exRow['cash_id'] ?? 0);

        $mysqli->begin_transaction();
        try {
            // Update historical_cash_gaps
            $upGap = $mysqli->prepare("
                UPDATE historical_cash_gaps 
                SET title = ?, gap_amount = ?, cut_off_date = ?, notes = ?
                WHERE id = ?
            ");
            $upGap->bind_param("sdssi", $title, $amount, $cutOffDate, $notes, $gapId);
            $upGap->execute();
            $upGap->close();

            // Update associated cash out if exists
            if ($cashId > 0) {
                $upCash = $mysqli->prepare("
                    UPDATE cash 
                    SET purpose = ?, amount = ?, date = ?, remarks = ?
                    WHERE id = ?
                ");
                $upCash->bind_param("sdssi", $title, $amount, $cutOffDate, $notes, $cashId);
                $upCash->execute();
                $upCash->close();
            }

            $mysqli->commit();

            sendJson(200, [
                "success" => true,
                "message" => "ঘাটতির তথ্য সফলভাবে সংশোধন করা হয়েছে 🟢"
            ]);
        } catch (Exception $e) {
            $mysqli->rollback();
            sendJson(500, ["success" => false, "message" => "ত্রুটি: " . $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------
    // ACTION: DELETE GAP (ঘাটতি এন্ট্রি ও Cash Out মুছে ফেলা)
    // -------------------------------------------------------------
    if ($action === 'delete_gap') {
        $gapId = intval($body['id'] ?? 0);
        if ($gapId <= 0) {
            sendJson(400, ["success" => false, "message" => "সঠিক আইডি দিন"]);
        }

        $fStmt = $mysqli->prepare("SELECT cash_id FROM historical_cash_gaps WHERE id = ?");
        $fStmt->bind_param("i", $gapId);
        $fStmt->execute();
        $exRow = $fStmt->get_result()->fetch_assoc();
        $fStmt->close();

        if (!$exRow) {
            sendJson(404, ["success" => false, "message" => "ঘাটতি রেকর্ড পাওয়া যায়নি"]);
        }

        $cashId = intval($exRow['cash_id'] ?? 0);

        $mysqli->begin_transaction();
        try {
            $delGap = $mysqli->prepare("DELETE FROM historical_cash_gaps WHERE id = ?");
            $delGap->bind_param("i", $gapId);
            $delGap->execute();
            $delGap->close();

            if ($cashId > 0) {
                $delCash = $mysqli->prepare("DELETE FROM cash WHERE id = ?");
                $delCash->bind_param("i", $cashId);
                $delCash->execute();
                $delCash->close();
            }

            $mysqli->commit();
            sendJson(200, ["success" => true, "message" => "ঘাটতি এন্ট্রি ও ক্যাশ আউট সফলভাবে মুছে ফেলা হয়েছে"]);
        } catch (Exception $e) {
            $mysqli->rollback();
            sendJson(500, ["success" => false, "message" => "ত্রুটি: " . $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------
    // ACTION: ADD RECOVERY (ঘাটতি আদায় এন্ট্রি ও Cash In)
    // -------------------------------------------------------------
    if ($action === 'add_recovery') {
        $amount = floatval($body['amount'] ?? 0);
        $recoveryDate = trim($body['recovery_date'] ?? date('Y-m-d'));
        $receivedFrom = trim($body['received_from'] ?? '');
        $remarks = trim($body['remarks'] ?? '');
        $gapId = !empty($body['gap_id']) ? intval($body['gap_id']) : null;

        if ($amount <= 0) {
            sendJson(400, ["success" => false, "message" => "সঠিক টাকার পরিমাণ দিন"]);
        }
        if (empty($receivedFrom)) {
            sendJson(400, ["success" => false, "message" => "কার কাছ থেকে টাকা আদায় হলো তা উল্লেখ করা আবশ্যক"]);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $recoveryDate)) {
            $recoveryDate = date('Y-m-d');
        }

        // Check total gap & total recovered
        $gSum = floatval($mysqli->query("SELECT COALESCE(SUM(gap_amount), 0) AS total_gap FROM historical_cash_gaps")->fetch_assoc()['total_gap'] ?? 0);
        $rSum = floatval($mysqli->query("SELECT COALESCE(SUM(amount), 0) AS total_rec FROM historical_gap_recoveries")->fetch_assoc()['total_rec'] ?? 0);
        $remaining = max(0, $gSum - $rSum);

        if ($amount > $remaining && $remaining > 0) {
            sendJson(400, [
                "success" => false,
                "message" => "আদায়ের পরিমাণ মোট অবশিষ্ট ঘাটতির (৳ " . number_format($remaining, 2) . ") চেয়ে বেশি হতে পারবে না"
            ]);
        }

        $mysqli->begin_transaction();
        try {
            $refId = 'HGAP-REC-' . time();
            $purpose = "অতীতের ক্যাশ ঘাটতি আদায় (Historical Gap Recovery)";
            $category = "historical_gap_recovery";

            // 1. Insert into Cash table (Cash In)
            $cashStmt = $mysqli->prepare("
                INSERT INTO cash (type, source, purpose, amount, category, refId, remarks, date, approval_status, approved_by, approved_at, createdAt)
                VALUES ('in', ?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW(), NOW())
            ");
            $cashStmt->bind_param("ssdssssi", $receivedFrom, $purpose, $amount, $category, $refId, $remarks, $recoveryDate, $createdBy);
            $cashStmt->execute();
            $cashId = $cashStmt->insert_id;
            $cashStmt->close();

            // 2. Insert into historical_gap_recoveries
            $recStmt = $mysqli->prepare("
                INSERT INTO historical_gap_recoveries (gap_id, recovery_date, amount, received_from, cash_id, remarks, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $recStmt->bind_param("isdsisi", $gapId, $recoveryDate, $amount, $receivedFrom, $cashId, $remarks, $createdBy);
            $recStmt->execute();
            $recStmt->close();

            $mysqli->commit();

            sendJson(200, [
                "success" => true,
                "message" => "৳ " . number_format($amount, 2) . " টাকা সফলভাবে আদায় হিসেবে জমা হয়েছে এবং বর্তমান ক্যাশ ইনে যোগ হয়েছে 🎉"
            ]);
        } catch (Exception $e) {
            $mysqli->rollback();
            sendJson(500, ["success" => false, "message" => "ত্রুটি: " . $e->getMessage()]);
        }
    }

    // -------------------------------------------------------------
    // ACTION: DELETE RECOVERY (আদায় এন্ট্রি ও Cash In মুছে ফেলা)
    // -------------------------------------------------------------
    if ($action === 'delete_recovery') {
        $recId = intval($body['id'] ?? 0);
        if ($recId <= 0) {
            sendJson(400, ["success" => false, "message" => "সঠিক আইডি দিন"]);
        }

        $fStmt = $mysqli->prepare("SELECT cash_id FROM historical_gap_recoveries WHERE id = ?");
        $fStmt->bind_param("i", $recId);
        $fStmt->execute();
        $exRow = $fStmt->get_result()->fetch_assoc();
        $fStmt->close();

        if (!$exRow) {
            sendJson(404, ["success" => false, "message" => "আদায় রেকর্ড পাওয়া যায়নি"]);
        }

        $cashId = intval($exRow['cash_id'] ?? 0);

        $mysqli->begin_transaction();
        try {
            $delRec = $mysqli->prepare("DELETE FROM historical_gap_recoveries WHERE id = ?");
            $delRec->bind_param("i", $recId);
            $delRec->execute();
            $delRec->close();

            if ($cashId > 0) {
                $delCash = $mysqli->prepare("DELETE FROM cash WHERE id = ?");
                $delCash->bind_param("i", $cashId);
                $delCash->execute();
                $delCash->close();
            }

            $mysqli->commit();
            sendJson(200, ["success" => true, "message" => "আদায় এন্ট্রি ও ক্যাশ ইন সফলভাবে মুছে ফেলা হয়েছে"]);
        } catch (Exception $e) {
            $mysqli->rollback();
            sendJson(500, ["success" => false, "message" => "ত্রুটি: " . $e->getMessage()]);
        }
    }

    sendJson(400, ["success" => false, "message" => "অজানা অ্যাকশন"]);
}

