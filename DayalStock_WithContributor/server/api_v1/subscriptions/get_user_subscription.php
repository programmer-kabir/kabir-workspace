<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = trim($data['email'] ?? '');

    if (!$email) {
        echo json_encode(["success" => false, "message" => "Email is required"]);
        exit;
    }

    // 1. Get User ID first
    $user_stmt = $mysqli->prepare("SELECT id FROM users WHERE email = ?");
    $user_stmt->bind_param("s", $email);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    
    if ($user_res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }
    $user_id = $user_res->fetch_assoc()['id'];

    // (নতুন যোগ করা অংশ) Auto-expire past active subscriptions for this user
    // যদি মেয়াদ শেষ হয়ে যায় তবে ডাটাবেসে এর স্ট্যাটাস আপডেট করে 'expired' করে দেওয়া হবে
    $expire_stmt = $mysqli->prepare("UPDATE user_subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active' AND end_date < NOW()");
    $expire_stmt->bind_param("i", $user_id);
    $expire_stmt->execute();

    // 2. Fetch the active subscription
    $sub_sql = "
        SELECT 
            us.id as subscription_id,
            us.status,
            us.start_date,
            us.end_date,
            us.auto_renew,
            sp.id as plan_id,
            sp.name as plan_name,
            sp.price,
            sp.billing_cycle,
            sp.image_limit,
            sp.premium_access
        FROM user_subscriptions us
        JOIN subscription_plans sp ON sp.id = us.plan_id
        WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= NOW()
        ORDER BY us.id DESC
        LIMIT 1
    ";
    
    $sub_stmt = $mysqli->prepare($sub_sql);
    $sub_stmt->bind_param("i", $user_id);
    $sub_stmt->execute();
    $sub_result = $sub_stmt->get_result();
    $subscription = $sub_result->fetch_assoc();

    // 3. Fetch Billing History (from payment_transactions)
    $history_sql = "
        SELECT 
            pt.id,
            pt.amount,
            'USD' as currency,
            pt.transaction_id,
            pt.payment_method,
            pt.status,
            pt.created_at,
            'Subscription' as plan_name
        FROM payment_transactions pt
        WHERE pt.user_id = ?
        ORDER BY pt.created_at DESC
    ";
    
    $history_stmt = $mysqli->prepare($history_sql);
    $history_stmt->bind_param("i", $user_id);
    $history_stmt->execute();
    $history_result = $history_stmt->get_result();
    
    $billing_history = [];
    while ($row = $history_result->fetch_assoc()) {
        $billing_history[] = $row;
    }

    // Return both subscription and history
    echo json_encode([
        "success" => true, 
        "data" => [
            "subscription" => $subscription ?: null,
            "billing_history" => $billing_history
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
