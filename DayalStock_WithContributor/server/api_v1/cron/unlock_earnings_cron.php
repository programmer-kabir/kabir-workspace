<?php
/**
 * Cron Job Script: Unlock pending buyout earnings
 * 
 * You can set this script to run daily in your server's Cron Jobs (cPanel).
 * Command example: php /path/to/your/backend/api_v1/cron/unlock_earnings_cron.php
 */

require_once __DIR__ . '/../config/db.php';

try {
    // We only check the DATE (ignoring exact time). 
    // Find all pending earnings that should be unlocked today
    $select_query = "SELECT author_id, SUM(earned_amount) as total_unlocked 
                     FROM author_buyout_earnings 
                     WHERE status = 'pending' AND DATE(locked_until) <= CURDATE()
                     GROUP BY author_id";
    $result = $mysqli->query($select_query);
    
    if ($result && $result->num_rows > 0) {
        $mysqli->begin_transaction();
        
        try {
            // 1. Update wallet for each author
            $update_wallet_stmt = $mysqli->prepare("
                INSERT INTO author_wallet (author_id, balance, total_earned) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                balance = balance + VALUES(balance), 
                total_earned = total_earned + VALUES(total_earned)
            ");

            // 1b. Insert log into author_wallet_transactions
            $log_stmt = $mysqli->prepare("
                INSERT INTO author_wallet_transactions (author_id, type, amount, description)
                VALUES (?, 'earning_buyout', ?, 'Earned from Buyout Unlock')
            ");
            
            while ($row = $result->fetch_assoc()) {
                $a_id = $row['author_id'];
                $amount = $row['total_unlocked'];
                
                // Update wallet
                $update_wallet_stmt->bind_param("idd", $a_id, $amount, $amount);
                $update_wallet_stmt->execute();
                
                // Log transaction
                $log_stmt->bind_param("id", $a_id, $amount);
                $log_stmt->execute();
            }
            
            // 2. Mark as available
            $update_query = "UPDATE author_buyout_earnings 
                             SET status = 'available' 
                             WHERE status = 'pending' AND DATE(locked_until) <= CURDATE()";
            $mysqli->query($update_query);
            
            $affected_rows = $mysqli->affected_rows;
            $mysqli->commit();
            
            echo json_encode([
                "success" => true,
                "message" => "Cron executed successfully. Unlocked records: " . $affected_rows
            ]);
        } catch (Exception $e) {
            $mysqli->rollback();
            throw $e;
        }
    } else {
        echo json_encode([
            "success" => true,
            "message" => "No pending earnings to unlock today."
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Cron failed: " . $e->getMessage()
    ]);
}
