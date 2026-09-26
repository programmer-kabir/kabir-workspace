<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user_id = $GLOBALS['user']['id'];
    $roles = $GLOBALS['user']['roles'] ?? [];
    
    if (!in_array('author', $roles) && !in_array('admin', $roles)) {
        echo json_encode(["success" => false, "message" => "Not an author."]);
        exit;
    }

    // Get author_id from authors table
    $auth_stmt = $mysqli->prepare("SELECT id FROM authors WHERE user_id = ?");
    $auth_stmt->bind_param("i", $user_id);
    $auth_stmt->execute();
    $auth_res = $auth_stmt->get_result();
    
    if ($auth_res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Author profile not found."]);
        exit;
    }
    
    $author_row = $auth_res->fetch_assoc();
    $author_id = (int)$author_row['id'];

    // 1. Get Wallet Balance
    $wallet_stmt = $mysqli->prepare("SELECT balance, total_earned, total_withdrawn FROM author_wallet WHERE author_id = ?");
    $wallet_stmt->bind_param("i", $author_id);
    $wallet_stmt->execute();
    $wallet_res = $wallet_stmt->get_result();
    $wallet = $wallet_res->fetch_assoc() ?: ['balance' => 0, 'total_earned' => 0, 'total_withdrawn' => 0];

    // 2. Get Withdrawals
    $wd_stmt = $mysqli->prepare("SELECT invoice_id, amount, status, requested_at, payment_method FROM withdraw_requests WHERE author_id = ? ORDER BY requested_at DESC");
    $wd_stmt->bind_param("i", $author_id);
    $wd_stmt->execute();
    $wd_res = $wd_stmt->get_result();
    $withdrawals = [];
    while ($w = $wd_res->fetch_assoc()) {
        $withdrawals[] = $w;
    }

    // 3. Calculate RPI per content
    // Combine earnings from subscriptions and buyouts
    $rpi_sql = "
        SELECT c.id, c.title, c.thumbnail_url, c.content_type, 
               SUM(all_e.earned_amount) as total_revenue, 
               SUM(all_e.downloads_count) as total_downloads
        FROM (
            SELECT author_id, content_id, earned_amount, downloads_count
            FROM author_earning_transactions
            WHERE author_id = ?
            UNION ALL
            SELECT be.author_id, eb.content_id, be.earned_amount, 0 as downloads_count
            FROM author_buyout_earnings be
            JOIN exclusive_buyouts eb ON be.buyout_id = eb.id
            WHERE be.author_id = ? AND be.status IN ('available', 'withdrawn')
        ) all_e
        JOIN contents c ON c.id = all_e.content_id
        GROUP BY c.id, c.title, c.thumbnail_url, c.content_type
        ORDER BY total_revenue DESC
    ";
    $rpi_stmt = $mysqli->prepare($rpi_sql);
    if (!$rpi_stmt) {
        throw new Exception("RPI query failed: " . $mysqli->error);
    }
    $rpi_stmt->bind_param("ii", $author_id, $author_id);
    $rpi_stmt->execute();
    $rpi_res = $rpi_stmt->get_result();
    
    $items = [];
    while ($row = $rpi_res->fetch_assoc()) {
        $rev = (float)$row['total_revenue'];
        $dl = (int)$row['total_downloads'];
        $row['rpi'] = $dl > 0 ? round($rev / $dl, 4) : 0;
        $items[] = $row;
    }

    // 4. Get Invoices
    $inv_sql = "
        SELECT invoice_id, earning_month, total_revenue, sub_revenue, buyout_revenue, total_downloads, status, created_at
        FROM author_invoices
        WHERE author_id = ?
        ORDER BY earning_month DESC
    ";
    $inv_stmt = $mysqli->prepare($inv_sql);
    if (!$inv_stmt) {
        throw new Exception("Invoice query failed: " . $mysqli->error);
    }
    $inv_stmt->bind_param("i", $author_id);
    $inv_stmt->execute();
    $inv_res = $inv_stmt->get_result();
    
    $invoices = [];
    $monthly_breakdown = [];
    $unpaid_balance = 0;
    while ($row = $inv_res->fetch_assoc()) {
        $row['total_revenue'] = (float)$row['total_revenue'];
        $row['sub_revenue'] = (float)$row['sub_revenue'];
        $row['buyout_revenue'] = (float)$row['buyout_revenue'];
        $row['total_downloads'] = (int)$row['total_downloads'];
        
        if ($row['status'] === 'unpaid') {
            $unpaid_balance += $row['total_revenue'];
        }
        $invoices[] = $row;
        
        $monthly_breakdown[] = [
            'month' => $row['earning_month'],
            'revenue' => $row['total_revenue'],
            'downloads' => $row['total_downloads']
        ];
    }
    
    // Override general wallet balance with exact unpaid invoices balance
    $wallet['balance'] = $unpaid_balance;

    // 5. Get Transaction History (Ledger)
    $th_sql = "
        SELECT type, amount, description, created_at
        FROM author_wallet_transactions
        WHERE author_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ";
    $th_stmt = $mysqli->prepare($th_sql);
    $th_stmt->bind_param("i", $author_id);
    $th_stmt->execute();
    $th_res = $th_stmt->get_result();
    
    $transactions_history = [];
    while ($row = $th_res->fetch_assoc()) {
        $transactions_history[] = [
            'type' => $row['type'],
            'amount' => (float)$row['amount'],
            'description' => $row['description'],
            'date' => $row['created_at']
        ];
    }

    echo json_encode([
        "success" => true,
        "wallet" => [
            "balance" => (float)$wallet['balance'],
            "total_earned" => (float)$wallet['total_earned'],
            "total_withdrawn" => (float)$wallet['total_withdrawn']
        ],
        "items" => $items,
        "invoices" => $invoices,
        "withdrawals" => $withdrawals,
        "monthly_breakdown" => $monthly_breakdown,
        "transactions_history" => $transactions_history
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
