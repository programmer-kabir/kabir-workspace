<?php
// admin/lottery.php - Wheel of Names Style Advanced Digital Lottery Engine
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDBConnection();

// Fetch eligible members with avatar
$eligibleMembers = $db->query("
    SELECT id, name, phone, role, nid_number, avatar 
    FROM members 
    WHERE is_payout_taken = 0 
    ORDER BY id ASC
")->fetchAll();

// Fetch completed payout history with winner avatar
$payoutHistory = $db->query("
    SELECT p.*, m.name AS winner_name, m.phone AS winner_phone, m.avatar AS winner_avatar 
    FROM monthly_payouts p 
    JOIN members m ON p.recipient_member_id = m.id 
    ORDER BY p.month_cycle ASC
")->fetchAll();

$nextCycle = count($payoutHistory) + 1;

// Check total collected amount (Requires 360,000 to enable Official Draw)
$totalCollected = floatval($db->query("SELECT COALESCE(SUM(amount), 0.00) FROM daily_collections WHERE status = 'paid'")->fetchColumn());
$isDrawEnabled = ($totalCollected >= 360000.00);

$monthNames = [
    1 => 'September 2026', 2 => 'October 2026', 3 => 'November 2026',
    4 => 'December 2026',  5 => 'January 2027',  6 => 'February 2027',
    7 => 'March 2027',     8 => 'April 2027',    9 => 'May 2027', 10 => 'June 2027'
];

$pageTitle = 'Advanced Wheel of Names Lottery Engine';
require_once __DIR__ . '/../includes/header.php';
?>

<!-- External Libraries: Canvas Confetti -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

<style>
/* Custom Wheel & Animation Styles */
.lottery-wrapper {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 2rem;
    margin-bottom: 2.5rem;
}

@media (max-width: 1024px) {
    .lottery-wrapper {
        grid-template-columns: 1fr;
    }
}

.wheel-card {
    background: var(--bg-card);
    backdrop-filter: blur(16px);
    border: 1px solid var(--bg-card-border);
    border-radius: 20px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

.wheel-glow-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    filter: blur(30px);
}

/* Wheel Canvas Outer Container */
.wheel-container {
    position: relative;
    width: 440px;
    height: 440px;
    margin: 1.5rem 0;
    user-select: none;
}

@media (max-width: 480px) {
    .wheel-container {
        width: 320px;
        height: 320px;
    }
}

#wheelCanvas {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-shadow: 0 0 35px rgba(245, 158, 11, 0.3), inset 0 0 15px rgba(0,0,0,0.8);
    transition: transform 0.05s ease-out;
}

/* Wheel Pointer / Ticker Pin */
.wheel-pointer {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 44px;
    z-index: 10;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));
    transform-origin: 50% 10%;
    transition: transform 0.08s ease;
}

.wheel-pointer.tick {
    transform: translateX(-50%) rotate(-18deg);
}

.wheel-center-cap {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 75px;
    height: 75px;
    background: linear-gradient(135deg, #F59E0B, #B45309);
    border: 4px solid #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 5;
    cursor: pointer;
    transition: transform 0.2s ease;
    overflow: hidden;
}

.wheel-center-cap:hover {
    transform: translate(-50%, -50%) scale(1.08);
}

.controls-bar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 1rem;
}

.ctrl-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--text-main);
    padding: 0.5rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.ctrl-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #FFF;
    border-color: var(--accent-gold);
}

.ctrl-btn.active {
    background: var(--accent-gold-glow);
    border-color: var(--accent-gold);
    color: var(--accent-gold);
}

/* Candidate Chips */
.candidate-chip {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
}

.candidate-chip:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
}

.color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

/* Fullscreen Overlay Styling */
.wheel-card.fullscreen-mode {
    position: fixed;
    inset: 0;
    z-index: 99999;
    border-radius: 0;
    border: none;
    background: #090D16;
}
.wheel-card.fullscreen-mode .wheel-container {
    width: 580px;
    height: 580px;
}
</style>

<!-- Header & Status Bar -->
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
    <div>
        <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-dharmachakra" style="color: var(--accent-gold); animation: spin 20s linear infinite;"></i> 
            Wheel of Names - ROSCA Lottery Engine
        </h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
            High-precision interactive spin wheel with member profile pictures.
        </p>
    </div>

    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
        <span class="badge badge-gold" style="font-size: 0.85rem; padding: 0.6rem 1.1rem;">
            <i class="fa-solid fa-calendar-star"></i> Cycle Month <?= $nextCycle <= 10 ? $nextCycle : '10' ?>: <?= $monthNames[$nextCycle] ?? 'Cycle Completed' ?>
        </span>
    </div>
