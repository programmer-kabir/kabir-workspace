<?php
/**
 * PayrollWithdrawal.php — Staff Payout Requests & Maturity Notifications Engine
 *
 * Dedicated engine to validate, record, and process staff payout withdrawal requests
 * (base salary and cashed-out overtime), audit cycle stamping, and payout notifications.
 */

require_once __DIR__ . '/../notifications/notification_helper.php';

class PayrollWithdrawal {

    /**
     * Check and send maturity notification to staff on 15th once per cycle
     *
     * @param PDO   $pdo
     * @param int   $userId
     * @param float $availableAmount
     * @param float $fractionalRollover
     */
    public static function checkAndSendMaturityNotification($pdo, $userId, $availableAmount, $fractionalRollover) {
        try {
            $scheme = PayrollHelper::getActiveScheme($pdo, $userId);
            if (!$scheme) {
                return;
            }

            // Strictly determine minimum withdrawal limit (monthly salary or 5k)
            $minLimit = ($scheme['scheme_type'] === 'YEARLY_CONTRACT') 
                ? 5000.0 
                : floatval($scheme['salary_amount'] ?: 5000.0);

            // If available amount does not meet or exceed salary limit, staff is NOT eligible to withdraw -> DO NOT send notification!
            if ($availableAmount < $minLimit || $minLimit <= 0) {
                return;
            }

            $currentCycle = date('Y-m');
            $metaTag = 'payout_unlocked_' . $currentCycle;

            // Check if notification already sent for this cycle
            $stmt = $pdo->prepare("
                SELECT id FROM notifications 
                WHERE user_id = :user_id 
                  AND type = 'payroll_unlocked' 
                  AND (metadata LIKE :meta_tag OR title LIKE '%পে-রোল%')
                LIMIT 1
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':meta_tag' => '%' . $metaTag . '%'
            ]);

            if (!$stmt->fetch()) {
                $title = "🎉 পে-রোল সাইকেল আনলক: ৳" . number_format($availableAmount) . " তোলার জন্য প্রস্তুত!";
                $msg = "আপনার পে-রোল সাইকেল সফলভাবে আনলক হয়েছে। ৳" . number_format($availableAmount) . " তোলার জন্য প্রস্তুত রয়েছে।" . ($fractionalRollover > 0 ? " (অবশিষ্ট ৳" . number_format($fractionalRollover, 2) . " পরের মাসের সাথে রোলওভার হবে)" : "");
                
                NotificationHelper::sendToUser(
                    $pdo,
                    $userId,
                    null,
                    $title,
                    $msg,
                    'payroll_unlocked',
                    'all',
                    '/payroll',
                    'high',
                    ['cycle' => $currentCycle, 'tag' => $metaTag, 'amount' => $availableAmount, 'fraction' => $fractionalRollover]
                );
            }
        } catch (Exception $e) {
            error_log("Maturity Notification Error in PayrollWithdrawal: " . $e->getMessage());
        }
    }

    /**
     * Request a withdrawal (supports base salary + optional overtime cashout)
     *
     * @param PDO    $pdo
     * @param int    $userId
     * @param float  $amount
     * @param string $paymentMethod
     * @param string $accountDetails
     * @param float  $overtimeHoursToCash
     * @return array
     * @throws Exception
     */
    public static function requestWithdrawal($pdo, $userId, $amount, $paymentMethod, $accountDetails, $overtimeHoursToCash = 0.0) {
        $amount = floor(floatval($amount)); // Integer cashout
        $overtimeHoursToCash = max(0.0, floatval($overtimeHoursToCash));

        if ($amount <= 0) {
            throw new Exception("Withdrawal amount must be a positive whole number (e.g. ৳ 5000).");
        }

        $summary = PayrollHelper::getStaffWalletSummary($pdo, $userId);
        if (!$summary['has_scheme']) {
            throw new Exception($summary['message']);
        }

        $minLimit = floatval($summary['min_withdrawal_limit'] ?? 5000);
        if (empty($summary['can_withdraw'])) {
            $reason = !empty($summary['withdrawal_block_reason']) 
                ? $summary['withdrawal_block_reason'] 
                : ("উত্তোলন লক্ষ্যমাত্রা ৳ " . number_format($minLimit) . " অপূর্ণ থাকায় উইথড্র সাময়িকভাবে লক রয়েছে।");
            throw new Exception($reason);
        }
        if ($amount < $minLimit) {
            throw new Exception("Minimum withdrawal amount for your pay scheme is ৳" . number_format($minLimit) . ".");
        }

        // Base withdrawable (using full fractional balance before cashout floor)
        $baseAvailable = floatval($summary['available_withdrawable_total'] ?? $summary['available_withdrawable'] ?? 0.0);
        $otCashAmount = 0.0;

        if ($overtimeHoursToCash > 0) {
            $otBank = $summary['overtime_bank'] ?? null;
            $availOtHours = floatval($otBank['available_hours'] ?? 0.0);
            if ($overtimeHoursToCash > $availOtHours) {
                throw new Exception("Requested overtime cashout (" . $overtimeHoursToCash . "h) exceeds your available Overtime Bank (" . $availOtHours . "h).");
            }
            $otHourlyRate = floatval($otBank['hourly_rate'] ?? 0.0);
            $otCashAmount = round($overtimeHoursToCash * $otHourlyRate, 2);
        }

        $totalMaxAvailable = floor($baseAvailable + $otCashAmount);

        if ($amount > $totalMaxAvailable) {
            throw new Exception("Requested amount (৳" . number_format($amount) . ") exceeds your total available withdrawable balance (৳" . number_format($totalMaxAvailable) . ").");
        }

        $scheme = $summary['scheme'];
        $withdrawalType = ($scheme['scheme_type'] === 'YEARLY_CONTRACT') ? 'CONTRACT_SURPLUS' : 'MONTHLY_SALARY';

        // Stamp covered billing cycles and invoices for permanent audit history
        $coveredMonthsList = [];
        $coveredInvoicesList = [];
        if (!empty($summary['monthly_cycle_ledger'])) {
            foreach ($summary['monthly_cycle_ledger'] as $cycle) {
                if (!empty($cycle['is_unlocked']) && $cycle['status'] !== 'paid') {
                    $coveredMonthsList[] = $cycle['month_label'] ?: $cycle['month_key'];
                    $coveredInvoicesList[] = $cycle['invoice_id'];
                }
            }
        }
        $coveredMonthsStr = !empty($coveredMonthsList) ? implode(', ', $coveredMonthsList) : date('F Y');
        $coveredInvoicesStr = !empty($coveredInvoicesList) ? implode(', ', $coveredInvoicesList) : null;

        $stmt = $pdo->prepare("
            INSERT INTO staff_withdrawals (
                user_id, scheme_id, amount, overtime_hours_cashed, covered_months, invoice_ids,
                withdrawal_type, status, payment_method, account_details, requested_at
            ) VALUES (
                :user_id, :scheme_id, :amount, :overtime_hours_cashed, :covered_months, :invoice_ids,
                :withdrawal_type, 'pending', :payment_method, :account_details, NOW()
            )
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':scheme_id' => $scheme['id'],
            ':amount' => $amount,
            ':overtime_hours_cashed' => $overtimeHoursToCash,
            ':covered_months' => $coveredMonthsStr,
            ':invoice_ids' => $coveredInvoicesStr,
            ':withdrawal_type' => $withdrawalType,
            ':payment_method' => $paymentMethod,
            ':account_details' => $accountDetails,
        ]);

        $withdrawalId = $pdo->lastInsertId();

        // Send notifications
        try {
            // 1. Notify Admin
            NotificationHelper::sendToRole(
                $pdo,
                'admin',
                $userId,
                "💰 New Payout Request: ৳" . number_format($amount),
                "A staff member submitted a withdrawal request of ৳" . number_format($amount) . " via " . strtoupper($paymentMethod) . ".",
                'withdrawal_request',
                'admin',
                '/payroll'
            );

            // 2. Notify Staff
            NotificationHelper::sendToUser(
                $pdo,
                $userId,
                null,
                "⏳ Withdrawal Request Submitted: ৳" . number_format($amount),
                "Your payout request of ৳" . number_format($amount) . " via {$paymentMethod} is currently under admin review.",
                'withdrawal_pending',
                'staff',
                '/payroll'
            );
        } catch (Exception $e) {
            // Non-blocking notification error
        }

        return [
            'withdrawal_id' => $withdrawalId,
            'amount' => $amount,
            'status' => 'pending',
            'requested_at' => date('Y-m-d H:i:s')
        ];
    }
}

