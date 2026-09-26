<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/Logger.php';

// Check if we are running from CLI or web
$isCli = php_sapi_name() === 'cli';

// Target month can be passed as argument (e.g., YYYY-MM), otherwise default to 2 months ago
$target_month = '';
if (isset($_GET['month'])) {
    $target_month = $_GET['month'];
} elseif ($isCli && isset($argv[1])) {
    $target_month = $argv[1];
} else {
    // Default to 2 months ago (Freepik model: process July in September)
    $target_month = date('Y-m', strtotime('-2 months'));
}

if (!preg_match('/^\d{4}-\d{2}$/', $target_month)) {
    die("Invalid month format. Use YYYY-MM.\n");
}

$start_of_month = $target_month . '-01 00:00:00';
$end_of_month = date('Y-m-t 23:59:59', strtotime($start_of_month));

Logger::log("Starting Monthly Earnings Calculation for: $target_month", 'INFO');

// 1. Check if already processed
$stmt = $mysqli->prepare("SELECT earning_month FROM monthly_earnings_status WHERE earning_month = ?");
$stmt->bind_param("s", $target_month);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    Logger::log("Month $target_month is already processed.", 'INFO');
    die("Month $target_month is already processed.\n");
}
$stmt->close();

// 2. Find all subscriptions that were active during this month
// meaning: start_date <= end_of_month AND end_date >= start_of_month
// AND we only process them if they are COMPLETED (end_date < NOW())
$sub_sql = "
    SELECT us.*, sp.price 
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.start_date <= ? AND us.end_date >= ?
      AND us.end_date < NOW() 
      AND sp.price > 0
";

$sub_stmt = $mysqli->prepare($sub_sql);
$sub_stmt->bind_param("ss", $end_of_month, $start_of_month);
$sub_stmt->execute();
$subscriptions = $sub_stmt->get_result();

$total_revenue_month = 0;
$total_downloads_month = 0;
$processed_subs = 0;

$mysqli->begin_transaction();

