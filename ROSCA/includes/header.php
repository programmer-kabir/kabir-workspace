<?php
// includes/header.php - Main UI Header & CSS Design System
require_once __DIR__ . '/auth.php';
$currentUser = getCurrentUser();
$pageTitle = $pageTitle ?? 'ROSCA Committee Management';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?> | ROSCA Committee</title>
    <!-- Google Fonts & Font Awesome Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --bg-dark: #090D16;
            --bg-card: rgba(17, 24, 39, 0.75);
            --bg-card-border: rgba(255, 255, 255, 0.08);
            --accent-gold: #F59E0B;
            --accent-gold-glow: rgba(245, 158, 11, 0.25);
            --accent-emerald: #10B981;
            --accent-emerald-glow: rgba(16, 185, 129, 0.2);
            --accent-rose: #EF4444;
            --accent-rose-glow: rgba(239, 68, 68, 0.2);
            --accent-indigo: #6366F1;
            --text-main: #F9FAFB;
            --text-muted: #9CA3AF;
            --font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: var(--font-family);
        }

        body {
            background-color: var(--bg-dark);
            background-image: 
                radial-gradient(at 0% 0%, rgba(245, 158, 11, 0.08) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 50%);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Glassmorphism utility */
        .glass-panel {
            background: var(--bg-card);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--bg-card-border);
            border-radius: 16px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        /* Navbar Styling */
        .navbar {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .nav-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0.85rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: var(--text-main);
            font-weight: 700;
            font-size: 1.25rem;
        }

        .brand-logo i {
            color: var(--accent-gold);
            font-size: 1.5rem;
            filter: drop-shadow(0 0 8px var(--accent-gold));
        }

        .brand-subtitle {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-weight: 400;
            display: block;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            list-style: none;
        }

        .nav-link {
            text-decoration: none;
            color: var(--text-muted);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-link:hover, .nav-link.active {
            color: #FFFFFF;
            background: rgba(255, 255, 255, 0.08);
        }

        .nav-link.active {
            color: var(--accent-gold);
            border-bottom: 2px solid var(--accent-gold);
        }

        .user-pill {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            padding: 0.35rem 0.85rem;
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-gold), #D97706);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: 700;
            font-size: 0.85rem;
        }

        .btn-logout {
            color: var(--accent-rose);
            text-decoration: none;
            font-size: 0.85rem;
            margin-left: 0.5rem;
            padding: 0.35rem 0.65rem;
            border-radius: 6px;
            transition: background 0.2s;
        }

        .btn-logout:hover {
            background: var(--accent-rose-glow);
        }

        /* Container Layout */
        .main-container {
            max-width: 1280px;
            margin: 2rem auto;
            padding: 0 1.5rem;
            flex: 1;
            width: 100%;
        }

        /* Custom Badges & Buttons */
        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .badge-paid {
            background: var(--accent-emerald-glow);
            color: var(--accent-emerald);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge-due {
            background: var(--accent-rose-glow);
            color: var(--accent-rose);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-gold {
            background: var(--accent-gold-glow);
            color: var(--accent-gold);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--accent-gold), #D97706);
            color: #000;
            font-weight: 600;
            border: none;
            padding: 0.65rem 1.25rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            box-shadow: 0 4px 14px 0 var(--accent-gold-glow);
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px 0 var(--accent-gold-glow);
        }

        .btn-emerald {
            background: linear-gradient(135deg, var(--accent-emerald), #059669);
            color: #FFF;
            font-weight: 600;
            border: none;
            padding: 0.65rem 1.25rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            box-shadow: 0 4px 14px 0 var(--accent-emerald-glow);
        }

        .btn-emerald:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px 0 var(--accent-emerald-glow);
        }
    </style>
</head>
<body>

<?php if ($currentUser): ?>
<nav class="navbar">
    <div class="nav-container">
        <a href="<?= isAdmin() ? url('admin/dashboard.php') : url('member/dashboard.php') ?>" class="brand-logo">
            <i class="fa-solid fa-coins"></i>
            <div>
                <span>ROSCA Management</span>
                <span class="brand-subtitle">10-Member Daily Samity</span>
            </div>
        </a>

        <ul class="nav-links">
            <li><a href="<?= url('admin/dashboard.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'admin/dashboard.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-chart-line"></i> Dashboard</a></li>
            <li><a href="<?= url('admin/daily_entry.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'admin/daily_entry.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-calendar-check"></i> Daily Matrix</a></li>
            <li><a href="<?= url('admin/lottery.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'admin/lottery.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-clover"></i> Digital Lottery</a></li>
            <li><a href="<?= url('admin/members.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'admin/members.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-users"></i> Members</a></li>
            <li><a href="<?= url('admin/reports.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'admin/reports.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-file-invoice-dollar"></i> Reports</a></li>
            <li><a href="<?= url('member/dashboard.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'member/dashboard.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-book-open"></i> Passbook</a></li>
            <li><a href="<?= url('profile.php') ?>" class="nav-link <?= strpos($_SERVER['SCRIPT_NAME'], 'profile.php') !== false ? 'active' : '' ?>"><i class="fa-solid fa-user-gear"></i> Profile</a></li>
        </ul>

        <div class="user-pill">
            <a href="<?= url('profile.php') ?>" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit;" title="Go to Profile Settings">
                <div class="user-avatar" style="overflow: hidden; padding: 0;">
                    <?php if (!empty($currentUser['avatar'])): ?>
                        <img src="<?= htmlspecialchars($currentUser['avatar']) ?>" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
                    <?php else: ?>
                        <?= strtoupper(substr($currentUser['name'], 0, 1)) ?>
                    <?php endif; ?>
                </div>
                <div>
                    <div style="font-size: 0.85rem; font-weight: 600;"><?= htmlspecialchars($currentUser['name']) ?></div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);"><?= ucfirst($currentUser['role']) ?> (<?= htmlspecialchars($currentUser['phone']) ?>)</div>
                </div>
            </a>
            <a href="<?= url('profile.php') ?>" style="color: var(--accent-gold); margin-left: 0.35rem; padding: 0.25rem; font-size: 0.85rem;" title="Profile Settings"><i class="fa-solid fa-gear"></i></a>
            <a href="<?= url('logout.php') ?>" class="btn-logout" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></a>
        </div>
    </div>
</nav>
<?php endif; ?>

<main class="main-container">