</div>

<!-- Main Grid Layout -->
<div class="lottery-wrapper">
    
    <!-- LEFT: Interactive Wheel Section -->
    <div class="wheel-card" id="wheelCard">
        <div class="wheel-glow-bg"></div>

        <!-- Top Controls Bar -->
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; z-index: 2; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                <i class="fa-solid fa-trophy" style="color: var(--accent-gold);"></i> Monthly Jackpot: <span style="color: var(--accent-emerald);">৳ 3,60,000.00</span>
            </div>

            <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="ctrl-btn" id="audioToggleBtn" onclick="toggleAudio()" title="Sound FX Toggle">
                    <i class="fa-solid fa-volume-high" id="audioIcon" style="color: var(--accent-emerald);"></i> Audio: ON
                </button>

                <button type="button" class="ctrl-btn" onclick="toggleFullscreen()" title="Fullscreen Presentation Mode">
                    <i class="fa-solid fa-expand"></i> Fullscreen
                </button>
            </div>
        </div>

        <!-- The Canvas Wheel -->
        <div class="wheel-container">
            <!-- Ticker Pointer Pin -->
            <svg class="wheel-pointer" id="pointerPin" viewBox="0 0 30 40">
                <path d="M 15 40 L 0 0 L 30 0 Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" />
            </svg>

            <!-- Wheel Canvas -->
            <canvas id="wheelCanvas" width="880" height="880"></canvas>

            <!-- Center Cap Hub -->
            <div class="wheel-center-cap" onclick="handleSpinAction()" title="Click to Spin!">
                <i class="fa-solid fa-crown" style="font-size: 1.4rem; color: #FFF; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></i>
                <span style="font-size: 0.65rem; font-weight: 800; color: #FFF; text-transform: uppercase; margin-top: 2px;">SPIN</span>
            </div>
        </div>

        <!-- Spin Action Controls -->
        <div style="z-index: 2; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <?php if ($nextCycle <= 10 && !empty($eligibleMembers)): ?>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; align-items: center;">
                    <?php if (isAdmin()): ?>
                        <button id="officialDrawBtn" class="btn-primary" <?= !$isDrawEnabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;" title="Collection amount must reach ৳ 3,60,000 to enable"' : 'onclick="startOfficialDraw()"' ?> style="font-size: 1.1rem; padding: 0.9rem 2.2rem; border-radius: 30px; box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);">
                            <i class="fa-solid fa-play"></i> Run Official Draw (Month <?= $nextCycle ?>)
                        </button>
                    <?php else: ?>
                        <span class="badge badge-gold" style="padding: 0.75rem 1.25rem; border-radius: 30px; font-size: 0.85rem;">
                            <i class="fa-solid fa-lock"></i> Official Draw: Cashier Admin Only
                        </span>
                    <?php endif; ?>
                    
                    <button id="demoSpinBtn" class="ctrl-btn" onclick="startDemoSpin()" style="font-size: 0.95rem; padding: 0.85rem 1.5rem; border-radius: 30px;">
                        <i class="fa-solid fa-rotate-right"></i> Practice Demo Spin
                    </button>
                </div>
            <?php else: ?>
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 1rem 2rem; border-radius: 30px; color: var(--accent-emerald); font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-circle-check"></i> All 10 Payout Draws Completed for this Cycle!
                </div>
            <?php endif; ?>

            <!-- Advanced Customization Bar -->
            <div class="controls-bar">
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                    <i class="fa-solid fa-stopwatch"></i> Duration:
                    <select id="spinDurationSelect" style="background: rgba(0,0,0,0.5); color: #FFF; border: 1px solid rgba(255,255,255,0.15); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem;">
                        <option value="4">4 Seconds (Fast)</option>
                        <option value="6" selected>6 Seconds (Standard)</option>
                        <option value="9">9 Seconds (Dramatic)</option>
                    </select>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-left: 0.5rem;">
                    <i class="fa-solid fa-palette"></i> Palette:
                    <select id="paletteSelect" onchange="changeColorPalette(this.value)" style="background: rgba(0,0,0,0.5); color: #FFF; border: 1px solid rgba(255,255,255,0.15); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem;">
                        <option value="vibrant">Vibrant Neon</option>
                        <option value="royal">Royal Gold</option>
                        <option value="emerald">Emerald Samity</option>
                        <option value="rainbow">Pastel Rainbow</option>
                    </select>
                </div>

                <!-- Applause Sound FX Settings -->
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-left: 0.5rem;">
                    <i class="fa-solid fa-hands-clapping" style="color: var(--accent-gold);"></i> Applause Sound:
                    <select id="applauseSoundSelect" onchange="changeApplauseSound(this.value)" style="background: rgba(0,0,0,0.5); color: #FFF; border: 1px solid rgba(245,158,11,0.3); padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">
                        <option value="applause_stadium.mp3" selected>🏟️ Stadium Arena Crowd</option>
                        <option value="applause_standing_ovation.wav">👏 Standing Ovation & Whistling</option>
                        <option value="applause_party_festival.wav">🎉 Party Festival & Horns</option>
                        <option value="applause_drumroll_cheer.wav">🥁 Victory Drumroll & Crowd Cheer</option>
                        <option value="applause_golden_bell.wav">🔔 Golden Jackpot Bell & Jubilation</option>
                        <option value="applause_magical_sparkle.wav">✨ Magical Sparkle & Crowd Wave</option>
                        <option value="applause_theatre.mp3">🎭 Concert Theatre Applause</option>
                        <option value="applause_fanfare.mp3">🎺 Royal Fanfare & Crowd</option>
                        <option value="applause_fireworks.mp3">🎆 Fireworks & Cheer</option>
                        <option value="applause_crisp.mp3">👏 Short Crisp Clapping</option>
                    </select>
                    <button type="button" onclick="previewCurrentSound()" title="Test / Preview Selected Sound" style="background: rgba(245, 158, 11, 0.2); border: 1px solid var(--accent-gold); color: var(--accent-gold); padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
                        <i class="fa-solid fa-play"></i> Preview
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- RIGHT: Candidate Pool Directory -->
    <div class="glass-panel" style="padding: 1.75rem; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-users-viewfinder" style="color: var(--accent-emerald);"></i> Active Wheel Candidates
            </h3>
            <span class="badge badge-paid" id="poolCountBadge"><?= count($eligibleMembers) ?> Eligible</span>
        </div>

        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            Members remaining in the wheel candidate pool:
        </p>

        <!-- Candidate Pool List -->
        <div id="candidatePoolList" style="flex: 1; max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; padding-right: 0.3rem;">
            <?php if (empty($eligibleMembers)): ?>
                <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
                    <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; color: var(--accent-emerald); margin-bottom: 0.75rem; display: block;"></i>
                    All 10 committee members have successfully received their payout!
                </div>
            <?php else: ?>
                <?php foreach ($eligibleMembers as $index => $cand): ?>
                    <div class="candidate-chip" id="cand-chip-<?= $cand['id'] ?>">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="position: relative;">
                                <img src="<?= htmlspecialchars($cand['avatar'] ?: 'https://ui-avatars.com/api/?name='.urlencode($cand['name'])) ?>" alt="<?= htmlspecialchars($cand['name']) ?>" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-gold);">
                                <span class="color-dot" id="dot-<?= $index ?>" style="position: absolute; bottom: 0; right: 0; border: 1.5px solid #000;"></span>
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 0.9rem; color: #FFF;"><?= htmlspecialchars($cand['name']) ?></div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($cand['phone']) ?></div>
                            </div>
                        </div>
                        <span class="badge badge-gold" style="font-size: 0.7rem;">Slice <?= $index + 1 ?></span>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- BOTTOM: 10-Month Payout Audit & Winner Ledger -->
