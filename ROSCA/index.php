<?php
// index.php - Modern Login Page
require_once __DIR__ . '/includes/auth.php';

if (isLoggedIn()) {
    if (isAdmin()) {
        header("Location: " . url('admin/dashboard.php'));
    } else {
        header("Location: " . url('member/dashboard.php'));
    }
    exit();
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($phone) || empty($password)) {
        $error = 'Please enter both phone number and password.';
    } else {
        if (loginUser($phone, $password)) {
            if (isAdmin()) {
                header("Location: " . url('admin/dashboard.php'));
            } else {
                header("Location: " . url('member/dashboard.php'));
            }
            exit();
        } else {
            $error = 'Invalid phone number or password. Please try again.';
        }
    }
}

$pageTitle = 'Member Login';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member Login | ROSCA Committee</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-dark: #090D16;
            --bg-card: rgba(17, 24, 39, 0.8);
            --accent-gold: #F59E0B;
            --accent-emerald: #10B981;
            --text-main: #F9FAFB;
            --text-muted: #9CA3AF;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }

        body {
            background-color: var(--bg-dark);
            background-image: 
                radial-gradient(at 10% 20%, rgba(245, 158, 11, 0.12) 0px, transparent 50%),
                radial-gradient(at 90% 80%, rgba(99, 102, 241, 0.12) 0px, transparent 50%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }

        .login-card {
            width: 100%;
            max-width: 440px;
            background: var(--bg-card);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .brand-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .brand-icon {
            width: 64px;
            height: 64px;
            background: rgba(245, 158, 11, 0.15);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            color: var(--accent-gold);
            font-size: 1.75rem;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
        }

        .brand-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--text-main);
        }

        .brand-desc {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
        }

        .form-group {
            margin-bottom: 1.25rem;
        }

        .form-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }

        .input-group {
            position: relative;
        }

        .input-group i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }

        .form-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            padding: 0.75rem 1rem 0.75rem 2.75rem;
            color: #FFF;
            font-size: 0.95rem;
            transition: border 0.2s;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
        }

        .btn-submit {
            width: 100%;
            background: linear-gradient(135deg, var(--accent-gold), #D97706);
            color: #000;
            font-weight: 700;
            font-size: 1rem;
            border: none;
            padding: 0.85rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 0.5rem;
        }

        .btn-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
        }

        .error-alert {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #FCA5A5;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            font-size: 0.85rem;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .quick-presets {
            margin-top: 1.75rem;
            padding-top: 1.5rem;
            border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .quick-title {
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.75rem;
            text-align: center;
        }

        .preset-btn {
            width: 100%;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: var(--text-main);
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background 0.2s;
        }

        .preset-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>

<div class="login-card">
    <div class="brand-header">
        <div class="brand-icon">
            <i class="fa-solid fa-coins"></i>
        </div>
        <h1 class="brand-title">ROSCA Portal</h1>
        <p class="brand-desc">10-Member Daily Savings & Lottery Association</p>
    </div>

    <?php if ($error): ?>
        <div class="error-alert">
            <i class="fa-solid fa-circle-exclamation"></i>
            <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <div class="form-group">
            <label class="form-label">Phone Number (Login ID)</label>
            <div class="input-group">
                <i class="fa-solid fa-phone"></i>
                <input type="text" id="phone" name="phone" class="form-input" placeholder="e.g. 01700000002" required value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>">
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-group">
                <i class="fa-solid fa-lock"></i>
                <input type="password" id="password" name="password" class="form-input" placeholder="Enter your password" required value="123456">
            </div>
        </div>

        <button type="submit" class="btn-submit">
            <i class="fa-solid fa-right-to-bracket"></i> Sign In to Portal
        </button>
    </form>

    <div class="quick-presets">
        <div class="quick-title"><i class="fa-solid fa-key"></i> Quick Demo Login Presets</div>
        <button type="button" class="preset-btn" onclick="setCredentials('01700000001', '123456')">
            <span><i class="fa-solid fa-user-shield" style="color: var(--accent-gold);"></i> <strong>Shahriar Rubel</strong> (Admin/Cashier)</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">01700000001</span>
        </button>
        <button type="button" class="preset-btn" onclick="setCredentials('01700000002', '123456')">
            <span><i class="fa-solid fa-user" style="color: var(--accent-emerald);"></i> <strong>Shukur Ali</strong> (Member)</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">01700000002</span>
        </button>
    </div>
</div>

<script>
function setCredentials(phone, password) {
    document.getElementById('phone').value = phone;
    document.getElementById('password').value = password;
}
</script>

</body>
</html>
