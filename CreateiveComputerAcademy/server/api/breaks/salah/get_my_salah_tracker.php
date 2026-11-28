<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../BreakDbHelper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
BreakDbHelper::ensureSchema($db);

$userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
$date = !empty($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$waqtDefs = [
    'Fajr'    => ['name_bn' => 'ফজর',    'name_en' => 'Fajr',    'icon' => '🌅', 'sort' => 1],
    'Dhuhr'   => ['name_bn' => 'জোহর',   'name_en' => 'Dhuhr',   'icon' => '☀️', 'sort' => 2],
    'Asr'     => ['name_bn' => 'আসর',    'name_en' => 'Asr',     'icon' => '🌤️', 'sort' => 3],
    'Maghrib' => ['name_bn' => 'মাগরিব', 'name_en' => 'Maghrib', 'icon' => '🌇', 'sort' => 4],
    'Isha'    => ['name_bn' => 'এশা',     'name_en' => 'Isha',    'icon' => '🌙', 'sort' => 5],
];

try {
    // 0. Active Prayer Schedule & Reward Config
    $schedule = BreakDbHelper::getActivePrayerSchedule($db);
    $rewardPerWaqt = (int)($schedule['salah_reward_mins'] ?? 3);
    $fullDayBonusRate = (int)($schedule['salah_full_day_bonus'] ?? 5);
    $isRewardEnabled = !empty($schedule['is_reward_enabled']);

    // 1. Fetch today's logged prayers
    $stmt = $db->prepare("SELECT waqt, logged_at, reward_minutes, bonus_minutes FROM staff_salah_logs WHERE user_id = :uid AND date = :date");
    $stmt->execute([':uid' => $userId, ':date' => $date]);
    $loggedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $loggedMap = [];
    $todayEarnedMins = 0;
    foreach ($loggedRows as $row) {
        $loggedMap[$row['waqt']] = $row;
        $todayEarnedMins += (int)($row['reward_minutes'] ?? 0) + (int)($row['bonus_minutes'] ?? 0);
    }

    $waqts = [];
    $completedCount = 0;

    foreach ($waqtDefs as $key => $meta) {
        $isPrayed = isset($loggedMap[$key]);
        if ($isPrayed) {
            $completedCount++;
        }

        $row = $loggedMap[$key] ?? null;
        $waqts[$key] = [
            'key' => $key,
            'name_bn' => $meta['name_bn'],
            'name_en' => $meta['name_en'],
            'icon' => $meta['icon'],
            'sort' => $meta['sort'],
            'is_prayed' => $isPrayed,
            'logged_at' => $row['logged_at'] ?? null,
            'reward_minutes' => $row ? (int)$row['reward_minutes'] : $rewardPerWaqt,
            'bonus_minutes' => $row ? (int)$row['bonus_minutes'] : 0
        ];
    }

    // 2. Calculate consecutive streak days
    $datesStmt = $db->prepare("SELECT DISTINCT date FROM staff_salah_logs WHERE user_id = :uid ORDER BY date DESC LIMIT 90");
    $datesStmt->execute([':uid' => $userId]);
    $activeDates = $datesStmt->fetchAll(PDO::FETCH_COLUMN);
    $activeDateSet = array_flip($activeDates);

    $streak = 0;
    $checkDate = $date;
    if (!isset($activeDateSet[$checkDate])) {
        // If today has 0 logged yet, start checking from yesterday so today's pending status doesn't break active streak
        $checkDate = date('Y-m-d', strtotime('-1 day', strtotime($date)));
    }
    while (isset($activeDateSet[$checkDate])) {
        $streak++;
        $checkDate = date('Y-m-d', strtotime('-1 day', strtotime($checkDate)));
    }

    // 3. Fajr streak
    $fajrStmt = $db->prepare("SELECT DISTINCT date FROM staff_salah_logs WHERE user_id = :uid AND waqt = 'Fajr' ORDER BY date DESC LIMIT 45");
    $fajrStmt->execute([':uid' => $userId]);
    $fajrDates = array_flip($fajrStmt->fetchAll(PDO::FETCH_COLUMN));

    $fajrStreak = 0;
    $checkFajr = $date;
    if (!isset($fajrDates[$checkFajr])) {
        $checkFajr = date('Y-m-d', strtotime('-1 day', strtotime($date)));
    }
    while (isset($fajrDates[$checkFajr])) {
        $fajrStreak++;
        $checkFajr = date('Y-m-d', strtotime('-1 day', strtotime($checkFajr)));
    }

    // 4. Lifetime stats
    $totStmt = $db->prepare("SELECT COUNT(*) FROM staff_salah_logs WHERE user_id = :uid");
    $totStmt->execute([':uid' => $userId]);
    $totalLifetimePrayers = (int)$totStmt->fetchColumn();

    // Lifetime earned salah reward minutes from vault ledger
    $vlStmt = $db->prepare("SELECT COALESCE(SUM(minutes_amount), 0) FROM mango_vault_ledger WHERE user_id = :uid AND action_type IN ('salah_reward', 'salah_full_day_bonus')");
    $vlStmt->execute([':uid' => $userId]);
    $lifetimeEarnedMins = (int)$vlStmt->fetchColumn();

    // 5. Milestone Badges
    $badges = [
        [
            'id' => 'starter',
            'title_bn' => 'সূচনা ব্যাজ',
            'title_en' => 'Bismillah Starter',
            'icon' => '🌱',
            'desc_bn' => 'প্রথম নামাজ ট্র্যাকিং সম্পন্ন',
            'desc_en' => 'Tracked your first prayer',
            'unlocked' => $totalLifetimePrayers >= 1,
            'progress' => min(1, $totalLifetimePrayers) . "/1"
        ],
        [
            'id' => 'perfect_day',
            'title_bn' => 'পারফেক্ট ডে (৫/৫)',
            'title_en' => '5/5 Daily Star',
            'icon' => '⭐',
            'desc_bn' => 'আজকের ৫ ওয়াক্ত নামাজ সম্পন্ন',
            'desc_en' => 'All 5 prayers completed today',
            'unlocked' => $completedCount >= 5,
            'progress' => "{$completedCount}/5 ওয়াক্ত"
        ],
        [
            'id' => 'streak_3',
            'title_bn' => '৩ দিনের অবিচল',
            'title_en' => '3-Day Steadfast',
            'icon' => '⚡',
            'desc_bn' => 'টানা ৩ দিন নিয়মিত নামাজ ট্র্যাকিং',
            'desc_en' => '3 consecutive prayer days',
            'unlocked' => $streak >= 3,
            'progress' => min(3, $streak) . "/3 দিন"
        ],
        [
            'id' => 'mumin_7',
            'title_bn' => 'মুমিন স্ট্রাইক (৭ দিন)',
            'title_en' => '7-Day Mumin',
            'icon' => '🛡️',
            'desc_bn' => 'টানা ৭ দিন নিয়মিত নামাজের অভ্যাস',
            'desc_en' => '7 consecutive prayer days',
            'unlocked' => $streak >= 7,
            'progress' => min(7, $streak) . "/7 দিন"
        ],
        [
            'id' => 'istiqamah_15',
            'title_bn' => 'ইসতিকামাত (১৫ দিন)',
            'title_en' => '15-Day Istiqamah',
            'icon' => '💎',
            'desc_bn' => 'টানা ১৫ দিনের সুদৃঢ় অভ্যাস',
            'desc_en' => '15 consecutive prayer days',
            'unlocked' => $streak >= 15,
            'progress' => min(15, $streak) . "/15 দিন"
        ],
        [
            'id' => 'champion_30',
            'title_bn' => 'সলাত চ্যাম্পিয়ন (৩০ দিন)',
            'title_en' => '30-Day Champion',
            'icon' => '👑',
            'desc_bn' => 'টানা ৩০ দিন নামাজের গৌরবময় মুকুট',
            'desc_en' => '30 consecutive prayer days',
            'unlocked' => $streak >= 30,
            'progress' => min(30, $streak) . "/30 দিন"
        ],
        [
            'id' => 'fajr_hero',
            'title_bn' => 'ফজর যোদ্ধা (৭ দিন)',
            'title_en' => 'Fajr Hero',
            'icon' => '🌅',
            'desc_bn' => 'টানা ৭ দিন ফজর নামাজ আদায়',
            'desc_en' => '7 consecutive days Fajr prayer',
            'unlocked' => $fajrStreak >= 7,
            'progress' => min(7, $fajrStreak) . "/7 দিন"
        ]
    ];

    $unlockedBadgesCount = count(array_filter($badges, fn($b) => !empty($b['unlocked'])));

    echo json_encode([
        "status" => "success",
        "data" => [
            "date" => $date,
            "waqts" => $waqts,
            "completed_count" => $completedCount,
            "total_waqt" => 5,
            "progress_percent" => round(($completedCount / 5) * 100),
            "streak_days" => $streak,
            "fajr_streak" => $fajrStreak,
            "today_earned_minutes" => $todayEarnedMins,
            "lifetime_earned_minutes" => $lifetimeEarnedMins,
            "total_lifetime_prayers" => $totalLifetimePrayers,
            "reward_config" => [
                "reward_per_waqt" => $rewardPerWaqt,
                "full_day_bonus" => $fullDayBonusRate,
                "is_reward_enabled" => $isRewardEnabled
            ],
            "badges" => $badges,
            "unlocked_badges_count" => $unlockedBadgesCount,
            "total_badges_count" => count($badges),
            "server_time" => date('Y-m-d H:i:s')
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