<div class="glass-panel" style="padding: 1.75rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
            <i class="fa-solid fa-receipt" style="color: var(--accent-gold);"></i> 10-Month Payout Disbursement Audit Ledger
        </h3>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
            Total Pool: <strong style="color: var(--accent-emerald);">৳ 30,00,000.00</strong> (10 Months × ৳3,00,000)
        </div>
    </div>

    <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
                <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <th style="padding: 1rem; color: var(--text-muted);">Cycle</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Month Name</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Disbursement Recipient</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Recipient Phone</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Payout Amount</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Distribution Date</th>
                    <th style="padding: 1rem; color: var(--text-muted);">Selection Method</th>
                </tr>
            </thead>
            <tbody id="auditTableBody">
                <?php for ($m = 1; $m <= 10; $m++): 
                    $payout = null;
                    foreach ($payoutHistory as $ph) {
                        if ($ph['month_cycle'] == $m) {
                            $payout = $ph;
                            break;
                        }
                    }
                ?>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 1rem; font-weight: 700;">Month <?= $m ?></td>
                        <td style="padding: 1rem; color: var(--accent-gold); font-weight: 600;"><?= $monthNames[$m] ?></td>
                        <?php if ($payout): ?>
                            <td style="padding: 1rem; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 0.75rem;">
                                <img src="<?= htmlspecialchars($payout['winner_avatar'] ?: 'https://ui-avatars.com/api/?name='.urlencode($payout['winner_name'])) ?>" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--accent-gold);">
                                <span><?= htmlspecialchars($payout['winner_name']) ?></span>
                            </td>
                            <td style="padding: 1rem; color: var(--text-muted);"><?= htmlspecialchars($payout['winner_phone']) ?></td>
                            <td style="padding: 1rem; font-weight: 700; color: var(--accent-emerald);">৳ <?= number_format($payout['amount_paid'], 2) ?></td>
                            <td style="padding: 1rem; color: var(--text-muted);"><?= date('d M Y', strtotime($payout['distribution_date'])) ?></td>
                            <td style="padding: 1rem;">
                                <?php if ($payout['selection_type'] === 'selection'): ?>
                                    <span class="badge badge-gold"><i class="fa-solid fa-star"></i> Pre-assigned</span>
                                <?php else: ?>
                                    <span class="badge badge-paid"><i class="fa-solid fa-clover"></i> Wheel of Names</span>
                                <?php endif; ?>
                            </td>
                        <?php else: ?>
                            <td colspan="5" style="padding: 1rem; color: var(--text-muted); font-style: italic;">
                                <i class="fa-solid fa-hourglass-half" style="margin-right: 0.35rem;"></i> Pending Payout Draw
                            </td>
                        <?php endif; ?>
                    </tr>
                <?php endfor; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Wheel of Names Winner Celebration Modal with Profile Picture -->
