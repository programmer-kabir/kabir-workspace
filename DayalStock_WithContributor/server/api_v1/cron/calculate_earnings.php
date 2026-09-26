<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/Logger.php';

Logger::log("Starting Monthly Earning Calculation Cron", 'INFO');

// Find subscriptions that have completed their billing cycle and haven't been processed
$sub_sql = "
    SELECT us.*, sp.price, sp.id as plan_id
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.end_date < NOW() AND us.earnings_processed = 0
";
$result = $mysqli->query($sub_sql);

if (!$result) {
    Logger::log("Failed to fetch subscriptions for earnings: " . $mysqli->error, 'ERROR');
    exit("Error fetching subscriptions.");
}

$processed_count = 0;

while ($sub = $result->fetch_assoc()) {
    $sub_id = (int)$sub['id'];
    $user_id = (int)$sub['user_id'];
    $price = (float)$sub['price'];
    $start_date = $sub['start_date'];
    $end_date = $sub['end_date'];

    // If plan price is 0, no earnings to share
    if ($price <= 0) {
        $mysqli->query("UPDATE user_subscriptions SET earnings_processed = 1 WHERE id = $sub_id");
        continue;
    }

    $author_pool = $price * 0.70; // 70% share
    
    // Get all distinct contents downloaded by this user during this subscription period
    $downloads_sql = "
        SELECT dh.content_id, MIN(c.content_type) as content_type, c.author_id, COUNT(*) as d_count
        FROM downloads_history dh
        JOIN contents c ON c.id = dh.content_id
        WHERE dh.user_id = ? AND dh.downloaded_at BETWEEN ? AND ?
        GROUP BY dh.content_id, c.author_id
    ";
    
    $stmt = $mysqli->prepare($downloads_sql);
    $stmt->bind_param("iss", $user_id, $start_date, $end_date);
    $stmt->execute();
    $d_result = $stmt->get_result();
    
    $downloads = [];
    $total_weight = 0;
    
    while ($row = $d_result->fetch_assoc()) {
        $ctype = strtolower(trim($row['content_type']));
        
        $weight = 1; // Default
        if (in_array($ctype, ['vector', 'psd', 'eps', 'ai'])) $weight = 2;
        elseif (in_array($ctype, ['source_pack', 'combo', 'video', 'video_hd'])) $weight = 3;
        elseif ($ctype === 'video_4k') $weight = 4;
        elseif ($ctype === 'video_8k') $weight = 5;
        
        $row['weight'] = $weight;
        $downloads[] = $row;
        $total_weight += $weight;
    }
    
    if ($total_weight > 0) {
        $value_per_weight = $author_pool / $total_weight;
        
        // Insert earnings
        foreach ($downloads as $d) {
            $author_id = (int)$d['author_id'];
            if ($author_id <= 0) continue; 
            
            $content_id = (int)$d['content_id'];
            $c_weight = $d['weight'];
            $d_count = $d['d_count'];
            $earned = $c_weight * $value_per_weight;
            
            // Insert transaction
            $ins = $mysqli->prepare("INSERT INTO author_earning_transactions (author_id, user_id, subscription_id, content_id, downloads_count, credit_weight, download_value, earned_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->bind_param("iiiiiddd", $author_id, $user_id, $sub_id, $content_id, $d_count, $c_weight, $value_per_weight, $earned);
            $ins->execute();
            
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
        }
    }
    
    // Mark as processed
    $mysqli->query("UPDATE user_subscriptions SET earnings_processed = 1 WHERE id = $sub_id");
    $processed_count++;
}

Logger::log("Completed Earning Calculation. Processed $processed_count subscriptions.", 'INFO');
echo "Processed $processed_count subscriptions successfully.\n";
