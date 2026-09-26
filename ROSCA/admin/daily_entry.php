<?php
// admin/daily_entry.php - Cashier Daily Collection Matrix
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$selectedDate = $_GET['date'] ?? date('Y-m-d');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $selectedDate) || strtotime($selectedDate) === false) {
    $selectedDate = date('Y-m-d');
}

$db = getDBConnection();

// Fetch all 10 members with left join on daily_collections for selected date
$stmt = $db->prepare("
    SELECT 
        m.id, 
        m.name, 
        m.phone, 
        m.role,
        m.is_payout_taken,
        m.payout_month,
        COALESCE(c.status, 'due') AS status,
        COALESCE(c.amount, 1000.00) AS amount,
        c.notes,
        c.created_at AS entry_time
    FROM members m
    LEFT JOIN daily_collections c ON m.id = c.member_id AND c.collection_date = :selected_date
    ORDER BY m.id ASC
");
$stmt->execute(['selected_date' => $selectedDate]);
$matrixRows = $stmt->fetchAll();

// Calculations for top summary bar
$paidCount = 0;
$dueCount = 0;
$totalCollected = 0.00;

foreach ($matrixRows as $row) {
    if ($row['status'] === 'paid') {
        $paidCount++;
        $totalCollected += floatval($row['amount']);
    } else {
        $dueCount++;
    }
}

$pageTitle = 'Cashier Daily Collection Matrix';
require_once __DIR__ . '/../includes/header.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
        <h1 style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-calendar-check" style="color: var(--accent-gold);"></i> Cashier Collection Matrix
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            Manage 10-member daily contributions (৳ 1,000 / member) with instant status updates.
        </p>
    </div>

    <!-- Date Picker Form -->
    <form method="GET" action="" style="display: flex; align-items: center; gap: 0.75rem;">
        <label style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Collection Date:</label>
        <input type="date" name="date" value="<?= htmlspecialchars($selectedDate) ?>" onchange="this.form.submit()" class="glass-panel" style="padding: 0.5rem 0.85rem; color: #FFF; border-radius: 8px; font-size: 0.9rem;">
    </form>
</div>

<!-- Summary Cards Grid -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
    <div class="glass-panel" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Selected Date</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--accent-gold); margin-top: 0.35rem;">
            <?= date('D, d M Y', strtotime($selectedDate)) ?>
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Collection Status</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin-top: 0.35rem;">
            <span style="color: var(--accent-emerald);"><?= $paidCount ?> Paid</span> / <span style="color: var(--accent-rose);"><?= $dueCount ?> Due</span>
        </div>
    </div>

    <div class="glass-panel" style="padding: 1.25rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Daily Fund Collected</div>
        <div style="font-size: 1.4rem; font-weight: 700; color: var(--accent-emerald); margin-top: 0.35rem;">
            ৳ <?= number_format($totalCollected, 2) ?> <span style="font-size: 0.85rem; color: var(--text-muted);">/ ৳ 10,000</span>
        </div>
    </div>
</div>

<!-- Matrix Table -->
<div class="glass-panel" style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
        <thead>
            <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600;">ID</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600;">Member Name</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600;">Phone (Login)</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600;">Daily Amount</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600;">Payment Status</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600;">Notes</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); font-weight: 600; text-align: right;">Action</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($matrixRows as $m): ?>
                <tr id="row-<?= $m['id'] ?>" style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
                    <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--text-muted);">#<?= $m['id'] ?></td>
                    <td style="padding: 1rem 1.25rem; font-weight: 600;">
                        <?= htmlspecialchars($m['name']) ?>
                        <?php if ($m['role'] === 'admin'): ?>
                            <span class="badge badge-gold" style="font-size: 0.65rem; margin-left: 0.35rem;">Admin</span>
                        <?php endif; ?>
                    </td>
                    <td style="padding: 1rem 1.25rem; color: var(--text-muted);"><?= htmlspecialchars($m['phone']) ?></td>
                    <td style="padding: 1rem 1.25rem; font-weight: 600; color: var(--accent-gold);">৳ <?= number_format($m['amount'], 2) ?></td>
                    <td style="padding: 1rem 1.25rem;">
                        <?php if (isAdmin()): ?>
                            <select id="status-<?= $m['id'] ?>" onchange="updateSingleEntry(<?= $m['id'] ?>)" class="glass-panel" style="padding: 0.4rem 0.75rem; color: #FFF; border-radius: 6px; font-weight: 600; cursor: pointer;">
                                <option value="paid" <?= $m['status'] === 'paid' ? 'selected' : '' ?> style="background: #111827; color: var(--accent-emerald);">Paid</option>
                                <option value="due" <?= $m['status'] === 'due' ? 'selected' : '' ?> style="background: #111827; color: var(--accent-rose);">Due</option>
                            </select>
                        <?php else: ?>
                            <?php if ($m['status'] === 'paid'): ?>
                                <span class="badge badge-paid"><i class="fa-solid fa-check"></i> Paid</span>
                            <?php else: ?>
                                <span class="badge badge-due"><i class="fa-solid fa-clock"></i> Due</span>
                            <?php endif; ?>
                        <?php endif; ?>
                    </td>
                    <td style="padding: 1rem 1.25rem;">
                        <?php if (isAdmin()): ?>
                            <input type="text" id="notes-<?= $m['id'] ?>" value="<?= htmlspecialchars($m['notes'] ?? '') ?>" placeholder="Optional notes..." onchange="updateSingleEntry(<?= $m['id'] ?>)" class="glass-panel" style="width: 100%; min-width: 160px; padding: 0.35rem 0.5rem; color: #FFF; border-radius: 6px;">
                        <?php else: ?>
                            <span style="color: var(--text-muted); font-size: 0.85rem;"><?= htmlspecialchars($m['notes'] ?? '-') ?></span>
                        <?php endif; ?>
                    </td>
                    <td style="padding: 1rem 1.25rem; text-align: right;">
                        <?php if (isAdmin()): ?>
                            <button type="button" onclick="updateSingleEntry(<?= $m['id'] ?>)" class="btn-emerald" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                                <i class="fa-solid fa-floppy-disk"></i> Save
                            </button>
                        <?php else: ?>
                            <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-lock" style="margin-right: 0.25rem;"></i> Read-Only</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<script>
const selectedDate = "<?= $selectedDate ?>";

function updateSingleEntry(memberId) {
    const status = document.getElementById(`status-${memberId}`).value;
    const notes = document.getElementById(`notes-${memberId}`).value;

    fetch("<?= url('api/quick_entry.php') ?>", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "single",
            member_id: memberId,
            collection_date: selectedDate,
            status: status,
            amount: 1000.00,
            notes: notes
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`Member #${memberId} updated to ${status.toUpperCase()}`, 'success');
        } else {
            showToast(data.message || 'Error updating entry.', 'error');
        }
    })
    .catch(err => {
        showToast('Network request failed.', 'error');
    });
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
