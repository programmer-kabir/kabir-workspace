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
    $totalLiquidPool = $netCash + $unpaidAmount;

    // 3. COMPANY 3 CARDS SPECIFICALLY (Cards 1, 2, 3)
    $compCardsRes = $mysqli->query("
        SELECT 
            ic.id AS card_id,
            ic.card_name,
            ic.investment_amount AS capital,
            COALESCE((
                SELECT SUM(pg.profit_amount) 
                FROM profit_generator pg 
                WHERE pg.card_id = ic.id AND pg.profit_year = 2026 AND pg.profit_month = 10
            ), 0) AS oct_2026_profit,
            COALESCE((
                SELECT SUM(pg_all.profit_amount) 
                FROM profit_generator pg_all 
                WHERE pg_all.card_id = ic.id
            ), 0) AS total_all_time_profit
        FROM investment_cards ic
        WHERE ic.id IN (1, 2, 3)
        ORDER BY ic.id ASC
    ");
    $companyCards = [];
    $companyTotalCapital = 0.0;
    $companyTotalOctProfit = 0.0;
    $companyTotalLifetimeProfit = 0.0;
    if ($compCardsRes) {
        while ($c = $compCardsRes->fetch_assoc()) {
            $cap = (float)$c['capital'];
            $oct = (float)$c['oct_2026_profit'];
            $all = (float)$c['total_all_time_profit'];
            $companyTotalCapital += $cap;
            $companyTotalOctProfit += $oct;
            $companyTotalLifetimeProfit += $all;
            $companyCards[] = [
                'card_id'               => (int)$c['card_id'],
                'card_name'             => $c['card_name'],
                'capital'               => $cap,
                'oct_2026_profit'       => $oct,
                'total_all_time_profit' => $all
            ];
        }
    }

    // 4. GENERAL INVESTORS (Running Cards excluding 1, 2, 3)
    $invCardQuery = $mysqli->query("
        SELECT 
            COUNT(DISTINCT ic.id) AS running_cards_count,
            COUNT(DISTINCT ic.investor_id) AS running_investor_count,
            COALESCE(SUM(ic.investment_amount), 0) AS running_capital
        FROM investment_cards ic
        WHERE ic.status = 'running' AND ic.id NOT IN (1, 2, 3)
    ");
    $invCardRow = $invCardQuery ? $invCardQuery->fetch_assoc() : [];
    $investorRunningCapital = (float)($invCardRow['running_capital'] ?? 0);
    $investorRunningCardsCount = (int)($invCardRow['running_cards_count'] ?? 0);
    $investorRunningCount = (int)($invCardRow['running_investor_count'] ?? 0);

    // General Investors Profit
    $genProfQuery = $mysqli->query("
        SELECT COALESCE(SUM(profit_amount), 0) AS total_profit
        FROM profit_generator
        WHERE card_id NOT IN (1, 2, 3)
    ");
    $investorLifetimeProfit = (float)($genProfQuery->fetch_assoc()['total_profit'] ?? 0);

    $genOctProfQuery = $mysqli->query("
        SELECT COALESCE(SUM(profit_amount), 0) AS oct_profit
        FROM profit_generator
        WHERE profit_year = 2026 AND profit_month = 10 AND card_id NOT IN (1, 2, 3)
    ");
    $investorOctProfit = (float)($genOctProfQuery->fetch_assoc()['oct_profit'] ?? 0);

    $genWithdrawnQuery = $mysqli->query("
        SELECT COALESCE(SUM(amount), 0) AS total_withdrawn 
        FROM profit_history 
        WHERE status = 'withdraw' AND investor_id != 1
    ");
    $investorWithdrawnProfit = (float)($genWithdrawnQuery->fetch_assoc()['total_withdrawn'] ?? 0);
    $investorUnwithdrawnProfit = max(0, $investorLifetimeProfit - $investorWithdrawnProfit);
    $investorTotalClaim = $investorRunningCapital + $investorUnwithdrawnProfit;

    // Combined Totals (All 129 Running Cards: Investors + Company)
    $totalCombinedCapital = $investorRunningCapital + $companyTotalCapital;
    $totalCombinedOctProfit = $investorOctProfit + $companyTotalOctProfit;
    $totalCombinedLifetimeProfit = $investorLifetimeProfit + $companyTotalLifetimeProfit;

    // Coverage & Surpluses
    $netCapitalSurplus = $totalLiquidPool - $investorRunningCapital;
    $capitalCoveragePercent = $investorRunningCapital > 0 
        ? min(100.0, round(($totalLiquidPool / $investorRunningCapital) * 100, 2)) 
        : 100.0;

    // 5. Product Sales and Gross Profits
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

    // 6. Other Incomes (Rental, Bondok profit)
    $otherIncQuery = $mysqli->query("
        SELECT COALESCE(SUM(amount), 0) AS total_other_income 
        FROM cash 
        WHERE type='in' AND category IN ('rental_income', 'other_income')
    ");
    $lifetimeOtherIncome = (float)($otherIncQuery->fetch_assoc()['total_other_income'] ?? 0);

    // 7. Office Operational Expenses
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
    $companyLifetimeRetainedProfit = $netOperatingProfit - $investorWithdrawnProfit;

    // 8. General Investor by Investor Breakdown (Cards 1, 2, 3 excluded)
    $investorBreakdownSql = "
        SELECT 
            u.id AS investor_id,
            u.name AS investor_name,
            u.mobile AS investor_mobile,
            COUNT(ic.id) AS total_cards,
            COALESCE(SUM(ic.investment_amount), 0) AS total_capital,
            COALESCE((
                SELECT SUM(pg.profit_amount) 
                FROM profit_generator pg 
                WHERE pg.investor_id = u.id AND pg.profit_year = 2026 AND pg.profit_month = 10 AND pg.card_id NOT IN (1, 2, 3)
            ), 0) AS oct_2026_profit,
            COALESCE((
                SELECT SUM(pg_all.profit_amount) 
                FROM profit_generator pg_all 
                WHERE pg_all.investor_id = u.id AND pg_all.card_id NOT IN (1, 2, 3)
            ), 0) AS total_all_time_profit,
            COALESCE((
                SELECT SUM(ph.amount) 
                FROM profit_history ph 
                WHERE ph.investor_id = u.id AND ph.status = 'withdraw'
            ), 0) AS total_withdrawn
        FROM investment_cards ic
        LEFT JOIN users u ON ic.investor_id = u.id
        WHERE ic.status = 'running' AND ic.id NOT IN (1, 2, 3)
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
            "net_cash"                       => $netCash,
            "total_cash_in"                  => (float)($cashRow['total_cash_in'] ?? 0),
            "total_cash_out"                 => (float)($cashRow['total_cash_out'] ?? 0),
            "total_liquid_pool"              => $totalLiquidPool,
            
            // Investor Specific
            "investor_running_capital"       => $investorRunningCapital,
            "investor_running_count"         => $investorRunningCount,
            "investor_running_cards_count"   => $investorRunningCardsCount,
            "investor_oct_2026_profit"       => $investorOctProfit,
            "investor_lifetime_profit"       => $investorLifetimeProfit,
            "investor_withdrawn_profit"      => $investorWithdrawnProfit,
            "investor_unwithdrawn_profit"    => $investorUnwithdrawnProfit,
            "investor_total_claim"           => $investorTotalClaim,
            "capital_coverage_percent"       => $capitalCoveragePercent,
            "net_capital_surplus"            => $netCapitalSurplus,

            // Company 3 Cards Specific
            "company_total_capital"          => $companyTotalCapital,
            "company_oct_2026_profit"        => $companyTotalOctProfit,
            "company_lifetime_profit"        => $companyTotalLifetimeProfit,
            "company_cards"                  => $companyCards,

            // Combined
            "total_combined_capital"         => $totalCombinedCapital,
            "total_combined_oct_profit"      => $totalCombinedOctProfit,
            "total_combined_lifetime_profit" => $totalCombinedLifetimeProfit,

            // P&L
            "lifetime_sales"                 => $lifetimeSales,
            "lifetime_cost"                  => $lifetimeCost,
            "lifetime_gross_profit"          => $lifetimeGrossProfit,
            "lifetime_other_income"          => $lifetimeOtherIncome,
            "lifetime_expenses"              => $totalExpenses,
            "lifetime_net_operating_profit"  => $netOperatingProfit,
            "company_lifetime_retained_profit" => $companyLifetimeRetainedProfit
        ],
        "investor_breakdown" => $investorsList,
        "company_cards"      => $companyCards,
        "expense_breakdown"  => $expenseBreakdown
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "সার্ভার এরর: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