<div id="winnerModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(12px); z-index: 99999; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="glass-panel" style="width: 100%; max-width: 520px; padding: 2.5rem; text-align: center; position: relative; border: 2px solid var(--accent-gold); box-shadow: 0 0 80px rgba(245, 158, 11, 0.4); animation: modalZoom 0.4s ease-out;">
        
        <!-- Large Glowing Profile Picture -->
        <div style="position: relative; display: inline-block; margin-bottom: 0.75rem;">
            <img id="modalWinnerAvatar" src="https://ui-avatars.com/api/?name=Winner" alt="Winner Profile" style="width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 4px solid var(--accent-gold); box-shadow: 0 0 35px rgba(245, 158, 11, 0.7);">
            <div style="position: absolute; top: -12px; right: -6px; font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">👑</div>
        </div>

        <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); letter-spacing: 0.5px;">
            LOTTERY WINNER ANNOUNCED!
        </h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem; margin-bottom: 1.5rem;" id="modalMonthTitle">
            Month Payout Recipient
        </p>

        <div style="background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(0,0,0,0.3) 100%); border: 1px solid rgba(245, 158, 11, 0.4); padding: 1.5rem; border-radius: 20px; margin-bottom: 1.75rem; box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.1);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 0.35rem;">Congratulations to</div>
            <div id="modalWinnerName" style="font-size: 2.2rem; font-weight: 800; color: var(--accent-gold); line-height: 1.2;">
                Member Name
            </div>
            <div id="modalWinnerPhone" style="font-size: 1rem; color: var(--text-muted); margin-top: 0.35rem;">
                Phone: 01700000000
            </div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-emerald); margin-top: 1rem;">
                Payout Disbursed: ৳ 3,00,000.00
            </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button type="button" class="btn-primary" onclick="acceptAndReloadWinner()" style="flex: 1; justify-content: center; padding: 0.9rem; font-size: 1rem;">
                <i class="fa-solid fa-circle-check"></i> Accept & Update Ledger
            </button>
        </div>
    </div>
