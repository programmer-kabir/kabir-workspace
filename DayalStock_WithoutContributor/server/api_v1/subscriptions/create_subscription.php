<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $email = trim($data['email'] ?? '');
    $plan_id = intval($data['plan_id'] ?? 0);

    if (!$email || !$plan_id) {
        echo json_encode(["success" => false, "message" => "Email and Plan ID are required"]);
        exit;
    }

    // 1. Get User ID from email
    $user_stmt = $mysqli->prepare("SELECT id, name FROM users WHERE email = ?");
    $user_stmt->bind_param("s", $email);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    
    if ($user_res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found in database. Please login again."]);
        exit;
    }
    $user_row = $user_res->fetch_assoc();
    $user_id = $user_row['id'];
    $user_name = $user_row['name'];

    // 2. Get Plan Details (specifically billing cycle and price)
    $plan_stmt = $mysqli->prepare("SELECT price, billing_cycle FROM subscription_plans WHERE id = ?");
    $plan_stmt->bind_param("i", $plan_id);
    $plan_stmt->execute();
    $plan_res = $plan_stmt->get_result();
    
    if ($plan_res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid subscription plan"]);
        exit;
    }
    $plan_row = $plan_res->fetch_assoc();
    $billing_cycle = $plan_row['billing_cycle'];
    $price = $plan_row['price'];

    // 3. Calculate Dates
    $start_date = date("Y-m-d H:i:s");
    
    if ($billing_cycle === 'yearly') {
        $end_date = date("Y-m-d H:i:s", strtotime("+1 year"));
    } else {
        // default to monthly if not yearly or if it's 'monthly'
        $end_date = date("Y-m-d H:i:s", strtotime("+1 month"));
    }

    // Start Transaction
    $mysqli->begin_transaction();

    // 4. Update any existing active subscriptions for this user to 'cancelled' or 'expired'
    $update_stmt = $mysqli->prepare("UPDATE user_subscriptions SET status = 'cancelled', updated_at = NOW() WHERE user_id = ? AND status = 'active'");
    $update_stmt->bind_param("i", $user_id);
    $update_stmt->execute();

    // 5. Insert into global payment transactions table first
    $tx_id = 'DEMO-TXN-' . strtoupper(uniqid());
    $insert_payment = $mysqli->prepare("INSERT INTO payment_transactions (user_id, amount, transaction_id, payment_source, payment_method, status) VALUES (?, ?, ?, 'subscription', 'stripe', 'verified')");
    $insert_payment->bind_param("ids", $user_id, $price, $tx_id);
    $insert_payment->execute();
    $payment_transaction_id = $mysqli->insert_id;

    // 6. Insert new active subscription with transaction_id (which points to payment_transactions.id)
    $insert_sql = "
        INSERT INTO user_subscriptions 
        (user_id, plan_id, transaction_id, status, start_date, end_date, auto_renew, created_at, updated_at) 
        VALUES (?, ?, ?, 'active', ?, ?, 1, NOW(), NOW())
    ";
    
    $insert_stmt = $mysqli->prepare($insert_sql);
    $insert_stmt->bind_param("iiiss", $user_id, $plan_id, $payment_transaction_id, $start_date, $end_date);
    
    if ($insert_stmt->execute()) {
        $subscription_id = $mysqli->insert_id;

        // Update payment_transactions with the source_id (subscription_id)
        $update_payment = $mysqli->prepare("UPDATE payment_transactions SET source_id = ? WHERE id = ?");
        $update_payment->bind_param("ii", $subscription_id, $payment_transaction_id);
        $update_payment->execute();
        
        // 7. Record the transaction in billing_history (Keeping your existing logic)
        $billing_sql = "
            INSERT INTO billing_history 
            (user_id, plan_id, amount, currency, transaction_id, payment_method, status, created_at) 
            VALUES (?, ?, ?, 'USD', ?, 'Demo', 'success', NOW())
        ";
        $billing_stmt = $mysqli->prepare($billing_sql);
        $billing_stmt->bind_param("iids", $user_id, $plan_id, $price, $tx_id);
        $billing_stmt->execute();

        // 7.5 Record company earnings (100% Admin revenue)
        $company_cut = $price; // 100% to Admin
        $earning_month = date('Y-m');
        $company_earnings_sql = "
            INSERT INTO company_earnings 
            (transaction_type, source_id, total_amount, company_earned, status, earning_month, created_at) 
            VALUES ('subscription', ?, ?, ?, 'completed', ?, NOW())
        ";
        $company_stmt = $mysqli->prepare($company_earnings_sql);
        $company_stmt->bind_param("idds", $subscription_id, $price, $company_cut, $earning_month);
        $company_stmt->execute();

        // 8. Send Notification to Admin
        $notif_sql = "
            INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, link, priority) 
            VALUES ($user_id, $user_id, 'user', 'admin', 'payment_success', 'Subscription Activated', 'A payment of $$price USD has been successfully processed. User $user_name ($email) is now a Premium member.', '/admin/billing', 'high')
        ";
        $mysqli->query($notif_sql);

        $mysqli->commit();
        echo json_encode(["success" => true, "message" => "Subscription and billing history created successfully"]);
    } else {
        $mysqli->rollback();
        throw new Exception("Failed to insert subscription");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
