<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth_guard.php';

// Allow admin, developer, manager, staff, audit roles
guardAdminOnly();

header("Content-Type: application/json; charset=UTF-8");

$user = getAuthenticatedUser();
$userId = $user['id'] ?? null;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    handleGet($mysqli);
} elseif ($method === 'POST') {
    handlePost($mysqli, $userId);
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

// =========================================================================
// GET: Fetch reconciliation data & summary statistics
// =========================================================================
function handleGet($mysqli) {
    $cardId = isset($_GET['card_id']) ? intval($_GET['card_id']) : 0;
    $customerId = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : 0;
    $statusFilter = $_GET['status'] ?? 'all'; // all, unverified, matched, in_khata_not_app, in_app_not_khata, amount_mismatch, discrepancies
    $search = trim($_GET['search'] ?? '');
    $limit = isset($_GET['limit']) ? max(1, min(500, intval($_GET['limit']))) : 150;
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $offset = ($page - 1) * $limit;

    // Build conditions
    $where = ["1=1"];
    $types = "";
    $params = [];

    if ($cardId > 0) {
        $where[] = "ic.id = ?";
        $types .= "i";
        $params[] = $cardId;
    }

    if ($customerId > 0) {
        $where[] = "ic.user_id = ?";
        $types .= "i";
        $params[] = $customerId;
    }

    if (!empty($search)) {
        $where[] = "(u.name LIKE ? OR u.mobile LIKE ? OR ic.id = ? OR ic.card_number = ? OR ic.product_name LIKE ?)";
        $searchTerm = "%" . $search . "%";
        $searchNum = intval($search);
        $types .= "ssiis";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchNum;
        $params[] = $searchNum;
        $params[] = $searchTerm;
    }

    if ($statusFilter === 'matched') {
        $where[] = "ar.status = 'matched'";
    } elseif ($statusFilter === 'in_khata_not_app') {
        $where[] = "ar.status = 'in_khata_not_app'";
    } elseif ($statusFilter === 'in_app_not_khata') {
        $where[] = "ar.status = 'in_app_not_khata'";
    } elseif ($statusFilter === 'amount_mismatch') {
        $where[] = "ar.status = 'amount_mismatch'";
    } elseif ($statusFilter === 'discrepancies') {
        $where[] = "ar.status IN ('in_khata_not_app', 'in_app_not_khata', 'amount_mismatch')";
    } elseif ($statusFilter === 'unverified') {
        $where[] = "(ar.status IS NULL OR ar.status = 'unverified')";
    }

    $whereClause = implode(" AND ", $where);

    // Main Query: Installments + Cards + Customer + Audit Record
    $sql = "
        SELECT 
            ip.id AS payment_id,
            ic.id AS card_id,
            ic.card_number,
            ic.user_id AS customer_id,
            u.name AS customer_name,
            u.mobile AS customer_mobile,
            u.address AS customer_address,
            ic.product_name,
            ic.total_due_amount,
            ic.installment_count,
            ic.per_installment_amount,
            ip.installment_no,
            ip.due_amount,
            ip.principal_amount,
            ip.profit_amount,
            ip.due_date,
            ip.paid_date,
            ip.status AS payment_status,
            ar.id AS audit_id,
            COALESCE(ar.status, 'unverified') AS audit_status,
            COALESCE(ar.khata_amount, ip.due_amount, 0.00) AS khata_amount,
            COALESCE(ar.expected_amount, ip.due_amount, 0.00) AS expected_amount,
            ar.note AS audit_note,
            ar.audited_at,
            auditor.name AS audited_by_name
        FROM installment_cards ic
        LEFT JOIN installment_payments ip ON ip.card_id = ic.id
        LEFT JOIN users u ON u.id = ic.user_id
        LEFT JOIN customer_khata_audit_records ar ON (ar.card_id = ic.id AND ar.installment_no = ip.installment_no)
        LEFT JOIN users auditor ON auditor.id = ar.audited_by
        WHERE {$whereClause}
        ORDER BY ic.id DESC, ip.installment_no ASC
        LIMIT ? OFFSET ?
    ";

    $typesWithPaging = $types . "ii";
    $paramsWithPaging = array_merge($params, [$limit, $offset]);

    $stmt = $mysqli->prepare($sql);
    if (!empty($typesWithPaging)) {
        $stmt->bind_param($typesWithPaging, ...$paramsWithPaging);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    while ($row = $result->fetch_assoc()) {
        $row['payment_id'] = $row['payment_id'] ? intval($row['payment_id']) : null;
        $row['card_id'] = intval($row['card_id']);
        $row['customer_id'] = intval($row['customer_id']);
        $row['installment_no'] = intval($row['installment_no']);
        $row['due_amount'] = floatval($row['due_amount'] ?? 0);
        $row['khata_amount'] = floatval($row['khata_amount'] ?? 0);
        $row['expected_amount'] = floatval($row['expected_amount'] ?? 0);
        $row['audit_id'] = $row['audit_id'] ? intval($row['audit_id']) : null;
        $items[] = $row;
    }
    $stmt->close();

    // Summary Totals Query
    $summarySql = "
        SELECT
            COUNT(*) AS total_rows,
            SUM(CASE WHEN ar.status IS NOT NULL AND ar.status != 'unverified' THEN 1 ELSE 0 END) AS total_audited,
            SUM(CASE WHEN ar.status = 'matched' THEN 1 ELSE 0 END) AS matched_count,
            SUM(CASE WHEN ar.status = 'matched' THEN COALESCE(ar.khata_amount, ip.due_amount, 0) ELSE 0 END) AS matched_amount,
            SUM(CASE WHEN ar.status = 'in_khata_not_app' THEN 1 ELSE 0 END) AS in_khata_not_app_count,
            SUM(CASE WHEN ar.status = 'in_khata_not_app' THEN COALESCE(ar.khata_amount, 0) ELSE 0 END) AS in_khata_not_app_amount,
            SUM(CASE WHEN ar.status = 'in_app_not_khata' THEN 1 ELSE 0 END) AS in_app_not_khata_count,
            SUM(CASE WHEN ar.status = 'in_app_not_khata' THEN COALESCE(ar.expected_amount, ip.due_amount, 0) ELSE 0 END) AS in_app_not_khata_amount,
            SUM(CASE WHEN ar.status = 'amount_mismatch' THEN 1 ELSE 0 END) AS amount_mismatch_count,
            SUM(CASE WHEN ar.status = 'amount_mismatch' THEN ABS(COALESCE(ar.expected_amount, ip.due_amount, 0) - COALESCE(ar.khata_amount, 0)) ELSE 0 END) AS amount_mismatch_diff
        FROM installment_cards ic
        LEFT JOIN installment_payments ip ON ip.card_id = ic.id
        LEFT JOIN users u ON u.id = ic.user_id
        LEFT JOIN customer_khata_audit_records ar ON (ar.card_id = ic.id AND ar.installment_no = ip.installment_no)
        WHERE 1=1
    ";

    $summaryResult = $mysqli->query($summarySql);
    $summary = $summaryResult ? $summaryResult->fetch_assoc() : [];

    $totalGapAmount = floatval($summary['in_khata_not_app_amount'] ?? 0) 
                    + floatval($summary['in_app_not_khata_amount'] ?? 0) 
                    + floatval($summary['amount_mismatch_diff'] ?? 0);

    echo json_encode([
        "success" => true,
        "data" => $items,
        "page" => $page,
        "limit" => $limit,
        "summary" => [
            "total_installments" => intval($summary['total_rows'] ?? 0),
            "total_audited" => intval($summary['total_audited'] ?? 0),
            "matched_count" => intval($summary['matched_count'] ?? 0),
            "matched_amount" => floatval($summary['matched_amount'] ?? 0),
            "in_khata_not_app_count" => intval($summary['in_khata_not_app_count'] ?? 0),
            "in_khata_not_app_amount" => floatval($summary['in_khata_not_app_amount'] ?? 0),
            "in_app_not_khata_count" => intval($summary['in_app_not_khata_count'] ?? 0),
            "in_app_not_khata_amount" => floatval($summary['in_app_not_khata_amount'] ?? 0),
            "amount_mismatch_count" => intval($summary['amount_mismatch_count'] ?? 0),
            "amount_mismatch_diff" => floatval($summary['amount_mismatch_diff'] ?? 0),
            "total_gap_amount" => $totalGapAmount
        ]
    ], JSON_UNESCAPED_UNICODE);
}

// =========================================================================
// POST: Save audit status, bulk audit, add missing to app, or reset
// =========================================================================
function handlePost($mysqli, $userId) {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $input['action'] ?? 'save_single';

    if ($action === 'save_single') {
        saveSingleAudit($mysqli, $input, $userId);
    } elseif ($action === 'bulk_save') {
        saveBulkAudit($mysqli, $input, $userId);
    } elseif ($action === 'add_missing_to_app') {
        addMissingInstallmentToApp($mysqli, $input, $userId);
    } elseif ($action === 'reset') {
        resetAudit($mysqli, $input);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Unknown action: {$action}"]);
    }
}

function saveSingleAudit($mysqli, $input, $userId) {
    $cardId = intval($input['card_id'] ?? 0);
    $installmentNo = intval($input['installment_no'] ?? 0);
    $status = $input['status'] ?? 'unverified';
    $khataAmount = floatval($input['khata_amount'] ?? 0);
    $expectedAmount = floatval($input['expected_amount'] ?? 0);
    $customerId = intval($input['customer_id'] ?? 0);
    $paymentId = !empty($input['payment_id']) ? intval($input['payment_id']) : null;
    $note = trim($input['note'] ?? '');

    if ($cardId <= 0) {
        echo json_encode(["success" => false, "message" => "Valid Card ID required"]);
        return;
    }

    $stmt = $mysqli->prepare("
        INSERT INTO customer_khata_audit_records (
            card_id, customer_id, installment_no, installment_payment_id,
            expected_amount, khata_amount, status, note, audited_by, audited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            expected_amount = VALUES(expected_amount),
            khata_amount = VALUES(khata_amount),
            status = VALUES(status),
            note = VALUES(note),
            audited_by = VALUES(audited_by),
            audited_at = NOW()
    ");

    $stmt->bind_param(
        "iiiiddssi",
        $cardId,
        $customerId,
        $installmentNo,
        $paymentId,
        $expectedAmount,
        $khataAmount,
        $status,
        $note,
        $userId
    );

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "অডিট স্ট্যাটাস সফলভাবে সেভ করা হয়েছে ✅",
            "card_id" => $cardId,
            "installment_no" => $installmentNo,
            "status" => $status
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["success" => false, "error" => $stmt->error]);
    }
    $stmt->close();
}

function saveBulkAudit($mysqli, $input, $userId) {
    $records = $input['records'] ?? [];
    if (!is_array($records) || empty($records)) {
        echo json_encode(["success" => false, "message" => "No records to save"]);
        return;
    }

    $stmt = $mysqli->prepare("
        INSERT INTO customer_khata_audit_records (
            card_id, customer_id, installment_no, installment_payment_id,
            expected_amount, khata_amount, status, note, audited_by, audited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            expected_amount = VALUES(expected_amount),
            khata_amount = VALUES(khata_amount),
            status = VALUES(status),
            note = VALUES(note),
            audited_by = VALUES(audited_by),
            audited_at = NOW()
    ");

    $saved = 0;
    foreach ($records as $r) {
        $cardId = intval($r['card_id'] ?? 0);
        $installmentNo = intval($r['installment_no'] ?? 0);
        $status = $r['status'] ?? 'unverified';
        $khataAmount = floatval($r['khata_amount'] ?? 0);
        $expectedAmount = floatval($r['expected_amount'] ?? 0);
        $customerId = intval($r['customer_id'] ?? 0);
        $paymentId = !empty($r['payment_id']) ? intval($r['payment_id']) : null;
        $note = trim($r['note'] ?? '');

        if ($cardId > 0) {
            $stmt->bind_param(
                "iiiiddssi",
                $cardId,
                $customerId,
                $installmentNo,
                $paymentId,
                $expectedAmount,
                $khataAmount,
                $status,
                $note,
                $userId
            );
            if ($stmt->execute()) {
                $saved++;
            }
        }
    }
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "মোট {$saved} টি অডিট রেকর্ড সেভ করা হয়েছে ✅",
        "saved_count" => $saved
    ], JSON_UNESCAPED_UNICODE);
}

function addMissingInstallmentToApp($mysqli, $input, $userId) {
    $cardId = intval($input['card_id'] ?? 0);
    $installmentNo = intval($input['installment_no'] ?? 0);
    $amount = floatval($input['amount'] ?? 0);
    $paidDate = !empty($input['paid_date']) ? $input['paid_date'] : date('Y-m-d');
    $note = trim($input['note'] ?? 'Added from physical khata reconciliation audit');

    if ($cardId <= 0 || $installmentNo < 0 || $amount <= 0) {
        echo json_encode(["success" => false, "message" => "সঠিক কার্ড আইডি, কিস্তি নম্বর ও টাকার পরিমাণ দিন।"]);
        return;
    }

    // Check if card exists
    $cardCheck = $mysqli->prepare("SELECT user_id, per_installment_amount FROM installment_cards WHERE id = ?");
    $cardCheck->bind_param("i", $cardId);
    $cardCheck->execute();
    $card = $cardCheck->get_result()->fetch_assoc();
    $cardCheck->close();

    if (!$card) {
        echo json_encode(["success" => false, "message" => "কার্ডটি সিস্টেমে পাওয়া যায়নি।"]);
        return;
    }

    $customerId = intval($card['user_id'] ?? 0);

    // Insert into installment_payments
    $ins = $mysqli->prepare("
        INSERT INTO installment_payments (
            card_id, installment_no, due_amount, principal_amount, profit_amount,
            paid_date, status, payment_method, collected_by, created_at
        ) VALUES (?, ?, ?, ?, 0, ?, 'Paid', 'Cash', ?, NOW())
    ");
    $ins->bind_param("iiddsi", $cardId, $installmentNo, $amount, $amount, $paidDate, $userId);
    
    if ($ins->execute()) {
        $newPaymentId = $ins->insert_id;
        $ins->close();

        // Update audit record to 'matched'
        $auditUpdate = $mysqli->prepare("
            INSERT INTO customer_khata_audit_records (
                card_id, customer_id, installment_no, installment_payment_id,
                expected_amount, khata_amount, status, note, audited_by, audited_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'matched', ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                installment_payment_id = VALUES(installment_payment_id),
                expected_amount = VALUES(expected_amount),
                khata_amount = VALUES(khata_amount),
                status = 'matched',
                note = VALUES(note),
                audited_by = VALUES(audited_by),
                audited_at = NOW()
        ");
        $auditUpdate->bind_param("iiiiddsi", $cardId, $customerId, $installmentNo, $newPaymentId, $amount, $amount, $note, $userId);
        $auditUpdate->execute();
        $auditUpdate->close();

        echo json_encode([
            "success" => true,
            "message" => "মিসিং কিস্তিটি সফলভাবে অ্যাপসে যুক্ত ও 'মিল আছে' হিসেবে চিহ্নিত করা হয়েছে ✅",
            "new_payment_id" => $newPaymentId
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["success" => false, "error" => $ins->error]);
    }
}

function resetAudit($mysqli, $input) {
    $cardId = intval($input['card_id'] ?? 0);
    $installmentNo = isset($input['installment_no']) ? intval($input['installment_no']) : null;

    if ($cardId > 0 && $installmentNo !== null) {
        $stmt = $mysqli->prepare("DELETE FROM customer_khata_audit_records WHERE card_id = ? AND installment_no = ?");
        $stmt->bind_param("ii", $cardId, $installmentNo);
    } elseif ($cardId > 0) {
        $stmt = $mysqli->prepare("DELETE FROM customer_khata_audit_records WHERE card_id = ?");
        $stmt->bind_param("i", $cardId);
    } else {
        echo json_encode(["success" => false, "message" => "Card ID required to reset."]);
        return;
    }

    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "অডিট রেকর্ড সফলভাবে রিসেট করা হয়েছে 🔄"]);
}
