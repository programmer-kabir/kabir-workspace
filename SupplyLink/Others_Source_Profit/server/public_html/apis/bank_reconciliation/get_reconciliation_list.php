<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

// Helper: Banking Deadline calculation
// Thursday collections (date = Thu) -> Saturday 12:00 PM
// Friday collections -> Saturday 12:00 PM
// All other days -> Next day 12:00 PM
function calculateDeadline($collectionDate) {
    $dayOfWeek = date('N', strtotime($collectionDate)); // 1 (Mon) - 7 (Sun)
    if ($dayOfWeek == 4) { // Thursday
        $deadlineDate = date('Y-m-d', strtotime($collectionDate . ' +2 days')); // Saturday
    } elseif ($dayOfWeek == 5) { // Friday
        $deadlineDate = date('Y-m-d', strtotime($collectionDate . ' +1 day')); // Saturday
    } else {
        $deadlineDate = date('Y-m-d', strtotime($collectionDate . ' +1 day'));
    }
    return $deadlineDate . ' 12:00:00';
}

try {
    $month = trim($_GET['month'] ?? ''); // Optional filter by month: YYYY-MM
    $statusFilter = trim($_GET['status'] ?? 'all');

    $CUTOFF_DATE = '2026-11-01'; // ১ নভেম্বর ২০২৬ থেকে নতুন ব্যাংকিং রুলস কার্যকর

    // ১. ১ নভেম্বরের পূর্ববর্তী সমস্ত ইন্ডিভিজুয়াল পেন্ডিং রেকর্ড মুছে ফেলা (যাতে ওভারডিউ হিসেবে না দেখায়)
    $mysqli->query("DELETE FROM daily_bank_deposits WHERE collection_date < '{$CUTOFF_DATE}' AND collection_date != '2026-10-31'");

    // ২. ১ নভেম্বরের পূর্ববর্তী সমস্ত পুঞ্জীভূত ক্যাশ হিসাব করে একটি একক ঐতিহাসিক সমন্বয় রেকর্ড তৈরি/আপডেট করা
    $histRes = $mysqli->query("
        SELECT SUM(amount) as hist_total, COUNT(DISTINCT date) as hist_days
        FROM cash 
        WHERE type = 'in' AND approval_status = 'approved' AND date < '{$CUTOFF_DATE}'
    ");
    $histRow = $histRes ? $histRes->fetch_assoc() : null;
    $histTotal = floatval($histRow['hist_total'] ?? 0);
    $histDays  = intval($histRow['hist_days'] ?? 0);

    if ($histTotal > 0) {
        $histCheck = $mysqli->query("SELECT id FROM daily_bank_deposits WHERE collection_date = '2026-10-31'")->fetch_assoc();
        $histNotes = "১ নভেম্বর ২০২৬ এর পূর্ববর্তী {$histDays} দিনের সর্বমোট ক্যাশ এককালীন চেক দিয়ে সমন্বয় ও নিষ্পত্তি করা হয়েছে। ১ নভেম্বর থেকে প্রতিদিনের ব্যাংকিং রুলস কার্যকর।";
        if (!$histCheck) {
            $insHist = $mysqli->prepare("
                INSERT INTO daily_bank_deposits 
                (collection_date, expected_amount, deposited_amount, shortage_amount, bank_name, account_no, status, deadline_datetime, admin_notes)
                VALUES ('2026-10-31', ?, ?, 0, '১ নভেম্বরের পূর্বের পুঞ্জীভূত ক্যাশ (এককালীন মেলানো চেক)', 'HISTORICAL-CHECK', 'verified', '2026-10-31 23:59:59', ?)
            ");
            $insHist->bind_param("dds", $histTotal, $histTotal, $histNotes);
            $insHist->execute();
            $insHist->close();
        } else {
            $upHist = $mysqli->prepare("
                UPDATE daily_bank_deposits 
                SET expected_amount = ?, deposited_amount = ?, shortage_amount = 0, bank_name = '১ নভেম্বরের পূর্বের পুঞ্জীভূত ক্যাশ (এককালীন মেলানো চেক)', account_no = 'HISTORICAL-CHECK', status = 'verified', admin_notes = ?
                WHERE id = ?
            ");
            $upHist->bind_param("ddsi", $histTotal, $histTotal, $histNotes, $histCheck['id']);
            $upHist->execute();
            $upHist->close();
        }
    }

    // ৩. ১ নভেম্বর ২০২৬ বা তার পরবর্তী তারিখগুলোর ক্যাশ ইন ও ক্যাশ আউট ডেটা আনা
    $cashQuery = "
        SELECT 
            c.date AS collection_date,
            SUM(CASE WHEN c.type = 'in' THEN c.amount ELSE 0 END) AS total_in,
            SUM(CASE WHEN c.type = 'out' THEN c.amount ELSE 0 END) AS total_out
        FROM cash c
        WHERE c.approval_status = 'approved'
          AND c.date >= '{$CUTOFF_DATE}'
        GROUP BY c.date
        ORDER BY c.date DESC
    ";
    $cashRes = $mysqli->query($cashQuery);
    
    // ৪. ১ তারিখের পরবর্তী প্রতিটি দিন নিশ্চিত করা
    if ($cashRes) {
        while ($row = $cashRes->fetch_assoc()) {
            $cDate = $row['collection_date'];
            $totalIn = floatval($row['total_in']);
            $totalOut = floatval($row['total_out']);
            $deadline = calculateDeadline($cDate);

            // Check if exists
            $checkStmt = $mysqli->prepare("SELECT id, status, adjustment_mode, custom_target_amount, deducted_expense_ids, deducted_expense_amount, deposited_amount FROM daily_bank_deposits WHERE collection_date = ?");
            $checkStmt->bind_param("s", $cDate);
            $checkStmt->execute();
            $existing = $checkStmt->get_result()->fetch_assoc();
            $checkStmt->close();

            $mode = $existing['adjustment_mode'] ?? 'net_deduct';
            $deductedExpAmt = floatval($existing['deducted_expense_amount'] ?? 0);

            if ($mode === 'gross_full') {
                $expAmount = $totalIn;
            } elseif ($mode === 'net_deduct') {
                $expAmount = max(0.0, $totalIn - $totalOut);
            } elseif ($mode === 'custom') {
                $expAmount = max(0.0, $totalIn - $deductedExpAmt);
            } else {
                $expAmount = max(0.0, $totalIn - $totalOut);
            }

            if (!$existing) {
                // Insert new pending record
                $shortage = $expAmount;
                $insStmt = $mysqli->prepare("
                    INSERT INTO daily_bank_deposits 
                    (collection_date, expected_amount, total_cash_in, total_cash_out, adjustment_mode, deadline_datetime, status, shortage_amount)
                    VALUES (?, ?, ?, ?, 'net_deduct', ?, 'pending_deposit', ?)
                ");
                $insStmt->bind_param("sdddsd", $cDate, $expAmount, $totalIn, $totalOut, $deadline, $shortage);
                $insStmt->execute();
                $insStmt->close();
            } else if ($existing['status'] === 'pending_deposit') {
                // Update expected amount & in/out if collection or expenses changed
                $deposited = floatval($existing['deposited_amount']);
                $shortage = max(0.0, $expAmount - $deposited);
                $upStmt = $mysqli->prepare("
                    UPDATE daily_bank_deposits 
                    SET expected_amount = ?, total_cash_in = ?, total_cash_out = ?, deadline_datetime = ?, shortage_amount = ?
                    WHERE id = ?
                ");
                $upStmt->bind_param("dddsdi", $expAmount, $totalIn, $totalOut, $deadline, $shortage, $existing['id']);
                $upStmt->execute();
                $upStmt->close();
            }
        }
    }

    // 5. Query deposits list with joined user info
    $sql = "
        SELECT 
            d.id,
            d.collection_date,
            d.expected_amount,
            d.total_cash_in,
            d.total_cash_out,
            d.adjustment_mode,
            d.custom_target_amount,
            d.deducted_expense_ids,
            d.deducted_expense_amount,
            d.deposit_date,
            d.deadline_datetime,
            d.bank_name,
            d.account_no,
            d.deposited_amount,
            d.shortage_amount,
            d.slip_image,
            d.discrepancy_reason,
            d.status,
            d.submitted_by,
            d.submitted_at,
            d.verified_by,
            d.verified_at,
            d.admin_notes,
            d.created_at,
            d.updated_at,
            sub_u.name AS submitted_by_name,
            ver_u.name AS verified_by_name
        FROM daily_bank_deposits d
        LEFT JOIN users sub_u ON sub_u.id = d.submitted_by
        LEFT JOIN users ver_u ON ver_u.id = d.verified_by
        WHERE 1=1
    ";

    $params = [];
    $types  = "";

    if ($month !== '') {
        $sql .= " AND d.collection_date LIKE ? ";
        $params[] = $month . "%";
        $types   .= "s";
    }

    if ($statusFilter !== 'all') {
        $sql .= " AND d.status = ? ";
        $params[] = $statusFilter;
        $types   .= "s";
    }

    $sql .= " ORDER BY d.collection_date DESC LIMIT 100";

    $stmt = $mysqli->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    $datesInList = [];
    $totalExpected = 0;
    $totalDeposited = 0;
    $totalShortage = 0;
    $totalCashIn = 0;
    $totalCashOut = 0;
    $pendingCount = 0;
    $overdueCount = 0;
    $verifiedCount = 0;
    $now = date('Y-m-d H:i:s');

    while ($row = $result->fetch_assoc()) {
        $row['expected_amount'] = floatval($row['expected_amount']);
        $row['deposited_amount'] = floatval($row['deposited_amount']);
        $row['shortage_amount'] = floatval($row['shortage_amount']);
        $row['total_cash_in'] = floatval($row['total_cash_in'] ?? 0);
        $row['total_cash_out'] = floatval($row['total_cash_out'] ?? 0);
        $row['deducted_expense_amount'] = floatval($row['deducted_expense_amount'] ?? 0);
        $row['deducted_expense_ids'] = !empty($row['deducted_expense_ids']) ? json_decode($row['deducted_expense_ids'], true) : [];
        $row['adjustment_mode'] = $row['adjustment_mode'] ?? 'net_deduct';
        $row['custom_target_amount'] = isset($row['custom_target_amount']) ? floatval($row['custom_target_amount']) : null;
        
        $isOverdue = ($row['status'] === 'pending_deposit' && $row['expected_amount'] > 0 && strtotime($now) > strtotime($row['deadline_datetime']));
        $row['is_overdue'] = $isOverdue;

        // Bengali day of week
        $timestamp = strtotime($row['collection_date']);
        $daysBengali = [
            1 => 'সোমবার',
            2 => 'মঙ্গলবার',
            3 => 'বুধবার',
            4 => 'বৃহস্পতিবার',
            5 => 'শুক্রবার',
            6 => 'শনিবার',
            7 => 'রবিবার'
        ];
        $row['day_name'] = $daysBengali[date('N', $timestamp)] ?? '';

        $totalExpected  += $row['expected_amount'];
        $totalDeposited += $row['deposited_amount'];
        $totalShortage  += $row['shortage_amount'];
        $totalCashIn    += $row['total_cash_in'];
        $totalCashOut   += $row['total_cash_out'];

        if ($row['status'] === 'pending_deposit') {
            $pendingCount++;
            if ($isOverdue) $overdueCount++;
        } elseif ($row['status'] === 'verified') {
            $verifiedCount++;
        }

        $row['cash_out_items'] = [];
        $items[] = $row;
        if ($row['collection_date'] !== '2026-10-31') {
            $datesInList[] = $row['collection_date'];
        }
    }
    $stmt->close();

    // 6. Bulk prefetch Cash Out items for the loaded dates to display granular expenses
    if (!empty($datesInList)) {
        $escapedDates = array_map(fn($d) => "'" . $mysqli->real_escape_string($d) . "'", array_unique($datesInList));
        $dateInListSql = implode(',', $escapedDates);
        
        $outSql = "
            SELECT 
                c.id,
                c.date,
                c.category,
                c.purpose,
                c.amount,
                c.source,
                COALESCE(cat.name_bn, c.category) as name_bn,
                COALESCE(cat.name_en, c.category) as name_en,
                COALESCE(cat.color_bg, 'bg-slate-500/15') as color_bg,
                COALESCE(cat.color_text, 'text-slate-300') as color_text,
                COALESCE(cat.color_border, 'border-slate-500/30') as color_border,
                COALESCE(cat.is_company_expense, 0) as is_company_expense
            FROM cash c
            LEFT JOIN cash_categories cat ON cat.slug = c.category
            WHERE c.type = 'out' 
              AND c.approval_status = 'approved'
              AND c.date IN ({$dateInListSql})
            ORDER BY c.id ASC
        ";
        
        $outRes = $mysqli->query($outSql);
        $cashOutByDate = [];
        if ($outRes) {
            while ($outRow = $outRes->fetch_assoc()) {
                $outRow['id'] = intval($outRow['id']);
                $outRow['amount'] = floatval($outRow['amount']);
                $outRow['is_company_expense'] = intval($outRow['is_company_expense']);
                $cashOutByDate[$outRow['date']][] = $outRow;
            }
        }

        // Map cash out items to each row with is_deducted flag
        foreach ($items as &$item) {
            $d = $item['collection_date'];
            if (isset($cashOutByDate[$d])) {
                $mode = $item['adjustment_mode'];
                $deductedIds = is_array($item['deducted_expense_ids']) ? $item['deducted_expense_ids'] : [];

                foreach ($cashOutByDate[$d] as $cout) {
                    $isDeducted = false;
                    if ($mode === 'net_deduct') {
                        $isDeducted = true;
                    } elseif ($mode === 'gross_full') {
                        $isDeducted = false;
                    } elseif ($mode === 'custom') {
                        $isDeducted = in_array($cout['id'], $deductedIds);
                    }
                    $cout['is_deducted'] = $isDeducted;
                    $item['cash_out_items'][] = $cout;
                }
            }
        }
        unset($item);
    }

    echo json_encode([
        "success" => true,
        "data" => $items,
        "summary" => [
            "total_expected"   => $totalExpected,
            "total_deposited"  => $totalDeposited,
            "total_shortage"   => $totalShortage,
            "total_cash_in"    => $totalCashIn,
            "total_cash_out"   => $totalCashOut,
            "pending_count"    => $pendingCount,
            "overdue_count"    => $overdueCount,
            "verified_count"   => $verifiedCount,
            "total_records"    => count($items)
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "সার্ভার এরর: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
