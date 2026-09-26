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

    $data = json_decode(file_get_contents("php://input"), true);
    $invoice_id = trim($data['invoice_id'] ?? '');
    $payment_method = trim($data['payment_method'] ?? '');
    $payment_details = trim($data['payment_details'] ?? '');
    
    if (empty($invoice_id) || empty($payment_method) || empty($payment_details)) {
        echo json_encode(["success" => false, "message" => "Invoice ID, payment method, and details are required."]);
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
    
    $author_id = (int) $auth_res->fetch_assoc()['id'];

    $mysqli->begin_transaction();

    // Check invoice
    $inv_stmt = $mysqli->prepare("SELECT id, total_revenue, status, created_at FROM author_invoices WHERE invoice_id = ? AND author_id = ? FOR UPDATE");
    $inv_stmt->bind_param("si", $invoice_id, $author_id);
    $inv_stmt->execute();
    $inv_res = $inv_stmt->get_result();
    
    if ($inv_res->num_rows === 0) {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "Invoice not found."]);
        exit;
    }
    
    $invoice = $inv_res->fetch_assoc();
    if ($invoice['status'] !== 'unpaid') {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "Invoice is already {$invoice['status']}."]);
        exit;
    }
    
    // Check if invoice has expired (older than 5 days)
    $created_at = strtotime($invoice['created_at']);
    $now = time();
    $days_diff = floor(($now - $created_at) / (60 * 60 * 24));
    
    if ($days_diff > 5) {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "This invoice has expired and can no longer be withdrawn. The amount will roll over to your next month's invoice."]);
        exit;
    }
    
    $amount = (float) $invoice['total_revenue'];
    
    if ($amount < 10) {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "Invoice amount must be at least $10 to withdraw."]);
        exit;
    }
    
    // Check wallet balance (sanity check)
    $wallet_stmt = $mysqli->prepare("SELECT balance FROM author_wallet WHERE author_id = ? FOR UPDATE");
    $wallet_stmt->bind_param("i", $author_id);
    $wallet_stmt->execute();
    $wallet_res = $wallet_stmt->get_result();
    $balance = $wallet_res->num_rows > 0 ? (float) $wallet_res->fetch_assoc()['balance'] : 0;
    
    if ($balance < $amount) {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "Insufficient wallet balance. If you withdrew these funds under the old system, this invoice cannot be withdrawn."]);
        exit;
    }
    
    // Update invoice status
    $upd_inv = $mysqli->prepare("UPDATE author_invoices SET status = 'pending' WHERE invoice_id = ?");
    $upd_inv->bind_param("s", $invoice_id);
    $upd_inv->execute();

    // Deduct balance from wallet
    $upd = $mysqli->prepare("UPDATE author_wallet SET balance = balance - ? WHERE author_id = ?");
    $upd->bind_param("di", $amount, $author_id);
    $upd->execute();

    // Insert request
    $ins = $mysqli->prepare("INSERT INTO withdraw_requests (author_id, invoice_id, amount, payment_method, payment_details) VALUES (?, ?, ?, ?, ?)");
    $ins->bind_param("isdss", $author_id, $invoice_id, $amount, $payment_method, $payment_details);
    $ins->execute();
    $withdraw_id = $mysqli->insert_id;
    
    // Log transaction
    $desc = "Requested Withdrawal for Invoice $invoice_id via $payment_method";
    $log_ins = $mysqli->prepare("INSERT INTO author_wallet_transactions (author_id, type, amount, description, reference_id) VALUES (?, 'withdrawal', ?, ?, ?)");
    $neg_amount = -$amount;
    $log_ins->bind_param("idsi", $author_id, $neg_amount, $desc, $withdraw_id);
    $log_ins->execute();

    $mysqli->commit();

    echo json_encode(["success" => true, "message" => "Withdrawal request submitted successfully."]);

} catch (Exception $e) {
    if (isset($mysqli)) $mysqli->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