</div>

<script>
/* ==========================================================================
   WHEEL OF NAMES CANVAS & SOUND ENGINE
   ========================================================================== */

// Candidate Data
let candidates = <?= json_encode(array_values($eligibleMembers)) ?>;
const nextCycleNum = <?= $nextCycle ?>;

// Color Palettes
const palettes = {
    vibrant: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4', '#EF4444'],
    royal:   ['#D97706', '#B45309', '#F59E0B', '#FBBF24', '#78350F', '#92400E', '#D97706', '#F59E0B', '#B45309', '#FBBF24'],
    emerald: ['#059669', '#10B981', '#34D399', '#047857', '#065F46', '#10B981', '#34D399', '#059669', '#047857', '#34D399'],
    rainbow: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#2EC4B6', '#E71D36', '#FF9F1C', '#702632', '#99B882']
};

let currentPaletteKey = 'vibrant';
let sliceColors = palettes[currentPaletteKey];

// Canvas Context & DPI Scaling
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const pointerPin = document.getElementById('pointerPin');

let currentAngle = 0; // Current rotation angle in radians
let isSpinning = false;
let audioEnabled = true;

// Web Audio API Setup for Tick & Fanfare
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Synthesize Tick Sound Effect (Wooden / Metallic Impulse)
function playTickSound() {
    if (!audioEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.03);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.035);

        // Visual pointer bounce
        pointerPin.classList.add('tick');
        setTimeout(() => pointerPin.classList.remove('tick'), 60);
    } catch(e) {}
}

// Sound Effects Management & Local Storage Persistence
let selectedApplauseSound = localStorage.getItem('rosca_selected_applause') || 'applause_stadium.mp3';
let currentPreviewAudio = null;

function changeApplauseSound(soundFile) {
    selectedApplauseSound = soundFile;
    localStorage.setItem('rosca_selected_applause', soundFile);
}

function restoreSoundSetting() {
    const savedSound = localStorage.getItem('rosca_selected_applause');
    if (savedSound) {
        selectedApplauseSound = savedSound;
        const selectElem = document.getElementById('applauseSoundSelect');
        if (selectElem) {
            selectElem.value = savedSound;
        }
    }
}

function previewCurrentSound() {
    if (!audioEnabled) {
        alert("Audio is currently muted. Please click 'Audio: ON' to unmute!");
        return;
    }
    try {
        if (currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio.currentTime = 0;
        }
        const soundPath = "<?= url('assets/sounds/') ?>" + selectedApplauseSound;
        currentPreviewAudio = new Audio(soundPath);
        currentPreviewAudio.volume = 1.0;
        currentPreviewAudio.play().catch(err => {
            console.log("Autoplay check", err);
        });
    } catch(e) {}
}

// Play Authentic Selected Crowd Applause & Cheering Audio
function playWinnerFanfare() {
    if (!audioEnabled) return;

    // 1. Play Selected Stadium Crowd Applause Audio (Local MP3 File)
    try {
        const soundPath = "<?= url('assets/sounds/') ?>" + selectedApplauseSound;
        const applauseAudio = new Audio(soundPath);
        applauseAudio.currentTime = 0;
        applauseAudio.volume = 1.0;
        applauseAudio.play().catch(err => {
            console.log("Browser autoplay policy prevented audio playback", err);
        });
    } catch(e) {}

    // 2. Play Victory Trumpet Fanfare Chords (Web Audio API)
    try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = ctx.currentTime + (idx * 0.12);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.35, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.95);
        });
    } catch(e) {}
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const icon = document.getElementById('audioIcon');
    const btn = document.getElementById('audioToggleBtn');
    if (audioEnabled) {
        icon.className = 'fa-solid fa-volume-high';
        icon.style.color = 'var(--accent-emerald)';
        btn.innerHTML = `<i class="fa-solid fa-volume-high" style="color: var(--accent-emerald);"></i> Audio: ON`;
    } else {
        icon.className = 'fa-solid fa-volume-xmark';
        icon.style.color = 'var(--accent-rose)';
        btn.innerHTML = `<i class="fa-solid fa-volume-xmark" style="color: var(--accent-rose);"></i> Audio: OFF`;
    }
}

// Fullscreen Toggle
function toggleFullscreen() {
    const card = document.getElementById('wheelCard');
    card.classList.toggle('fullscreen-mode');
    drawWheel();
}

