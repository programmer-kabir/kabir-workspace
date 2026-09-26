<?php
// member/dashboard.php - Transparency Member Passbook & Ledger (No Penalty / Halal)
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDBConnection();
$userId = $_SESSION['user_id'];

// Fetch logged-in member details
$stmtUser = $db->prepare("SELECT * FROM members WHERE id = :id LIMIT 1");
$stmtUser->execute(['id' => $userId]);
$member = $stmtUser->fetch();

// Fetch personal daily collection statistics
$stmtStats = $db->prepare("
    SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_days,
        COUNT(CASE WHEN status = 'due' THEN 1 END) AS due_days,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0.00) AS total_paid_amount
    FROM daily_collections 
    WHERE member_id = :member_id
");
$stmtStats->execute(['member_id' => $userId]);
$stats = $stmtStats->fetch();

// Fetch committee-wide total pool collected
$stmtCommittee = $db->query("
    SELECT COALESCE(SUM(amount), 0.00) FROM daily_collections WHERE status = 'paid'
");
$totalCommitteePool = floatval($stmtCommittee->fetchColumn());

// Fetch current payout history list
$payoutHistory = $db->query("
    SELECT p.*, m.name AS winner_name, m.phone AS winner_phone 
    FROM monthly_payouts p 
    JOIN members m ON p.recipient_member_id = m.id 
    ORDER BY p.month_cycle ASC
")->fetchAll();

// Fetch member's daily collection ledger history
$stmtLedger = $db->prepare("
    SELECT c.*, cashier.name AS cashier_name 
    FROM daily_collections c 
    LEFT JOIN members cashier ON c.collected_by = cashier.id 
    WHERE c.member_id = :member_id 
    ORDER BY c.collection_date DESC
");
$stmtLedger->execute(['member_id' => $userId]);
$ledgerEntries = $stmtLedger->fetchAll();

$pageTitle = 'Member Passbook';
require_once __DIR__ . '/../includes/header.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
        <h1 style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-book-open" style="color: var(--accent-gold);"></i> Member Savings Passbook
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            Welcome back, <strong><?= htmlspecialchars($member['name']) ?></strong>! Here is your complete financial ledger.
        </p>
    </div>

    <div>
        <?php if ($member['is_payout_taken']): ?>
            <span class="badge badge-gold" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                <i class="fa-solid fa-trophy"></i> Payout Assigned: <?= htmlspecialchars($member['payout_month']) ?> (৳ 3,00,000)
            </span>
        <?php else: ?>
            <span class="badge badge-paid" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                <i class="fa-solid fa-clover"></i> Status: Eligible for Upcoming Lottery Draw
            </span>
        <?php endif; ?>
    </div>
</div>

<!-- Personal Passbook Metric Cards -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
    <div class="glass-panel" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Total Amount Paid</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-emerald); margin-top: 0.35rem;">
            ৳ <?= number_format($stats['total_paid_amount'], 2) ?>
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Contribution Days</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin-top: 0.35rem;">
            <span style="color: var(--accent-emerald);"><?= $stats['paid_days'] ?> Paid</span> / <span style="color: var(--accent-rose);"><?= $stats['due_days'] ?> Due</span>
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Committee Total Pool</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.35rem;">
            ৳ <?= number_format($totalCommitteePool, 2) ?>
        </div>
    </div>
</div>

<!-- Personal Ledger & Committee Transparency Grid -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem;">
    
    <!-- Left: Personal Collection Ledger -->
    <div class="glass-panel" style="padding: 1.75rem;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-list-check" style="color: var(--accent-gold);"></i> Daily Contribution Timeline
        </h3>

        <?php if (empty($ledgerEntries)): ?>
            <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
                <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.4;"></i>
                <p>No daily payment entries recorded yet.</p>
            </div>
        <?php else: ?>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <th style="padding: 0.85rem; color: var(--text-muted);">Date</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Amount</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Status</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Cashier</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($ledgerEntries as $entry): ?>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.85rem; font-weight: 600;"><?= date('d M Y', strtotime($entry['collection_date'])) ?></td>
                                <td style="padding: 0.85rem; font-weight: 700; color: var(--accent-gold);">৳ <?= number_format($entry['amount'], 2) ?></td>
                                <td style="padding: 0.85rem;">
                                    <?php if ($entry['status'] === 'paid'): ?>
                                        <span class="badge badge-paid">Paid</span>
                                    <?php else: ?>
                                        <span class="badge badge-due">Due</span>
                                    <?php endif; ?>
                                </td>
                                <td style="padding: 0.85rem; color: var(--text-muted);"><?= htmlspecialchars($entry['cashier_name'] ?? 'System') ?></td>
                                <td style="padding: 0.85rem; color: var(--text-muted); font-size: 0.85rem;"><?= htmlspecialchars($entry['notes'] ?? '-') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <!-- Right: Committee Payout Transparency -->
    <div class="glass-panel" style="padding: 1.75rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-eye" style="color: var(--accent-emerald);"></i> Committee Payout Audit
        </h3>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <?php foreach ($payoutHistory as $ph): ?>
                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 1rem; border-radius: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">
                        <span>MONTH <?= $ph['month_cycle'] ?> (<?= htmlspecialchars($ph['month_name']) ?>)</span>
                        <span>৳ 3,00,000</span>
                    </div>
                    <div style="font-size: 1rem; font-weight: 700; color: #FFF; margin-top: 0.35rem;">
                        <?= htmlspecialchars($ph['winner_name']) ?>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                        Method: <?= ucfirst($ph['selection_type']) ?> &bull; Disbursed: <?= date('d M Y', strtotime($ph['distribution_date'])) ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
