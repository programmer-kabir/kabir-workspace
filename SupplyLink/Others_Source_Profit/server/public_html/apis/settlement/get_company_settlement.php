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

    // =========================================================================
    // 3. GENERAL INVESTORS (3-STAGE LIFECYCLE: EXCLUDING CARDS 1, 2, 3)
    // =========================================================================

    // Stage 1: All-Time History (Running + Closed)
    $qInvAll = $mysqli->query("
        SELECT 
            COUNT(*) AS total_cards,
            COUNT(DISTINCT investor_id) AS total_investors,
            COALESCE(SUM(investment_amount), 0) AS total_capital
        FROM investment_cards
        WHERE id NOT IN (1, 2, 3)
    ");
    $rInvAll = $qInvAll ? $qInvAll->fetch_assoc() : [];
    $invAllCards = (int)($rInvAll['total_cards'] ?? 0);
    $invAllCount = (int)($rInvAll['total_investors'] ?? 0);
    $invAllCapital = (float)($rInvAll['total_capital'] ?? 0);

    $qInvAllProfit = $mysqli->query("
        SELECT COALESCE(SUM(profit_amount), 0) AS total_profit
        FROM profit_generator
        WHERE card_id NOT IN (1, 2, 3)
    ");
    $invAllProfit = (float)($qInvAllProfit ? $qInvAllProfit->fetch_assoc()['total_profit'] : 0);

    // Stage 2: Already Withdrawn / Paid Out (Closed Cards & Withdrawn Profit)
    $qInvClosed = $mysqli->query("
        SELECT 
            COUNT(*) AS closed_cards,
            COUNT(DISTINCT investor_id) AS closed_investors,
            COALESCE(SUM(investment_amount), 0) AS closed_capital
        FROM investment_cards
        WHERE id NOT IN (1, 2, 3) AND status = 'closed'
    ");
    $rInvClosed = $qInvClosed ? $qInvClosed->fetch_assoc() : [];
    $invWithdrawnCards = (int)($rInvClosed['closed_cards'] ?? 0);
    $invWithdrawnCount = (int)($rInvClosed['closed_investors'] ?? 0);
    $invWithdrawnCapital = (float)($rInvClosed['closed_capital'] ?? 0);

    $qInvWithdrawnProfit = $mysqli->query("
        SELECT COALESCE(SUM(amount), 0) AS withdrawn_profit
        FROM profit_history
        WHERE status = 'withdraw' AND investor_id != 1
    ");
    $invWithdrawnProfit = (float)($qInvWithdrawnProfit ? $qInvWithdrawnProfit->fetch_assoc()['withdrawn_profit'] : 0);
    $invTotalWithdrawn = $invWithdrawnCapital + $invWithdrawnProfit;

    // Stage 3: Currently Remaining / Running (Active Claims)
    $qInvRun = $mysqli->query("
        SELECT 
            COUNT(*) AS running_cards,
            COUNT(DISTINCT investor_id) AS running_investors,
            COALESCE(SUM(investment_amount), 0) AS running_capital
        FROM investment_cards
        WHERE id NOT IN (1, 2, 3) AND status = 'running'
    ");
    $rInvRun = $qInvRun ? $qInvRun->fetch_assoc() : [];
    $invRemainingCards = (int)($rInvRun['running_cards'] ?? 0);
    $invRemainingCount = (int)($rInvRun['running_investors'] ?? 0);
    $invRemainingCapital = (float)($rInvRun['running_capital'] ?? 0);

    $invRemainingProfit = max(0, $invAllProfit - $invWithdrawnProfit);
    $invTotalRemainingClaim = $invRemainingCapital + $invRemainingProfit;

    // Coverage & Surpluses based on current remaining investor claims
    $netCapitalSurplus = $totalLiquidPool - $invRemainingCapital;
    $capitalCoveragePercent = $invRemainingCapital > 0 
        ? min(100.0, round(($totalLiquidPool / $invRemainingCapital) * 100, 2)) 
        : 100.0;
    $cashSurplusAfterAllClaims = $netCash - $invTotalRemainingClaim;

    // =========================================================================
    // 4. COMPANY OWN 3 CARDS (Cards 1, 2, 3)
    // =========================================================================
    $compCardsRes = $mysqli->query("
        SELECT 
            ic.id AS card_id,
            ic.card_name,
            ic.investment_amount AS capital,
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
    $companyTotalLifetimeProfit = 0.0;
    if ($compCardsRes) {
        while ($c = $compCardsRes->fetch_assoc()) {
            $cap = (float)$c['capital'];
            $all = (float)$c['total_all_time_profit'];
            $companyTotalCapital += $cap;
            $companyTotalLifetimeProfit += $all;
            $companyCards[] = [
                'card_id'               => (int)$c['card_id'],
                'card_name'             => $c['card_name'],
                'capital'               => $cap,
                'total_all_time_profit' => $all,
                'withdrawn_profit'      => 0.0,
                'unwithdrawn_profit'    => $all,
                'net_balance'           => $cap + $all
            ];
        }
    }
    $companyWithdrawnProfit = 0.0;
    $companyWithdrawnCapital = 0.0;
    $companyRemainingProfit = $companyTotalLifetimeProfit;
    $companyRemainingCapital = $companyTotalCapital;
    $companyTotalRemainingClaim = $companyRemainingCapital + $companyRemainingProfit;

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
    $companyLifetimeRetainedProfit = $netOperatingProfit - $invWithdrawnProfit;

    // =========================================================================
    // DYNAMIC DECISION ROADMAP SCENARIOS
    // =========================================================================
    // Scenario 1: Company injects/reimburses office expenses
    $s1NewCash = $netCash + $totalExpenses;
    $s1SurplusForAdmin = $s1NewCash - ($invTotalRemainingClaim + $companyTotalRemainingClaim);

    // Scenario 2: Settled as-is with current cash
    $s2RemainingCashForAdmin = $netCash - $invTotalRemainingClaim;
    $s2ExpenseCoveredByCompany = $totalExpenses;

    // 8. General Investor by Investor Breakdown (Cards 1, 2, 3 excluded)
    $investorBreakdownSql = "
        SELECT 
            u.id AS investor_id,
            u.name AS investor_name,
            u.mobile AS investor_mobile,
            COUNT(ic.id) AS total_cards,
            COALESCE(SUM(ic.investment_amount), 0) AS total_capital,
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
            $unwithdrawn = max(0, $allProf - $withdrawn);
            $totalBalance = $cap + $unwithdrawn;

            // যারা সব টাকা তুলে নিয়েছে (ব্যালেন্স ০), তাদের লিস্টে দেখানোর দরকার নেই
            if ($totalBalance <= 0.001) {
                continue;
            }

            $investorsList[] = [
                'investor_id'            => (int)$inv['investor_id'],
                'investor_name'          => $inv['investor_name'] ?: 'অজ্ঞাত ইনভেস্টর',
                'investor_mobile'        => $inv['investor_mobile'] ?: '',
                'total_cards'            => (int)$inv['total_cards'],
                'total_capital'          => $cap,
                'total_all_time_profit'  => $allProf,
                'total_withdrawn'        => $withdrawn,
                'unwithdrawn_profit'     => $unwithdrawn,
                'total_balance'          => $totalBalance
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
            "cash_surplus_after_all_claims"  => $cashSurplusAfterAllClaims,
            "capital_coverage_percent"       => $capitalCoveragePercent,
            "net_capital_surplus"            => $netCapitalSurplus,

            // DYNAMIC SCENARIOS
            "scenarios" => [
                "scenario_1" => [
                    "expense_injected"          => $totalExpenses,
                    "new_total_cash"            => $s1NewCash,
                    "investor_claim"            => $invTotalRemainingClaim,
                    "company_claim"             => $companyTotalRemainingClaim,
                    "admin_surplus_cash"        => $s1SurplusForAdmin
                ],
                "scenario_2" => [
                    "current_cash"              => $netCash,
                    "investor_claim"            => $invTotalRemainingClaim,
                    "admin_remaining_cash"      => $s2RemainingCashForAdmin,
                    "company_claims_on_paper"   => $companyTotalRemainingClaim,
                    "expense_covered_by_company"=> $s2ExpenseCoveredByCompany
                ]
            ],

            // INVESTORS 3 STAGES
            "investor_stages" => [
                "all_time" => [
                    "cards"   => $invAllCards,
                    "count"   => $invAllCount,
                    "capital" => $invAllCapital,
                    "profit"  => $invAllProfit
                ],
                "withdrawn" => [
                    "cards"           => $invWithdrawnCards,
                    "count"           => $invWithdrawnCount,
                    "capital"         => $invWithdrawnCapital,
                    "profit"          => $invWithdrawnProfit,
                    "total_withdrawn" => $invTotalWithdrawn
                ],
                "remaining" => [
                    "cards"       => $invRemainingCards,
                    "count"       => $invRemainingCount,
                    "capital"     => $invRemainingCapital,
                    "profit"      => $invRemainingProfit,
                    "total_claim" => $invTotalRemainingClaim
                ]
            ],

            // COMPANY 3 CARDS 3 STAGES
            "company_stages" => [
                "all_time" => [
                    "cards"   => 3,
                    "capital" => $companyTotalCapital,
                    "profit"  => $companyTotalLifetimeProfit
                ],
                "withdrawn" => [
                    "cards"           => 0,
                    "capital"         => 0.0,
                    "profit"          => 0.0,
                    "total_withdrawn" => 0.0
                ],
                "remaining" => [
                    "cards"       => 3,
                    "capital"     => $companyRemainingCapital,
                    "profit"      => $companyRemainingProfit,
                    "total_claim" => $companyTotalRemainingClaim
                ]
            ],

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
