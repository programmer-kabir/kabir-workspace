<?php
// profile.php - User Profile Settings & Avatar Upload
require_once __DIR__ . '/includes/auth.php';
requireLogin();

$db = getDBConnection();
$userId = $_SESSION['user_id'];

$successMsg = '';
$errorMsg = '';

// Handle Profile Form Submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'update_avatar') {
        $avatarPath = null;

        // 1. Check if a local file was uploaded
        if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['avatar_file'];
            $fileTmp = $file['tmp_name'];
            $fileSize = $file['size'];
            $fileName = $file['name'];
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

            // Validate File Size (Max 5MB)
            if ($fileSize > 5 * 1024 * 1024) {
                $errorMsg = 'Image file size must be less than 5MB.';
            } elseif (!in_array($fileExt, $allowedExts)) {
                $errorMsg = 'Invalid file format. Allowed formats: JPG, PNG, WEBP, GIF.';
            } else {
                // Validate MIME type
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $fileTmp);
                finfo_close($finfo);

                if (!in_array($mimeType, $allowedMimes)) {
                    $errorMsg = 'Uploaded file is not a valid image.';
                } else {
                    $uploadDir = __DIR__ . '/assets/uploads/avatars/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }

                    $newFilename = 'avatar_' . $userId . '_' . time() . '.' . $fileExt;
                    $targetPath = $uploadDir . $newFilename;

                    if (move_uploaded_file($fileTmp, $targetPath)) {
                        $avatarPath = url('assets/uploads/avatars/' . $newFilename);
                    } else {
                        $errorMsg = 'Failed to save uploaded image on server.';
                    }
                }
            }
        } 
        // 2. Or fallback to Image URL if provided
        elseif (!empty($_POST['avatar_url'])) {
            $inputUrl = trim($_POST['avatar_url']);
            if (filter_var($inputUrl, FILTER_VALIDATE_URL) && preg_match('/^https?:\/\//i', $inputUrl)) {
                $avatarPath = $inputUrl;
            } else {
                $errorMsg = 'Please enter a valid image URL (e.g. https://example.com/photo.jpg).';
            }
        } else {
            $errorMsg = 'Please select an image file to upload or enter a picture URL.';
        }

        // Save to Database
        if ($avatarPath && empty($errorMsg)) {
            $stmt = $db->prepare("UPDATE members SET avatar = :avatar WHERE id = :id");
            $stmt->execute(['avatar' => $avatarPath, 'id' => $userId]);
            $_SESSION['user_name'] = $_SESSION['user_name']; // keep session alive
            $successMsg = 'Profile picture updated successfully!';
        }
    } 
    elseif ($action === 'update_info') {
        $nid = trim($_POST['nid_number'] ?? '');
        $nomineeName = trim($_POST['nominee_name'] ?? '');
        $nomineePhone = trim($_POST['nominee_phone'] ?? '');

        $stmt = $db->prepare("
            UPDATE members 
            SET nid_number = :nid, nominee_name = :nname, nominee_phone = :nphone 
            WHERE id = :id
        ");
        $stmt->execute([
            'nid'    => $nid,
            'nname'  => $nomineeName,
            'nphone' => $nomineePhone,
            'id'     => $userId
        ]);
        $successMsg = 'Personal and nominee information updated successfully.';
    } 
    elseif ($action === 'change_password') {
        $currentPass = $_POST['current_password'] ?? '';
        $newPass     = $_POST['new_password'] ?? '';
        $confirmPass = $_POST['confirm_password'] ?? '';

        $stmt = $db->prepare("SELECT password_hash FROM members WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $userPass = $stmt->fetchColumn();

        if (!$userPass || !password_verify($currentPass, $userPass)) {
            $errorMsg = 'Current password is incorrect.';
        } elseif (strlen($newPass) < 6) {
            $errorMsg = 'New password must be at least 6 characters long.';
        } elseif ($newPass !== $confirmPass) {
            $errorMsg = 'New password and confirm password do not match.';
        } else {
            $newHash = password_hash($newPass, PASSWORD_DEFAULT);
            $stmtUp = $db->prepare("UPDATE members SET password_hash = :hash WHERE id = :id");
            $stmtUp->execute(['hash' => $newHash, 'id' => $userId]);
            $successMsg = 'Password changed successfully.';
        }
    }
}

// Fetch fresh user record
$user = getCurrentUser();
$pageTitle = 'Profile Settings';
require_once __DIR__ . '/includes/header.php';
?>

<div style="max-width: 900px; margin: 0 auto;">
    
    <!-- Page Header -->
    <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-user-gear" style="color: var(--accent-gold);"></i> Profile Settings & Avatar Upload
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            Manage your profile picture, nominee details, and account security.
        </p>
    </div>

    <!-- Alert Messages -->
    <?php if ($successMsg): ?>
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6EE7B7; padding: 0.9rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-circle-check" style="font-size: 1.2rem;"></i> <?= htmlspecialchars($successMsg) ?>
        </div>
    <?php endif; ?>

    <?php if ($errorMsg): ?>
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; padding: 0.9rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 1.2rem;"></i> <?= htmlspecialchars($errorMsg) ?>
        </div>
    <?php endif; ?>

    <!-- Main Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1.8fr; gap: 2rem;">
        
        <!-- LEFT: Profile Picture Card -->
        <div class="glass-panel" style="padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.5rem;">
                Profile Picture
            </h3>

            <!-- Avatar Preview Box -->
            <div style="position: relative; width: 140px; height: 140px; margin-bottom: 1.5rem;">
                <img id="avatarPreview" src="<?= htmlspecialchars(!empty($user['avatar']) ? $user['avatar'] : 'https://ui-avatars.com/api/?name='.urlencode($user['name']).'&size=140&background=F59E0B&color=fff') ?>" alt="Profile Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid var(--accent-gold); box-shadow: 0 0 25px rgba(245, 158, 11, 0.3);">
                
                <label for="avatar_file_input" style="position: absolute; bottom: 4px; right: 4px; background: var(--accent-gold); color: #000; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: transform 0.2s;" title="Upload New Photo">
                    <i class="fa-solid fa-camera" style="font-size: 1rem;"></i>
                </label>
            </div>

            <div style="font-weight: 700; font-size: 1.1rem; color: #FFF;"><?= htmlspecialchars($user['name']) ?></div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;"><?= htmlspecialchars($user['phone']) ?></div>
            <div style="margin-top: 0.5rem;"><span class="badge badge-gold"><?= ucfirst($user['role']) ?></span></div>

            <form method="POST" action="" enctype="multipart/form-data" style="width: 100%; margin-top: 1.75rem; text-align: left;">
                <input type="hidden" name="action" value="update_avatar">

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.4rem;">
                        <i class="fa-solid fa-upload" style="color: var(--accent-gold);"></i> Upload File from Device:
                    </label>
                    <input type="file" id="avatar_file_input" name="avatar_file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="previewFile(this)" class="glass-panel" style="width: 100%; padding: 0.5rem; font-size: 0.8rem; color: var(--text-muted); border-radius: 8px;">
                </div>

                <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin: 0.75rem 0;">&mdash; OR PASTE IMAGE URL &mdash;</div>

                <div style="margin-bottom: 1.25rem;">
                    <input type="url" name="avatar_url" id="avatar_url_input" placeholder="https://example.com/photo.jpg" oninput="previewUrl(this.value)" class="glass-panel" style="width: 100%; padding: 0.6rem; font-size: 0.85rem; color: #FFF; border-radius: 8px;">
                </div>

                <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
                    <i class="fa-solid fa-floppy-disk"></i> Save New Avatar
                </button>
            </form>
        </div>

        <!-- RIGHT: Personal Info & Security -->
        <div style="display: flex; flex-direction: column; gap: 2rem;">
            
            <!-- Panel 1: Personal & Nominee Info -->
            <div class="glass-panel" style="padding: 1.75rem;">
                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-id-card" style="color: var(--accent-emerald);"></i> Personal & Nominee Details
                </h3>

                <form method="POST" action="">
                    <input type="hidden" name="action" value="update_info">

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">Full Name</label>
                            <input type="text" value="<?= htmlspecialchars($user['name']) ?>" disabled class="glass-panel" style="width: 100%; padding: 0.65rem; color: #9CA3AF; border-radius: 8px; background: rgba(0,0,0,0.3); cursor: not-allowed;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">Phone Number (Login ID)</label>
                            <input type="text" value="<?= htmlspecialchars($user['phone']) ?>" disabled class="glass-panel" style="width: 100%; padding: 0.65rem; color: #9CA3AF; border-radius: 8px; background: rgba(0,0,0,0.3); cursor: not-allowed;">
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">National ID (NID) Number</label>
                        <input type="text" name="nid_number" value="<?= htmlspecialchars($user['nid_number'] ?? '') ?>" placeholder="e.g. 1990123456789" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">Nominee Name</label>
                            <input type="text" name="nominee_name" value="<?= htmlspecialchars($user['nominee_name'] ?? '') ?>" placeholder="Nominee Full Name" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">Nominee Phone Number</label>
                            <input type="text" name="nominee_phone" value="<?= htmlspecialchars($user['nominee_phone'] ?? '') ?>" placeholder="01700000000" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
                        </div>
                    </div>

                    <button type="submit" class="btn-emerald">
                        <i class="fa-solid fa-user-check"></i> Update Personal Info
                    </button>
                </form>
            </div>

            <!-- Panel 2: Change Password -->
            <div class="glass-panel" style="padding: 1.75rem;">
                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-key" style="color: var(--accent-rose);"></i> Security & Password Update
                </h3>

                <form method="POST" action="">
                    <input type="hidden" name="action" value="change_password">

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">Current Password</label>
                        <input type="password" name="current_password" required placeholder="Enter current password" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">New Password</label>
                            <input type="password" name="new_password" required placeholder="Min 6 characters" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.35rem;">Confirm New Password</label>
                            <input type="password" name="confirm_password" required placeholder="Re-type new password" class="glass-panel" style="width: 100%; padding: 0.65rem; color: #FFF; border-radius: 8px;">
                        </div>
                    </div>

                    <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #EF4444, #B91C1C);">
                        <i class="fa-solid fa-shield-halved"></i> Update Password
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
function previewFile(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarPreview').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function previewUrl(url) {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        document.getElementById('avatarPreview').src = url;
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
