<?php
require_once __DIR__ . '/../config/db.php';

// Webhook Secret from environment (.env) with default fallback
$webhookSecret = getenv('LEMON_SQUEEZY_WEBHOOK_SECRET') ?: 'piksea_Secret_Key_2026!';
define('LEMON_SQUEEZY_WEBHOOK_SECRET', $webhookSecret);

// 1. Get the payload and signature
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

// Log incoming request for debugging
file_put_contents(__DIR__ . '/webhook_log.txt', "[" . date('Y-m-d H:i:s') . "] Payload: " . $payload . "\n", FILE_APPEND);
file_put_contents(__DIR__ . '/webhook_log.txt', "[" . date('Y-m-d H:i:s') . "] Signature: " . $signature . "\n", FILE_APPEND);

// 2. Verify the signature
$hash = hash_hmac('sha256', $payload, LEMON_SQUEEZY_WEBHOOK_SECRET);
if (!hash_equals($hash, $signature)) {
    file_put_contents(__DIR__ . '/webhook_log.txt', "[" . date('Y-m-d H:i:s') . "] Error: Invalid signature\n", FILE_APPEND);
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// 3. Parse the event data
$event = json_decode($payload, true);
$eventName = $event['meta']['event_name'] ?? '';
$data = $event['data'] ?? [];

// Only process specific events
if ($eventName === 'subscription_created' || $eventName === 'subscription_updated' || $eventName === 'subscription_payment_success' || $eventName === 'order_created') {
    
    $attributes = $data['attributes'] ?? [];
    $customData = $event['meta']['custom_data'] ?? [];
    
    // Extract necessary data
    $userId = isset($customData['user_id']) ? intval($customData['user_id']) : null;
    $variantId = $attributes['variant_id'] ?? null;
    $productName = strtolower($attributes['product_name'] ?? '');
    
    // We now pass plan_id directly in the checkout url: &checkout[custom][plan_id]=X
    $planId = isset($customData['plan_id']) ? intval($customData['plan_id']) : null;
    
    // Some events use order_id or subscription_id as the transaction ID
    $transactionId = $data['id'] ?? '';
    
    // Amount will be fetched from database
    $amount = 0;
    
    if (!$userId) {
        file_put_contents(__DIR__ . '/webhook_log.txt', "[" . date('Y-m-d H:i:s') . "] Error: Missing user_id\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(['error' => 'Missing user_id']);
        exit;
    }

    if (!$planId && ($eventName === 'subscription_created' || $eventName === 'subscription_updated')) {
        // Fallback: If custom_data doesn't have plan_id, try to guess from product_name
        if (strpos($productName, 'pro+') !== false || strpos($productName, 'pro plus') !== false) {
            $planId = 5;
        } elseif (strpos($productName, 'pro') !== false) {
            $planId = 4;
        } elseif (strpos($productName, 'premium') !== false) {
            $planId = 3;
        } else {
            $planId = 2; // Default Starter
        }
        file_put_contents(__DIR__ . '/webhook_log.txt', "[" . date('Y-m-d H:i:s') . "] Warning: No plan_id in custom_data. Deduced Plan ID $planId from product name '$productName'.\n", FILE_APPEND);
    }

    $mysqli->begin_transaction();

    try {
        // Fetch the exact price of the plan from database
        $priceStmt = $mysqli->prepare("SELECT price FROM subscription_plans WHERE id = ?");
        $priceStmt->bind_param("i", $planId);
        $priceStmt->execute();
        $priceRes = $priceStmt->get_result()->fetch_assoc();
        if ($priceRes) {
            $amount = floatval($priceRes['price']);
        }

        // Check if this transaction already exists to avoid duplicates (e.g. on subscription_updated)
        $paymentSource = ($eventName === 'order_created') ? 'order' : 'subscription';
        
        $checkStmt = $mysqli->prepare("SELECT id FROM payment_transactions WHERE transaction_id = ? AND payment_source = ?");
        $checkStmt->bind_param("ss", $transactionId, $paymentSource);
        $checkStmt->execute();
        $checkRes = $checkStmt->get_result()->fetch_assoc();
        
        if ($checkRes) {
            $paymentTransactionId = $checkRes['id'];
        } else {
            // Wait, for order_created, we should use the actual total paid.
            if ($eventName === 'order_created') {
                $amount = floatval($attributes['total'] ?? 0) / 100; // Lemon Squeezy total is in cents
            }
            
            // Insert into payment_transactions
            $stmt1 = $mysqli->prepare("INSERT INTO payment_transactions (user_id, amount, transaction_id, payment_source, payment_method, status) VALUES (?, ?, ?, ?, 'lemon_squeezy', 'verified')");
            $stmt1->bind_param("idss", $userId, $amount, $transactionId, $paymentSource);
            $stmt1->execute();
            $paymentTransactionId = $mysqli->insert_id;
        }
        
        if ($eventName === 'order_created' && isset($customData['type']) && $customData['type'] === 'exclusive_buyout') {
            $contentId = intval($customData['content_id'] ?? 0);
            if ($contentId > 0) {
                // 1. Mark content as sold
                $updateContent = $mysqli->prepare("UPDATE contents SET is_exclusive_sold = 1, status = 'exclusive_buyout' WHERE id = ?");
                $updateContent->bind_param("i", $contentId);
                $updateContent->execute();
                
                // 2. Insert into exclusive_buyouts
                // Since transaction_id in exclusive_buyouts expects a string (from original script), we pass $paymentTransactionId
                $insertBuyout = $mysqli->prepare("INSERT INTO exclusive_buyouts (user_id, content_id, amount, transaction_id, status) VALUES (?, ?, ?, ?, 'completed')");
                $insertBuyout->bind_param("iids", $userId, $contentId, $amount, $paymentTransactionId);
                $insertBuyout->execute();
                $buyoutId = $mysqli->insert_id;

                // 3. Update payment_transactions with the buyout source_id and payment_source
                $updateTx = $mysqli->prepare("UPDATE payment_transactions SET payment_source = 'exclusive_buyout', source_id = ? WHERE id = ?");
                $updateTx->bind_param("ii", $buyoutId, $paymentTransactionId);
                // 4. Record 100% Company/Admin earnings for the buyout
                $companyCut = $amount; // 100% to admin
                $earningMonth = date('Y-m');
                $companyEarningsSql = "
                    INSERT INTO company_earnings 
                    (transaction_type, source_id, total_amount, company_earned, status, earning_month, created_at) 
                    VALUES ('buyout', ?, ?, ?, 'completed', ?, NOW())
                ";
                $companyStmt = $mysqli->prepare($companyEarningsSql);
                $companyStmt->bind_param("idds", $buyoutId, $amount, $companyCut, $earningMonth);
                $companyStmt->execute();
            }
            
            $mysqli->commit();
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Exclusive buyout processed successfully (100% Admin)']);
            exit;
        } else if ($eventName === 'order_created') {
            // Subscription payment
            $companyCut = $amount; // Company keeps 100% of subscription revenue
            $earningMonth = date('Y-m');
            $companyEarningsSql = "
                INSERT INTO company_earnings 
                (transaction_type, source_id, total_amount, company_earned, status, earning_month, created_at) 
                VALUES ('subscription', ?, ?, ?, 'completed', ?, NOW())
            ";
            $companyStmt = $mysqli->prepare($companyEarningsSql);
            $companyStmt->bind_param("idds", $paymentTransactionId, $amount, $companyCut, $earningMonth);
            $companyStmt->execute();

            $mysqli->commit();
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Subscription payment processed successfully']);
            exit;
        }

        if ($eventName === 'subscription_created' || $eventName === 'subscription_updated' || $eventName === 'subscription_payment_success') {
            // Calculate dates
            $startDate = date('Y-m-d H:i:s');
            $endDate = date('Y-m-d H:i:s', strtotime('+1 month')); // Default to 1 month. In production, check plan duration

            // Check if user already has an active subscription
            $checkStmt = $mysqli->prepare("SELECT id FROM user_subscriptions WHERE user_id = ? AND status = 'active'");
            $checkStmt->bind_param("i", $userId);
            $checkStmt->execute();
            $existingSub = $checkStmt->get_result()->fetch_assoc();

            if ($existingSub) {
                // Update existing subscription
                $stmt2 = $mysqli->prepare("UPDATE user_subscriptions SET plan_id = ?, transaction_id = ?, status = 'active', end_date = ?, updated_at = NOW() WHERE user_id = ? AND status = 'active'");
                $stmt2->bind_param("iisi", $planId, $paymentTransactionId, $endDate, $userId);
                $stmt2->execute();
            } else {
                // Insert new subscription
                $stmt2 = $mysqli->prepare("INSERT INTO user_subscriptions (user_id, plan_id, transaction_id, status, start_date, end_date, auto_renew) VALUES (?, ?, ?, 'active', ?, ?, 1)");
                $stmt2->bind_param("iiiss", $userId, $planId, $paymentTransactionId, $startDate, $endDate);
                $stmt2->execute();
            }

            // Ensure Company Earnings is recorded (100% Studio Model)
            $checkEarning = $mysqli->prepare("SELECT id FROM company_earnings WHERE source_id = ? AND transaction_type = 'subscription'");
            $checkEarning->bind_param("i", $paymentTransactionId);
            $checkEarning->execute();
            $existingEarning = $checkEarning->get_result()->fetch_assoc();

            if (!$existingEarning && $amount > 0) {
                $earningMonth = date('Y-m');
                $companyEarningsSql = "
                    INSERT INTO company_earnings 
                    (transaction_type, source_id, total_amount, company_earned, status, earning_month, created_at) 
                    VALUES ('subscription', ?, ?, ?, 'completed', ?, NOW())
                ";
                $companyStmt = $mysqli->prepare($companyEarningsSql);
                $companyStmt->bind_param("idds", $paymentTransactionId, $amount, $amount, $earningMonth);
                $companyStmt->execute();
            }

            $mysqli->commit();
            
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Subscription activated and company earnings recorded successfully']);
            exit;
        }
        
    } catch (Exception $e) {
        $mysqli->rollback();
        file_put_contents(__DIR__ . '/webhook_log.txt', "[" . date('Y-m-d H:i:s') . "] DB Error: " . $e->getMessage() . "\n", FILE_APPEND);
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
    }
    
} else {
    // Unhandled event
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Event ignored']);
}
