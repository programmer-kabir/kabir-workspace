<?php
// admin/reports.php - Financial Audit Reports & Statements (No Penalty / Halal)
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDBConnection();

// Summary statistics
$stmtMembers = $db->query("
    SELECT 
        m.id, 
        m.name, 
        m.phone, 
        m.role,
        m.is_payout_taken,
        m.payout_month,
        COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END), 0.00) AS total_contributed,
        COALESCE(SUM(CASE WHEN c.status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_days,
        COALESCE(SUM(CASE WHEN c.status = 'due' THEN 1 ELSE 0 END), 0) AS due_days
    FROM members m
    LEFT JOIN daily_collections c ON m.id = c.member_id
    GROUP BY m.id
    ORDER BY m.id ASC
")->fetchAll();

$grandTotalContributed = 0.00;

foreach ($stmtMembers as $sm) {
    $grandTotalContributed += floatval($sm['total_contributed']);
}

$stmtDisbursed = $db->query("SELECT COALESCE(SUM(amount_paid), 0.00) FROM monthly_payouts");
$totalDisbursed = floatval($stmtDisbursed->fetchColumn());
$netVaultBalance = $grandTotalContributed - $totalDisbursed;

$pageTitle = 'Financial Audit Reports';
require_once __DIR__ . '/../includes/header.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
        <h1 style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-file-invoice-dollar" style="color: var(--accent-gold);"></i> Financial Audit & Reports
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            Comprehensive member contribution audit and committee balance ledger.
        </p>
    </div>

    <button type="button" class="btn-primary" onclick="window.print()">
        <i class="fa-solid fa-print"></i> Print Financial Statement
    </button>
</div>

<!-- Summary Box Cards -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Total Collected Fund</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-emerald); margin-top: 0.35rem;">
            ৳ <?= number_format($grandTotalContributed, 2) ?>
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Total Disbursed Payouts</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-rose); margin-top: 0.35rem;">
            ৳ <?= number_format($totalDisbursed, 2) ?>
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Net Vault Cash Balance</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.35rem;">
            ৳ <?= number_format($netVaultBalance, 2) ?>
        </div>
    </div>
</div>

<!-- Member Audit Table -->
<div class="glass-panel" style="padding: 1.75rem; margin-bottom: 2rem;">
    <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem;">
        10-Member Contribution Audit Matrix
    </h3>

    <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
                <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <th style="padding: 1rem; color: var(--text-muted);">ID</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Member Name</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Phone (Login)</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Days Paid</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Days Due</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Total Contributed</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Payout Status</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($stmtMembers as $m): ?>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 1rem; font-weight: 700;">#<?= $m['id'] ?></td>
                        <td style="padding: 1rem; font-weight: 700; color: #FFF;"><?= htmlspecialchars($m['name']) ?></td>
                        <td style="padding: 1rem; color: var(--text-muted);"><?= htmlspecialchars($m['phone']) ?></td>
                        <td style="padding: 1rem; color: var(--accent-emerald); font-weight: 600;"><?= $m['paid_days'] ?> Days</td>
                        <td style="padding: 1rem; color: var(--accent-rose); font-weight: 600;"><?= $m['due_days'] ?> Days</td>
                        <td style="padding: 1rem; font-weight: 700; color: var(--accent-gold);">৳ <?= number_format($m['total_contributed'], 2) ?></td>
                        <td style="padding: 1rem;">
                            <?php if ($m['is_payout_taken']): ?>
                                <span class="badge badge-gold">Paid: <?= htmlspecialchars($m['payout_month']) ?></span>
                            <?php else: ?>
                                <span class="badge badge-paid">Eligible</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
