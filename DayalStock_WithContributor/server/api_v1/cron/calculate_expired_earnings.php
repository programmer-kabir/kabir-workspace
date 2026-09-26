<?php
require_once __DIR__ . '/../config/db.php';

echo "Running Expired Subscription Earnings Cron...\n";

try {
    $mysqli->begin_transaction();

    // Find expired subscriptions that have 0 downloads and haven't been processed yet
    $sql = "
        SELECT us.id as subscription_id, pt.amount as total_amount
        FROM user_subscriptions us
        JOIN payment_transactions pt ON us.transaction_id = pt.id
        WHERE us.end_date < NOW()
        AND us.id NOT IN (
            SELECT source_id FROM company_earnings WHERE transaction_type = 'expired_sub'
        )
        AND (
            SELECT COUNT(*) FROM author_earning_transactions aet 
            WHERE aet.subscription_id = us.id
        ) = 0
    ";

    $result = $mysqli->query($sql);

    if ($result && $result->num_rows > 0) {
        $earning_month = date('Y-m');
        $insert_stmt = $mysqli->prepare("
            INSERT INTO company_earnings 
            (transaction_type, source_id, total_amount, company_earned, status, earning_month, created_at) 
            VALUES ('expired_sub', ?, ?, ?, 'completed', ?, NOW())
        ");

        $count = 0;
        while ($row = $result->fetch_assoc()) {
            $sub_id = $row['subscription_id'];
            $amount = $row['total_amount'];
            
            // Company gets the remaining 70%
            $company_earned = $amount * 0.70;

            $insert_stmt->bind_param("idds", $sub_id, $amount, $company_earned, $earning_month);
            $insert_stmt->execute();
            $count++;
        }

        echo "Successfully processed $count expired subscriptions with 0 downloads.\n";
    } else {
        echo "No expired subscriptions with 0 downloads found to process.\n";
    }

    $mysqli->commit();

} catch (Exception $e) {
    $mysqli->rollback();
    echo "Error processing expired subscriptions: " . $e->getMessage() . "\n";
}

$mysqli->close();
?>
