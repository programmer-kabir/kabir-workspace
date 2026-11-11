<?php
// migrate_installment_extra.php
// Ensures all necessary columns and tables exist for Customer Installment Extra Amount management.

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$results = [];

// 1. Add extra_amount to installment_payments
try {
    $chkCol = $mysqli->query("SHOW COLUMNS FROM `installment_payments` LIKE 'extra_amount'");
    if ($chkCol && $chkCol->num_rows === 0) {
        $mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `extra_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `due_amount`");
        $results[] = "Added extra_amount to installment_payments";
    } else {
        $results[] = "extra_amount already exists in installment_payments";
    }
} catch (Throwable $e) {
    $results[] = "Error extra_amount: " . $e->getMessage();
}

// 2. Add adjusted_from_extra to installment_payments
try {
    $chkCol = $mysqli->query("SHOW COLUMNS FROM `installment_payments` LIKE 'adjusted_from_extra'");
    if ($chkCol && $chkCol->num_rows === 0) {
        $mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `adjusted_from_extra` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `extra_amount`");
        $results[] = "Added adjusted_from_extra to installment_payments";
    } else {
        $results[] = "adjusted_from_extra already exists in installment_payments";
    }
} catch (Throwable $e) {
    $results[] = "Error adjusted_from_extra: " . $e->getMessage();
}

// 3. Add total_paid_cash to installment_payments
try {
    $chkCol = $mysqli->query("SHOW COLUMNS FROM `installment_payments` LIKE 'total_paid_cash'");
    if ($chkCol && $chkCol->num_rows === 0) {
        $mysqli->query("ALTER TABLE `installment_payments` ADD COLUMN `total_paid_cash` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `adjusted_from_extra`");
        $results[] = "Added total_paid_cash to installment_payments";
    } else {
        $results[] = "total_paid_cash already exists in installment_payments";
    }
} catch (Throwable $e) {
    $results[] = "Error total_paid_cash: " . $e->getMessage();
}

// 4. Add extra_balance to installment_cards
try {
    $chkCol = $mysqli->query("SHOW COLUMNS FROM `installment_cards` LIKE 'extra_balance'");
    if ($chkCol && $chkCol->num_rows === 0) {
        $mysqli->query("ALTER TABLE `installment_cards` ADD COLUMN `extra_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `per_installment_amount`");
        $results[] = "Added extra_balance to installment_cards";
    } else {
        $results[] = "extra_balance already exists in installment_cards";
    }
} catch (Throwable $e) {
    $results[] = "Error extra_balance: " . $e->getMessage();
}

// 5. Create installment_extra_logs table
try {
    $sql = "
    CREATE TABLE IF NOT EXISTS `installment_extra_logs` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `card_id` INT NOT NULL,
      `payment_id` INT NULL,
      `customer_id` INT NOT NULL DEFAULT 0,
      `type` ENUM('deposit', 'adjustment', 'refund') NOT NULL,
      `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `previous_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `current_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      `cash_id` INT NULL,
      `receipt_number` VARCHAR(100) NULL,
      `created_by` INT NOT NULL DEFAULT 0,
      `remarks` TEXT NULL,
      `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY (`card_id`),
      KEY (`customer_id`),
      KEY (`payment_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $mysqli->query($sql);
    $results[] = "installment_extra_logs table verified/created";
} catch (Throwable $e) {
    $results[] = "Error installment_extra_logs: " . $e->getMessage();
}

echo json_encode([
    "success" => true,
    "results" => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

