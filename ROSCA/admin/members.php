<?php
// admin/members.php - Manage 10 Members & Nominees
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDBConnection();
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_member') {
    if (!isAdmin()) {
        die("Unauthorized access.");
    }
    $memberId = intval($_POST['member_id']);
    $nidNumber = trim($_POST['nid_number'] ?? '');
    $nomineeName = trim($_POST['nominee_name'] ?? '');
    $nomineePhone = trim($_POST['nominee_phone'] ?? '');
    $avatar = trim($_POST['avatar'] ?? '');
    if (!empty($avatar) && (!filter_var($avatar, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $avatar))) {
        $avatar = '';
    }

    $stmtUpdate = $db->prepare("
        UPDATE members 
        SET nid_number = :nid, nominee_name = :nname, nominee_phone = :nphone, avatar = :avatar 
        WHERE id = :id
    ");
    $stmtUpdate->execute([
        'nid'    => $nidNumber,
        'nname'  => $nomineeName,
        'nphone' => $nomineePhone,
        'avatar' => $avatar,
        'id'     => $memberId
    ]);

    $message = "Member #{$memberId} details updated successfully.";
}

$members = $db->query("SELECT * FROM members ORDER BY id ASC")->fetchAll();

$pageTitle = 'Member Directory & Nominees';
require_once __DIR__ . '/../includes/header.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
    <div>
        <h1 style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-users" style="color: var(--accent-gold);"></i> 10-Member Directory & Nominees
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            View official NID, nominee information, profile pictures, and payout status.
        </p>
    </div>
</div>

<?php if ($message): ?>
    <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6EE7B7; padding: 0.85rem 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <i class="fa-solid fa-circle-check"></i> <?= htmlspecialchars($message) ?>
    </div>
<?php endif; ?>

<div class="glass-panel" style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
        <thead>
            <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">ID</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">Photo</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">Member Name</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">Role</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">Phone (Login)</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">NID Number</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">Nominee Details</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted);">Payout Status</th>
                <th style="padding: 1rem 1.25rem; color: var(--text-muted); text-align: right;">Action</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($members as $m): ?>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--text-muted);">#<?= $m['id'] ?></td>
                    <td style="padding: 1rem 1.25rem;">
                        <img src="<?= htmlspecialchars($m['avatar'] ?: 'https://ui-avatars.com/api/?name='.urlencode($m['name'])) ?>" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-gold);">
                    </td>
                    <td style="padding: 1rem 1.25rem; font-weight: 700; color: #FFF;"><?= htmlspecialchars($m['name']) ?></td>
                    <td style="padding: 1rem 1.25rem;">
                        <?php if ($m['role'] === 'admin'): ?>
                            <span class="badge badge-gold">Cashier Admin</span>
                        <?php else: ?>
                            <span class="badge badge-paid">General Member</span>
                        <?php endif; ?>
                    </td>
                    <td style="padding: 1rem 1.25rem; color: var(--text-muted);"><?= htmlspecialchars($m['phone']) ?></td>
                    <td style="padding: 1rem 1.25rem; font-family: monospace; color: var(--accent-gold);"><?= htmlspecialchars($m['nid_number'] ?? 'Not set') ?></td>
                    <td style="padding: 1rem 1.25rem;">
                        <div style="font-weight: 600;"><?= htmlspecialchars($m['nominee_name'] ?? 'Not set') ?></div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($m['nominee_phone'] ?? '') ?></div>
                    </td>
                    <td style="padding: 1rem 1.25rem;">
                        <?php if ($m['is_payout_taken']): ?>
                            <span class="badge badge-gold"><i class="fa-solid fa-check"></i> Paid: <?= htmlspecialchars($m['payout_month']) ?></span>
                        <?php else: ?>
                            <span class="badge badge-paid"><i class="fa-solid fa-clock"></i> Eligible for Draw</span>
                        <?php endif; ?>
                    </td>
                    <td style="padding: 1rem 1.25rem; text-align: right;">
                        <?php if (isAdmin()): ?>
                            <button type="button" class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick='openEditModal(<?= json_encode($m) ?>)'>
                                <i class="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                        <?php else: ?>
                            <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-solid fa-eye" style="margin-right: 0.25rem;"></i> View Only</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- Edit Member Modal -->
<div id="edit-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 9999; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="glass-panel" style="width: 100%; max-width: 480px; padding: 2rem; position: relative;">
        <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem;" id="modal-member-name">
            Edit Member Info
        </h3>

        <form method="POST" action="">
            <input type="hidden" name="action" value="update_member">
            <input type="hidden" name="member_id" id="edit-member-id">

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">Profile Picture Image URL</label>
                <input type="url" name="avatar" id="edit-avatar" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;" placeholder="https://example.com/photo.jpg">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">National ID (NID) Number</label>
                <input type="text" name="nid_number" id="edit-nid" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">Nominee Name</label>
                <input type="text" name="nominee_name" id="edit-nominee-name" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">Nominee Phone Number</label>
                <input type="text" name="nominee_phone" id="edit-nominee-phone" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button type="button" onclick="closeEditModal()" style="background: rgba(255,255,255,0.1); border: none; color: #FFF; padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer;">Cancel</button>
                <button type="submit" class="btn-emerald"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
            </div>
        </form>
    </div>
</div>

<script>
function openEditModal(member) {
    document.getElementById('edit-member-id').value = member.id;
    document.getElementById('modal-member-name').innerText = "Edit Member: " + member.name;
    document.getElementById('edit-avatar').value = member.avatar || '';
    document.getElementById('edit-nid').value = member.nid_number || '';
    document.getElementById('edit-nominee-name').value = member.nominee_name || '';
    document.getElementById('edit-nominee-phone').value = member.nominee_phone || '';
    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