try {
    while ($sub = $subscriptions->fetch_assoc()) {
        $sub_id = (int)$sub['id'];
        $user_id = (int)$sub['user_id'];
        $price = (float)$sub['price'];
        $sub_start = $sub['start_date'];
        $sub_end = $sub['end_date'];

        $author_pool = $price * 0.70;

        // Step A: Find total downloads in the ENTIRE subscription cycle
        $dl_total_sql = "
            SELECT dh.content_id, MIN(c.content_type) as content_type, COUNT(*) as d_count
            FROM downloads_history dh
            JOIN contents c ON c.id = dh.content_id
            WHERE dh.user_id = ? AND dh.downloaded_at BETWEEN ? AND ?
            GROUP BY dh.content_id
        ";
        
        $dl_stmt = $mysqli->prepare($dl_total_sql);
        $dl_stmt->bind_param("iss", $user_id, $sub_start, $sub_end);
        $dl_stmt->execute();
        $dl_res = $dl_stmt->get_result();
        
        $total_weight_cycle = 0;
        
        while ($row = $dl_res->fetch_assoc()) {
            $ctype = strtolower(trim($row['content_type']));
            $weight = 1;
            if (in_array($ctype, ['vector', 'psd', 'eps', 'ai'])) $weight = 2;
            elseif (in_array($ctype, ['source_pack', 'combo', 'video', 'video_hd'])) $weight = 3;
            elseif ($ctype === 'video_4k') $weight = 4;
            elseif ($ctype === 'video_8k') $weight = 5;
            
            $total_weight_cycle += ($weight * $row['d_count']);
        }
        $dl_stmt->close();
        
        if ($total_weight_cycle <= 0) {
            continue; // No downloads in this cycle, author pool goes to platform (or unallocated)
        }

        $value_per_weight = $author_pool / $total_weight_cycle;

        // Step B: Find downloads ONLY in the TARGET MONTH during this cycle
        $actual_start = max($sub_start, $start_of_month);
        $actual_end = min($sub_end, $end_of_month);

        $dl_month_sql = "
            SELECT dh.content_id, MIN(c.content_type) as content_type, c.author_id, COUNT(*) as d_count
            FROM downloads_history dh
            JOIN contents c ON c.id = dh.content_id
            WHERE dh.user_id = ? AND dh.downloaded_at BETWEEN ? AND ?
            GROUP BY dh.content_id, c.author_id
        ";

        $dl_month_stmt = $mysqli->prepare($dl_month_sql);
        $dl_month_stmt->bind_param("iss", $user_id, $actual_start, $actual_end);
        $dl_month_stmt->execute();
        $dl_month_res = $dl_month_stmt->get_result();
        
        while ($row = $dl_month_res->fetch_assoc()) {
            $author_id = (int)$row['author_id'];
            if ($author_id <= 0) continue;
            
            $content_id = (int)$row['content_id'];
            $d_count = (int)$row['d_count'];
            $ctype = strtolower(trim($row['content_type']));
            
            $weight = 1;
            if (in_array($ctype, ['vector', 'psd', 'eps', 'ai'])) $weight = 2;
            elseif (in_array($ctype, ['source_pack', 'combo', 'video', 'video_hd'])) $weight = 3;
            elseif ($ctype === 'video_4k') $weight = 4;
            elseif ($ctype === 'video_8k') $weight = 5;

            $earned = ($weight * $d_count) * $value_per_weight;

            // Insert transaction
            $ins = $mysqli->prepare("INSERT INTO author_earning_transactions (author_id, user_id, subscription_id, content_id, downloads_count, credit_weight, download_value, earned_amount, earning_month) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->bind_param("iiiiiddss", $author_id, $user_id, $sub_id, $content_id, $d_count, $weight, $value_per_weight, $earned, $target_month);
            $ins->execute();
            $ins->close();
            
            // Update wallet
            $upd = $mysqli->prepare("
                INSERT INTO author_wallet (author_id, balance, total_earned) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                balance = balance + VALUES(balance), 
                total_earned = total_earned + VALUES(total_earned)
            ");
            $upd->bind_param("idd", $author_id, $earned, $earned);
            $upd->execute();
            $upd->close();
            
            // Log transaction
            $desc = "Earnings from Subscriptions ($target_month)";
            $log_ins = $mysqli->prepare("INSERT INTO author_wallet_transactions (author_id, type, amount, description, reference_id) VALUES (?, 'earning_subscription', ?, ?, ?)");
            $log_ins->bind_param("idsi", $author_id, $earned, $desc, $sub_id);
            $log_ins->execute();
            $log_ins->close();

            $total_revenue_month += $earned;
            $total_downloads_month += $d_count;
        }
        $dl_month_stmt->close();
        $processed_subs++;
    }

    // Insert into status table
    $ins_status = $mysqli->prepare("INSERT INTO monthly_earnings_status (earning_month, total_revenue, total_downloads) VALUES (?, ?, ?)");
    $ins_status->bind_param("sdi", $target_month, $total_revenue_month, $total_downloads_month);
    $ins_status->execute();
    $ins_status->close();

    // Generate explicit invoices for all authors for this month
    $invoice_sql = "
        INSERT INTO author_invoices (invoice_id, author_id, earning_month, total_revenue, sub_revenue, buyout_revenue, rollover_revenue, total_downloads, status)
        SELECT 
            CONCAT('INV-', REPLACE(?, '-', ''), '-', LPAD(combined.author_id, 4, '0')),
            combined.author_id,
            ?,
            SUM(sub_rev + buyout_rev) + COALESCE(MAX(ro.rollover_sum), 0) as total_revenue,
            SUM(sub_rev) as sub_revenue,
            SUM(buyout_rev) as buyout_revenue,
            COALESCE(MAX(ro.rollover_sum), 0) as rollover_revenue,
            SUM(sub_dl) as total_downloads,
            'unpaid'
        FROM (
            SELECT author_id, SUM(earned_amount) as sub_rev, 0 as buyout_rev, SUM(downloads_count) as sub_dl
            FROM author_earning_transactions
            WHERE earning_month = ?
            GROUP BY author_id
            
            UNION ALL
            
            SELECT author_id, 0 as sub_rev, SUM(earned_amount) as buyout_rev, 0 as sub_dl
            FROM author_buyout_earnings
            WHERE status IN ('available', 'withdrawn') AND DATE_FORMAT(locked_until, '%Y-%m') = ?
            GROUP BY author_id
            
            UNION ALL
            
            SELECT author_id, 0 as sub_rev, 0 as buyout_rev, 0 as sub_dl
            FROM author_invoices 
            WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 5 DAY 
            GROUP BY author_id
        ) combined
        LEFT JOIN (
            SELECT author_id, SUM(total_revenue) as rollover_sum 
            FROM author_invoices 
            WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 5 DAY 
            GROUP BY author_id
        ) ro ON ro.author_id = combined.author_id
        GROUP BY combined.author_id
        HAVING total_revenue > 0
        ON DUPLICATE KEY UPDATE 
            total_revenue = VALUES(total_revenue),
            sub_revenue = VALUES(sub_revenue),
            buyout_revenue = VALUES(buyout_revenue),
            rollover_revenue = VALUES(rollover_revenue),
            total_downloads = VALUES(total_downloads)
    ";
    $inv_stmt = $mysqli->prepare($invoice_sql);
    $inv_stmt->bind_param("ssss", $target_month, $target_month, $target_month, $target_month);
    $inv_stmt->execute();
    $inv_stmt->close();

    // Mark rolled over invoices as rolled_over
    $rollover_sql = "
        UPDATE author_invoices 
        SET status = 'rolled_over' 
        WHERE status = 'unpaid' AND created_at < NOW() - INTERVAL 5 DAY
    ";
    $mysqli->query($rollover_sql);

    $mysqli->commit();

    Logger::log("Successfully processed earnings for $target_month. Subs processed: $processed_subs. Total Revenue allocated: $total_revenue_month", 'INFO');
    echo "Success: Earnings for $target_month processed.\n";

} catch (Exception $e) {
    $mysqli->rollback();
    Logger::log("Error processing earnings for $target_month: " . $e->getMessage(), 'ERROR');
    echo "Error: " . $e->getMessage() . "\n";
}
