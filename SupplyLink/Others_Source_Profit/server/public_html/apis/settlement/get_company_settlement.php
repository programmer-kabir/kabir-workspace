<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

try {
    // 1. Net Cash in hand/bank
    $cashQuery = $mysqli->query("
        SELECT 
            COALESCE(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) AS net_cash,
            COALESCE(SUM(CASE WHEN type='in' THEN amount ELSE 0 END), 0) AS total_cash_in,
            COALESCE(SUM(CASE WHEN type='out' THEN amount ELSE 0 END), 0) AS total_cash_out
        FROM cash
    ");
    $cashRow = $cashQuery ? $cashQuery->fetch_assoc() : [];
    $netCash = (float)($cashRow['net_cash'] ?? 0);

    // 2. Customer Installments (Paid vs Unpaid)
    $instQuery = $mysqli->query("
        SELECT 
            COALESCE(SUM(CASE WHEN status='Unpaid' THEN due_amount ELSE 0 END), 0) AS unpaid_amount,
            COALESCE(SUM(CASE WHEN status='Unpaid' THEN 1 ELSE 0 END), 0) AS unpaid_count,
            COALESCE(SUM(CASE WHEN status='Paid' THEN due_amount ELSE 0 END), 0) AS paid_amount,
            COALESCE(SUM(CASE WHEN status='Paid' THEN 1 ELSE 0 END), 0) AS paid_count
        FROM installment_payments
    ");
    $instRow = $instQuery ? $instQuery->fetch_assoc() : [];
    $unpaidAmount = (float)($instRow['unpaid_amount'] ?? 0);
    $unpaidCount = (int)($instRow['unpaid_count'] ?? 0);

    // Liquid Pool
    $totalLiquidPool = $netCash + $unpaidAmount;

    // 3. Running Investors Capital
    $invCardQuery = $mysqli->query("
        SELECT 
            COUNT(*) AS running_card_count,
            COUNT(DISTINCT investor_id) AS running_investor_count,
            COALESCE(SUM(investment_amount), 0) AS total_running_capital,
            COALESCE(SUM(total_time_wighted_value), 0) AS total_twv
        FROM investment_cards 
        WHERE status = 'running'
    ");
    $invCardRow = $invCardQuery ? $invCardQuery->fetch_assoc() : [];
    $totalRunningCapital = (float)($invCardRow['total_running_capital'] ?? 0);
    $runningCardCount = (int)($invCardRow['running_card_count'] ?? 0);
    $runningInvestorCount = (int)($invCardRow['running_investor_count'] ?? 0);

    // 4. Investor Profit Overview
    $profitGenQuery = $mysqli->query("
        SELECT COALESCE(SUM(profit_amount), 0) AS total_generated_profit 
        FROM profit_generator
    ");
    $totalGeneratedProfit = (float)($profitGenQuery->fetch_assoc()['total_generated_profit'] ?? 0);

    $profitWithdrawnQuery = $mysqli->query("
        SELECT COALESCE(SUM(amount), 0) AS total_withdrawn 
        FROM profit_history 
        WHERE status = 'withdraw'
    ");
    $totalProfitWithdrawn = (float)($profitWithdrawnQuery->fetch_assoc()['total_withdrawn'] ?? 0);

    $investorUnwithdrawnProfit = max(0, $totalGeneratedProfit - $totalProfitWithdrawn);
    $investorTotalClaim = $totalRunningCapital + $investorUnwithdrawnProfit;

    // 5. Capital Coverage & Deficit
    $netCapitalSurplus = $totalLiquidPool - $totalRunningCapital;
    $capitalCoveragePercent = $totalRunningCapital > 0 
        ? min(100.0, round(($totalLiquidPool / $totalRunningCapital) * 100, 2)) 
        : 100.0;

    // 6. Product Sales and Gross Profits
    $saleQuery = $mysqli->query("
        SELECT 
            COUNT(*) AS total_sale_cards,
            COALESCE(SUM(sale_price), 0) AS total_sales,
            COALESCE(SUM(cost_price), 0) AS total_costs,
            COALESCE(SUM(profit), 0) AS total_gross_profit,
            COALESCE(SUM(down_payment), 0) AS total_down_payment
        FROM installment_cards
    ");
    $saleRow = $saleQuery ? $saleQuery->fetch_assoc() : [];
    $lifetimeGrossProfit = (float)($saleRow['total_gross_profit'] ?? 0);
    $lifetimeSales = (float)($saleRow['total_sales'] ?? 0);
    $lifetimeCost = (float)($saleRow['total_costs'] ?? 0);

    // 7. Other Incomes (Rental, Bondok profit)
    $otherIncQuery = $mysqli->query("
        SELECT COALESCE(SUM(amount), 0) AS total_other_income 
        FROM cash 
        WHERE type='in' AND category IN ('rental_income', 'other_income')
    ");
    $lifetimeOtherIncome = (float)($otherIncQuery->fetch_assoc()['total_other_income'] ?? 0);

    // 8. Office Operational Expenses
    $expQuery = $mysqli->query("
        SELECT 
            category,
            COALESCE(SUM(amount), 0) as amount,
            COUNT(*) as count
        FROM cash 
        WHERE type = 'out' AND category IN ('salary', 'office-expense', 'bill', 'rent')
        GROUP BY category
    ");
    $expenseBreakdown = [];
    $totalExpenses = 0;
    if ($expQuery) {
        while ($exp = $expQuery->fetch_assoc()) {
            $amt = (float)$exp['amount'];
            $totalExpenses += $amt;
            $expenseBreakdown[] = [
                'category' => $exp['category'],
                'amount'   => $amt,
                'count'    => (int)$exp['count']
            ];
        }
    }

    $netOperatingProfit = ($lifetimeGrossProfit + $lifetimeOtherIncome) - $totalExpenses;
    $companyLifetimeRetainedProfit = $netOperatingProfit - $totalProfitWithdrawn;

    // 9. October 2026 Specific Month Metrics
    $octProfitQuery = $mysqli->query("
        SELECT 
            COUNT(*) as oct_records,
            COALESCE(SUM(profit_amount), 0) as oct_total_profit
        FROM profit_generator 
        WHERE profit_year = 2026 AND profit_month = 10
    ");
    $octRow = $octProfitQuery ? $octProfitQuery->fetch_assoc() : [];
    $october2026Profit = (float)($octRow['oct_total_profit'] ?? 0);
    $october2026Records = (int)($octRow['oct_records'] ?? 0);

    // 10. Investor by Investor Detailed Settlement Breakdown
    $investorBreakdownSql = "
        SELECT 
            u.id AS investor_id,
            u.name AS investor_name,
            u.mobile AS investor_mobile,
            COUNT(ic.id) AS total_cards,
            COALESCE(SUM(ic.investment_amount), 0) AS total_capital,
            COALESCE(SUM(ic.total_time_wighted_value), 0) AS total_twv,
            COALESCE((
                SELECT SUM(pg.profit_amount) 
                FROM profit_generator pg 
                WHERE pg.investor_id = u.id AND pg.profit_year = 2026 AND pg.profit_month = 10
            ), 0) AS oct_2026_profit,
            COALESCE((
                SELECT SUM(pg_all.profit_amount) 
                FROM profit_generator pg_all 
                WHERE pg_all.investor_id = u.id
            ), 0) AS total_all_time_profit,
            COALESCE((
                SELECT SUM(ph.amount) 
                FROM profit_history ph 
                WHERE ph.investor_id = u.id AND ph.status = 'withdraw'
            ), 0) AS total_withdrawn
        FROM investment_cards ic
        LEFT JOIN users u ON ic.investor_id = u.id
        WHERE ic.status = 'running'
        GROUP BY u.id, u.name, u.mobile
        ORDER BY total_capital DESC
    ";
    $invRes = $mysqli->query($investorBreakdownSql);
    $investorsList = [];
    if ($invRes) {
        while ($inv = $invRes->fetch_assoc()) {
            $cap = (float)$inv['total_capital'];
            $allProf = (float)$inv['total_all_time_profit'];
            $withdrawn = (float)$inv['total_withdrawn'];
            $octProf = (float)$inv['oct_2026_profit'];
            $unwithdrawn = max(0, $allProf - $withdrawn);

            $investorsList[] = [
                'investor_id'            => (int)$inv['investor_id'],
                'investor_name'          => $inv['investor_name'] ?: 'অজ্ঞাত ইনভেস্টর',
                'investor_mobile'        => $inv['investor_mobile'] ?: '',
                'total_cards'            => (int)$inv['total_cards'],
                'total_capital'          => $cap,
                'oct_2026_profit'        => $octProf,
                'total_all_time_profit'  => $allProf,
                'total_withdrawn'        => $withdrawn,
                'unwithdrawn_profit'     => $unwithdrawn,
                'total_settlement_claim' => $cap + $unwithdrawn
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "summary" => [
            "net_cash"                               => $netCash,
            "total_cash_in"                          => (float)($cashRow['total_cash_in'] ?? 0),
            "total_cash_out"                         => (float)($cashRow['total_cash_out'] ?? 0),
            "unpaid_installments_count"              => $unpaidCount,
            "unpaid_installments_amount"             => $unpaidAmount,
            "total_liquid_pool"                      => $totalLiquidPool,

            "investor_running_cards_count"           => $runningCardCount,
            "investor_running_count"                 => $runningInvestorCount,
            "investor_principal_payable"             => $totalRunningCapital,
            "investor_total_generated_profit"        => $totalGeneratedProfit,
            "investor_total_withdrawn_profit"        => $totalProfitWithdrawn,
            "investor_unwithdrawn_profit"            => $investorUnwithdrawnProfit,
            "investor_total_claim"                   => $investorTotalClaim,

            "net_capital_surplus"                    => $netCapitalSurplus,
            "capital_coverage_percent"               => $capitalCoveragePercent,

            "lifetime_sales"                         => $lifetimeSales,
            "lifetime_cost"                          => $lifetimeCost,
            "lifetime_gross_profit"                  => $lifetimeGrossProfit,
            "lifetime_other_income"                  => $lifetimeOtherIncome,
            "lifetime_expenses"                      => $totalExpenses,
            "lifetime_net_operating_profit"          => $netOperatingProfit,
            "company_lifetime_retained_profit"       => $companyLifetimeRetainedProfit,

            "october_2026_profit"                    => $october2026Profit,
            "october_2026_records"                   => $october2026Records
        ],
        "expense_breakdown" => $expenseBreakdown,
        "investor_breakdown" => $investorsList
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