// Change Color Palette
function changeColorPalette(paletteName) {
    if (palettes[paletteName]) {
        currentPaletteKey = paletteName;
        sliceColors = palettes[paletteName];
        updateCandidateDots();
        drawWheel();
    }
}

function updateCandidateDots() {
    candidates.forEach((cand, idx) => {
        const dot = document.getElementById(`dot-${idx}`);
        if (dot) {
            dot.style.background = sliceColors[idx % sliceColors.length];
        }
    });
}

/* ==========================================================================
   WHEEL DRAWING ALGORITHM
   ========================================================================== */

function drawWheel() {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    if (candidates.length === 0) {
        // Empty state wheel
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#9CA3AF';
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('All Draws Completed!', centerX, centerY);
        return;
    }

    const sliceAngle = (2 * Math.PI) / candidates.length;

    // Draw Slices
    candidates.forEach((cand, i) => {
        const startAngle = currentAngle + (i * sliceAngle);
        const endAngle = startAngle + sliceAngle;
        const color = sliceColors[i % sliceColors.length];

        // Fill Sector
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Sector Border Lines
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // Draw Candidate Name Along Sector Bisector Radius
        ctx.save();
        ctx.translate(centerX, centerY);
        const textAngle = startAngle + (sliceAngle / 2);
        ctx.rotate(textAngle);

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';

        // Adjust font size based on slice count
        let fontSize = 28;
        if (candidates.length > 8) fontSize = 22;
        if (candidates.length > 15) fontSize = 18;
        ctx.font = `bold ${fontSize}px Outfit, sans-serif`;

        // Text Shadow for Maximum Contrast
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Truncate name if long
        let displayName = cand.name;
        if (displayName.length > 16) {
            displayName = displayName.substring(0, 14) + '...';
        }

        ctx.fillText(displayName, radius - 35, 0);
        ctx.restore();
    });

    // Outer Rim Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    // Outer Rim Gold Dots / Pegs
    const numPegs = candidates.length * 2;
    for (let p = 0; p < numPegs; p++) {
        const pegAngle = currentAngle + (p * (2 * Math.PI / numPegs));
        const pegX = centerX + (radius + 2) * Math.cos(pegAngle);
        const pegY = centerY + (radius + 2) * Math.sin(pegAngle);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

/* ==========================================================================
   ANIMATION & PHYSICS SPIN ENGINE
   ========================================================================== */

let lastPassSlice = -1;

function spinToTargetIndex(targetIndex, durationSec, onComplete) {
    if (isSpinning || candidates.length === 0) return;
    isSpinning = true;
    disableButtons(true);
    getAudioContext(); // Resume audio context on user interaction

    const sliceAngle = (2 * Math.PI) / candidates.length;
    
    // Pointer pin is at top (12 o'clock = 3*Math.PI/2 = -Math.PI/2).
    // Target slice bisector angle when rotation is currentAngle:
    // angleAtPin = (currentAngle + targetIndex * sliceAngle + sliceAngle/2) % (2*Math.PI)
    // We want (currentAngle + targetIndex * sliceAngle + sliceAngle/2) = 1.5 * Math.PI + (K * 2 * Math.PI)
    
    const pointerAngle = 1.5 * Math.PI; // Top 12 o'clock
    const targetSliceMid = (targetIndex * sliceAngle) + (sliceAngle / 2);
    
    // Calculate required final angle
    const numFullRotations = 6 + Math.floor(Math.random() * 3); // 6-8 full rotations
    
    // Current normalized angle
    const startAngle = currentAngle;
    let targetAngle = pointerAngle - targetSliceMid;
    
    // Ensure targetAngle is forward from startAngle by adding rotations
    while (targetAngle <= startAngle + (numFullRotations * 2 * Math.PI)) {
        targetAngle += 2 * Math.PI;
    }

    const startTime = performance.now();
    const durationMs = durationSec * 1000;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease Out Quartic Easing function for realistic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 4);

        currentAngle = startAngle + (targetAngle - startAngle) * easeOut;

        // Check slice tick sound
        const currentPointerSlice = Math.floor(
            ((pointerAngle - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / sliceAngle
        );

        if (currentPointerSlice !== lastPassSlice) {
            playTickSound();
            lastPassSlice = currentPointerSlice;
        }

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            disableButtons(false);
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }
    }

    requestAnimationFrame(animate);
}

function disableButtons(disabled) {
    const officialBtn = document.getElementById('officialDrawBtn');
    const demoBtn = document.getElementById('demoSpinBtn');
    if (officialBtn) {
        <?php if (!$isDrawEnabled): ?>
        officialBtn.disabled = true;
        officialBtn.style.opacity = '0.5';
        officialBtn.style.cursor = 'not-allowed';
        <?php else: ?>
        officialBtn.disabled = disabled;
        officialBtn.style.opacity = disabled ? '0.5' : '1';
        <?php endif; ?>
    }
    if (demoBtn) {
        demoBtn.disabled = disabled;
        demoBtn.style.opacity = disabled ? '0.5' : '1';
    }
}

function handleSpinAction() {
    if (isSpinning) return;
    if (nextCycleNum <= 10 && candidates.length > 0) {
        <?php if (!$isDrawEnabled): ?>
        return;
        <?php else: ?>
        startOfficialDraw();
        <?php endif; ?>
    } else {
        startDemoSpin();
    }
}

/* ==========================================================================
   OFFICIAL DRAW & DEMO DRAW HANDLERS
   ========================================================================== */

function startOfficialDraw() {
    <?php if (!$isDrawEnabled): ?>
    return;
    <?php endif; ?>
    if (isSpinning || candidates.length === 0) return;

    const durationSec = parseFloat(document.getElementById('spinDurationSelect').value) || 6;

    // First execute secure backend API request
    fetch("<?= url('api/run_draw.php') ?>", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.message || 'Draw Execution Error');
            return;
        }

        // Locate winner index in current candidate array
        const winnerObj = data.winner;
        const targetIndex = candidates.findIndex(c => c.id == winnerObj.id);

        if (targetIndex === -1) {
            alert("Winner candidate not found in active wheel pool!");
            return;
        }

        // Spin wheel to land exactly on winner index!
        spinToTargetIndex(targetIndex, durationSec, () => {
            // Victory Fanfare & Multi-Burst Confetti FX
            playWinnerFanfare();
            triggerConfettiExplosion();

            // Display Winner Modal with Profile Avatar
            const avatarUrl = winnerObj.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(winnerObj.name));
            document.getElementById('modalWinnerAvatar').src = avatarUrl;
            document.getElementById('modalWinnerName').innerText = winnerObj.name;
            document.getElementById('modalWinnerPhone').innerText = "Phone: " + winnerObj.phone;
            document.getElementById('modalMonthTitle').innerText = `Month ${data.cycle_number} Disbursement (${winnerObj.payout_month})`;
            document.getElementById('winnerModal').style.display = 'flex';
        });
    })
    .catch(err => {
        alert("Network or Server error executing draw.");
    });
}

