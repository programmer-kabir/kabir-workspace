<?php
// admin/dashboard.php - Cashier Overview & System Metrics
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDBConnection();

// Metrics calculations
$totalMembers = 10;
$stmtPool = $db->query("SELECT COALESCE(SUM(amount), 0.00) FROM daily_collections WHERE status = 'paid'");
$totalFundCollected = floatval($stmtPool->fetchColumn());

$stmtPayouts = $db->query("SELECT COUNT(*), COALESCE(SUM(amount_paid), 0.00) FROM monthly_payouts");
list($completedPayoutsCount, $totalDisbursed) = $stmtPayouts->fetch(PDO::FETCH_NUM);
$totalDisbursed = floatval($totalDisbursed);
$netVaultBalance = $totalFundCollected - $totalDisbursed;

$nextCycle = $completedPayoutsCount + 1;

// Recent Collections Log
$recentCollections = $db->query("
    SELECT c.*, m.name AS member_name 
    FROM daily_collections c 
    JOIN members m ON c.member_id = m.id 
    ORDER BY c.created_at DESC 
    LIMIT 6
")->fetchAll();

$pageTitle = 'Cashier Overview Dashboard';
require_once __DIR__ . '/../includes/header.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
        <h1 style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-chart-pie" style="color: var(--accent-gold);"></i> Cashier Overview & Control Panel
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            10-Member Daily ROSCA Financial Cycle (01 Sep 2026 – 30 Jun 2027)
        </p>
    </div>

    <div style="display: flex; gap: 0.75rem;">
        <a href="<?= url('admin/daily_entry.php') ?>" class="btn-primary">
            <i class="fa-solid fa-calendar-check"></i> 1-Click Collection Matrix
        </a>
        <a href="<?= url('admin/lottery.php') ?>" class="btn-emerald">
            <i class="fa-solid fa-clover"></i> Digital Lottery Draw
        </a>
    </div>
</div>

<!-- Core Financial Metric Cards -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
    
    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">
            <span>TOTAL FUND COLLECTED</span>
            <i class="fa-solid fa-vault" style="color: var(--accent-gold); font-size: 1.25rem;"></i>
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.5rem;">
            ৳ <?= number_format($totalFundCollected, 2) ?>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            Target Pool: ৳ 30,00,000 (10 Months)
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">
            <span>TOTAL DISBURSED</span>
            <i class="fa-solid fa-hand-holding-dollar" style="color: var(--accent-emerald); font-size: 1.25rem;"></i>
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-emerald); margin-top: 0.5rem;">
            ৳ <?= number_format($totalDisbursed, 2) ?>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            <?= $completedPayoutsCount ?> / 10 Monthly Payouts Completed
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">
            <span>NET VAULT BALANCE</span>
            <i class="fa-solid fa-scale-balanced" style="color: var(--accent-indigo); font-size: 1.25rem;"></i>
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent-indigo); margin-top: 0.5rem;">
            ৳ <?= number_format($netVaultBalance, 2) ?>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            Available Cash In Hand
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">
            <span>ROSTER CAPACITY</span>
            <i class="fa-solid fa-users" style="color: var(--text-muted); font-size: 1.25rem;"></i>
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-top: 0.5rem;">
            10 / 10 Members
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            1 Cashier Admin + 9 Members
        </div>
    </div>
</div>

<!-- Layout Grid: Quick Actions & Recent Log -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
    
    <!-- Left: Recent Collections Feed -->
    <div class="glass-panel" style="padding: 1.75rem;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-gold);"></i> Recent Collection Activity
        </h3>

        <?php if (empty($recentCollections)): ?>
            <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                No collection records logged yet. Go to <a href="<?= url('admin/daily_entry.php') ?>" style="color: var(--accent-gold);">Daily Matrix</a> to record payments.
            </div>
        <?php else: ?>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                    <thead>
                        <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <th style="padding: 0.85rem; color: var(--text-muted);">Member</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Collection Date</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Amount</th>
                            <th style="padding: 0.85rem; color: var(--text-muted);">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recentCollections as $rc): ?>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.85rem; font-weight: 600;"><?= htmlspecialchars($rc['member_name']) ?></td>
                                <td style="padding: 0.85rem; color: var(--text-muted);"><?= date('d M Y', strtotime($rc['collection_date'])) ?></td>
                                <td style="padding: 0.85rem; font-weight: 700; color: var(--accent-gold);">৳ <?= number_format($rc['amount'], 2) ?></td>
                                <td style="padding: 0.85rem;">
                                    <?php if ($rc['status'] === 'paid'): ?>
                                        <span class="badge badge-paid">Paid</span>
                                    <?php else: ?>
                                        <span class="badge badge-due">Due</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <!-- Right: Quick System Status -->
    <div class="glass-panel" style="padding: 1.75rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-shield-halved" style="color: var(--accent-emerald);"></i> System & Cycle Info
        </h3>

        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">CYCLE DURATION</div>
                <div style="font-weight: 700; color: #FFF; font-size: 0.95rem; margin-top: 0.25rem;">01 Sep 2026 to 30 Jun 2027</div>
            </div>

            <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">MONTH 1 PRE-ASSIGNED PAYOUT</div>
                <div style="font-weight: 700; color: var(--accent-gold); font-size: 0.95rem; margin-top: 0.25rem;">
                    Shahriar Rubel (Cashier Admin)
                </div>
            </div>

            <div>
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">DIGITAL LOTTERY POOL</div>
                <div style="font-weight: 700; color: var(--accent-emerald); font-size: 0.95rem; margin-top: 0.25rem;">
                    Months 2 to 10 (9 Remaining Draws)
                </div>
            </div>

            <div style="margin-top: 1rem;">
                <a href="<?= url('admin/reports.php') ?>" class="btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fa-solid fa-file-pdf"></i> Full Financial Audit Report
                </a>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