function startDemoSpin() {
    if (isSpinning || candidates.length === 0) return;
    const durationSec = parseFloat(document.getElementById('spinDurationSelect').value) || 6;
    const randomIndex = Math.floor(Math.random() * candidates.length);

    spinToTargetIndex(randomIndex, durationSec, () => {
        playWinnerFanfare();
        triggerConfettiExplosion();

        const winner = candidates[randomIndex];
        const avatarUrl = winner.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(winner.name));
        document.getElementById('modalWinnerAvatar').src = avatarUrl;
        document.getElementById('modalWinnerName').innerText = winner.name + " (Demo)";
        document.getElementById('modalWinnerPhone').innerText = "Phone: " + winner.phone;
        document.getElementById('modalMonthTitle').innerText = `Practice Demo Spin Winner`;
        document.getElementById('winnerModal').style.display = 'flex';
    });
}

// High-Impact Confetti Fireworks & Celebration FX
function triggerConfettiExplosion() {
    if (typeof confetti !== 'function') return;

    // Sustained 3-second celebration rain
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    // Side Cannon Streamers
    (function frame() {
        // Left cannon
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            zIndex: 1000000,
            colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899']
        });
        // Right cannon
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            zIndex: 1000000,
            colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());

    // Center Big Fireworks Burst
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        zIndex: 1000000,
        colors: ['#FFD700', '#FF1493', '#00E5FF', '#76FF03']
    });
}

function acceptAndReloadWinner() {
    location.reload();
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    restoreSoundSetting();
    updateCandidateDots();
    drawWheel();
});
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
