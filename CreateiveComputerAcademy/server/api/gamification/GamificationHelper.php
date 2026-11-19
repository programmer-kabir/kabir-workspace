<?php
/**
 * GamificationHelper.php — Staff Career Leveling, XP & Achievement Engine
 *
 * Self-healing JIT schema migration, XP calculation, automatic streak tracking,
 * and milestone badge unlocks for Creative Computer Academy.
 */

class GamificationHelper {

    /**
     * Self-healing database schema for gamification tables.
     */
    public static function ensureSchema($db) {
        if (!$db) return;

        try {
            // 1. Staff Gamification Profile
            $db->exec("
                CREATE TABLE IF NOT EXISTS `staff_gamification_profiles` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL UNIQUE,
                    `xp` INT NOT NULL DEFAULT 0,
                    `level` INT NOT NULL DEFAULT 1,
                    `current_streak` INT NOT NULL DEFAULT 0,
                    `longest_streak` INT NOT NULL DEFAULT 0,
                    `last_active_date` DATE NULL,
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (`xp`),
                    INDEX (`level`),
                    INDEX (`current_streak`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. Staff Badges
            $db->exec("
                CREATE TABLE IF NOT EXISTS `staff_badges` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `badge_key` VARCHAR(60) NOT NULL,
                    `title` VARCHAR(100) NOT NULL,
                    `description` TEXT NULL,
                    `icon` VARCHAR(50) NOT NULL DEFAULT 'star',
                    `tier` ENUM('bronze', 'silver', 'gold', 'legend') NOT NULL DEFAULT 'bronze',
                    `unlocked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY `uniq_user_badge` (`user_id`, `badge_key`),
                    INDEX (`user_id`),
                    INDEX (`tier`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 3. Staff XP Ledger
            $db->exec("
                CREATE TABLE IF NOT EXISTS `staff_xp_ledger` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `amount` INT NOT NULL,
                    `action` VARCHAR(60) NOT NULL,
                    `reference_id` VARCHAR(100) NULL,
                    `notes` VARCHAR(255) NULL,
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX (`user_id`),
                    INDEX (`action`),
                    INDEX (`created_at`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

        } catch (Throwable $e) {
            error_log("GamificationHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    /**
     * Compute Level & Rank Tier from Total XP.
     */
    public static function calculateLevel($xp) {
        $xp = max(0, intval($xp));

        $levels = [
            1  => ['min' => 0,    'max' => 99,   'title' => 'Bronze Associate 🥉',  'tier' => 'bronze', 'perk' => 'Starter Staff Badge & Profile'],
            2  => ['min' => 100,  'max' => 249,  'title' => 'Bronze Apprentice',    'tier' => 'bronze', 'perk' => 'Custom Avatar Glow'],
            3  => ['min' => 250,  'max' => 449,  'title' => 'Bronze Specialist',    'tier' => 'bronze', 'perk' => '1 Free Streak Shield'],
            4  => ['min' => 450,  'max' => 699,  'title' => 'Silver Specialist 🥈', 'tier' => 'silver', 'perk' => 'Priority Payout Queueing'],
            5  => ['min' => 700,  'max' => 999,  'title' => 'Silver Officer',       'tier' => 'silver', 'perk' => 'Tiffin 5m Grace Protection'],
            6  => ['min' => 1000, 'max' => 1349, 'title' => 'Silver Commander',     'tier' => 'silver', 'perk' => 'Custom Status Flare'],
            7  => ['min' => 1350, 'max' => 1749, 'title' => 'Gold Master 🥇',       'tier' => 'gold',   'perk' => 'Priority P2P Trade Fee 0%'],
            8  => ['min' => 1750, 'max' => 2199, 'title' => 'Gold Vanguard',       'tier' => 'gold',   'perk' => 'Peer Mentor Badge'],
            9  => ['min' => 2200, 'max' => 2699, 'title' => 'Gold Champion',       'tier' => 'gold',   'perk' => 'Quarterly Hall of Fame Entry'],
            10 => ['min' => 2700, 'max' => 999999, 'title' => 'Crown Legend 👑',   'tier' => 'legend', 'perk' => 'VIP Workstation Status & Trophy']
        ];

        $currentLevel = 1;
        foreach ($levels as $lvl => $info) {
            if ($xp >= $info['min']) {
                $currentLevel = $lvl;
            } else {
                break;
            }
        }

        $info = $levels[$currentLevel];
        $minXp = $info['min'];
        $maxXp = ($currentLevel < 10) ? $levels[$currentLevel + 1]['min'] : ($minXp + 1000);

        $range = max(1, $maxXp - $minXp);
        $progressXp = max(0, $xp - $minXp);
        $progressPct = min(100, round(($progressXp / $range) * 100, 1));

        return [
            'level'           => $currentLevel,
            'title'           => $info['title'],
            'tier'            => $info['tier'],
            'perk'            => $info['perk'],
            'current_xp'      => $xp,
            'level_min_xp'    => $minXp,
            'level_next_xp'   => $maxXp,
            'xp_needed'       => max(0, $maxXp - $xp),
            'progress_pct'    => $progressPct
        ];
    }

    /**
     * Award XP to user and log it.
     */
    public static function awardXp($db, $userId, $amount, $action, $refId = null, $notes = '') {
        self::ensureSchema($db);
        $userId = intval($userId);
        $amount = intval($amount);
        if ($userId <= 0 || $amount === 0) return;

        // Check if exact same action and reference was already logged today
        if ($refId) {
            $chk = $db->prepare("SELECT id FROM staff_xp_ledger WHERE user_id = :uid AND action = :act AND reference_id = :ref LIMIT 1");
            $chk->execute([':uid' => $userId, ':act' => $action, ':ref' => strval($refId)]);
            if ($chk->fetch()) {
                return; // already awarded
            }
        }

        // Insert into ledger
        $stmt = $db->prepare("
            INSERT INTO staff_xp_ledger (user_id, amount, action, reference_id, notes, created_at)
            VALUES (:uid, :amount, :act, :ref, :notes, NOW())
        ");
        $stmt->execute([
            ':uid'    => $userId,
            ':amount' => $amount,
            ':act'    => $action,
            ':ref'    => $refId ? strval($refId) : null,
            ':notes'  => $notes
        ]);

        // Recalculate and update profile total
        $sumStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM staff_xp_ledger WHERE user_id = :uid");
        $sumStmt->execute([':uid' => $userId]);
        $totalXp = max(0, intval($sumStmt->fetchColumn()));

        $levelData = self::calculateLevel($totalXp);

        $db->prepare("
            INSERT INTO staff_gamification_profiles (user_id, xp, level, created_at)
            VALUES (:uid, :xp, :lvl, NOW())
            ON DUPLICATE KEY UPDATE xp = :xp2, level = :lvl2
        ")->execute([
            ':uid'  => $userId,
            ':xp'   => $totalXp,
            ':lvl'  => $levelData['level'],
            ':xp2'  => $totalXp,
            ':lvl2' => $levelData['level']
        ]);
    }

    /**
     * Award milestone badge to user.
     */
    public static function awardBadge($db, $userId, $badgeKey, $title, $description, $icon = 'star', $tier = 'bronze') {
        self::ensureSchema($db);
        $userId = intval($userId);
        if ($userId <= 0) return;

        $db->prepare("
            INSERT INTO staff_badges (user_id, badge_key, title, description, icon, tier, unlocked_at)
            VALUES (:uid, :k, :title, :descr, :icon, :tier, NOW())
            ON DUPLICATE KEY UPDATE title = :title2, description = :descr2
        ")->execute([
            ':uid'    => $userId,
            ':k'      => $badgeKey,
            ':title'  => $title,
            ':descr'  => $description,
            ':icon'   => $icon,
            ':tier'   => $tier,
            ':title2' => $title,
            ':descr2' => $description
        ]);
    }

    /**
     * Catalog of all system badges and their criteria.
     */
    public static function getBadgeCatalog() {
        return [
            'streak_3' => [
                'key'         => 'streak_3',
                'title'       => '3-Day Focus Streak 🔥',
                'description' => 'Worked 3 consecutive days on-time without any shortfall.',
                'icon'        => 'zap',
                'tier'        => 'bronze',
                'criteria'    => 'Current streak >= 3 days'
            ],
            'streak_7' => [
                'key'         => 'streak_7',
                'title'       => 'Week of Steel ⚡',
                'description' => 'Maintained 7 consecutive work days with zero penalties.',
                'icon'        => 'shield',
                'tier'        => 'silver',
                'criteria'    => 'Current streak >= 7 days'
            ],
            'streak_30' => [
                'key'         => 'streak_30',
                'title'       => 'Monthly Iron Legend 🛡️',
                'description' => 'Achieved an extraordinary 30-day attendance streak!',
                'icon'        => 'award',
                'tier'        => 'gold',
                'criteria'    => 'Longest streak >= 30 days'
            ],
            'on_time_cadet' => [
                'key'         => 'on_time_cadet',
                'title'       => 'Punctual Prodigy ⏰',
                'description' => 'Logged 10 on-time morning check-ins before 9:15 AM.',
                'icon'        => 'clock',
                'tier'        => 'bronze',
                'criteria'    => '>= 10 on-time check-ins'
            ],
            'mango_baron' => [
                'key'         => 'mango_baron',
                'title'       => 'Mango Orchard Baron 🥭',
                'description' => 'Accumulated 5 or more ripe mangoes in your Overtime Vault.',
                'icon'        => 'sun',
                'tier'        => 'gold',
                'criteria'    => '>= 5 ripe mangoes'
            ],
            'holiday_hero' => [
                'key'         => 'holiday_hero',
                'title'       => 'Holiday Dedication Hero 🏛️',
                'description' => 'Volunteered and worked during an official academy closure or holiday.',
                'icon'        => 'heart',
                'tier'        => 'gold',
                'criteria'    => 'Worked >= 1 shift on an official holiday'
            ],
            'task_virtuoso' => [
                'key'         => 'task_virtuoso',
                'title'       => 'Five-Star Virtuoso 🌟',
                'description' => 'Earned 5-star quality ratings from reviewers on completed assignments.',
                'icon'        => 'star',
                'tier'        => 'silver',
                'criteria'    => '>= 5 five-star reviewed tasks'
            ],
            'century_warrior' => [
                'key'         => 'century_warrior',
                'title'       => 'Century Centurion 💯',
                'description' => 'Completed over 100 verified working sessions at CCA.',
                'icon'        => 'check-circle',
                'tier'        => 'legend',
                'criteria'    => '>= 100 attendance sessions'
            ]
        ];
    }

    /**
     * Full synchronization of a staff member's historical work data into XP, Streaks & Badges.
     */
    public static function syncUser($db, $userId) {
        self::ensureSchema($db);
        $userId = intval($userId);
        if ($userId <= 0) return;

        $today = date('Y-m-d');

        // 1. Fetch completed attendance records
        $attStmt = $db->prepare("
            SELECT id, date, check_in, check_out, status 
            FROM attendance 
            WHERE user_id = :uid 
              AND check_in IS NOT NULL AND check_out IS NOT NULL 
              AND status IN ('Present', 'Late', 'Half Day')
            ORDER BY date ASC
        ");
        $attStmt->execute([':uid' => $userId]);
        $attendances = $attStmt->fetchAll(PDO::FETCH_ASSOC);

        $onTimeCount = 0;
        $totalSessions = count($attendances);
        $workedDates = [];

        foreach ($attendances as $att) {
            $d = $att['date'];
            $workedDates[$d] = true;
            $inTime = trim($att['check_in']);
            $timePart = (strpos($inTime, ' ') !== false) ? explode(' ', $inTime)[1] : $inTime;

            // Check if on-time (before 09:16:00)
            if ($timePart <= '09:16:00') {
                $onTimeCount++;
                self::awardXp($db, $userId, 10, 'on_time_clockin', "att_{$att['id']}", "On-time arrival on {$d}");
            }

            // Award standard completed shift XP
            self::awardXp($db, $userId, 20, 'completed_shift', "att_shift_{$att['id']}", "Completed shift on {$d}");
        }

        // 2. Compute Consecutive Working Days Streak
        // Sort distinct dates descending
        $distinctDates = array_keys($workedDates);
        rsort($distinctDates);

        $currentStreak = 0;
        $longestStreak = 0;
        $tempStreak = 0;

        // Check if yesterday or today was worked
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $dayBeforeYesterday = date('Y-m-d', strtotime('-2 days'));

        $isStreakAlive = in_array($today, $distinctDates) || in_array($yesterday, $distinctDates);
        // If yesterday was Friday (N=5), Thursday counts
        if (!$isStreakAlive && date('N', strtotime($yesterday)) == 5 && in_array($dayBeforeYesterday, $distinctDates)) {
            $isStreakAlive = true;
        }

        if ($isStreakAlive && !empty($distinctDates)) {
            $prevDate = strtotime($distinctDates[0]);
            $currentStreak = 1;

            for ($i = 1; $i < count($distinctDates); $i++) {
                $currDate = strtotime($distinctDates[$i]);
                $diffDays = ($prevDate - $currDate) / 86400;

                // If gap is 1 day, streak continues
                // If gap is 2 days and the day in-between was Friday (off day), streak continues!
                $inBetweenDay = $currDate + 86400;
                $isFridayBridge = ($diffDays == 2 && date('N', $inBetweenDay) == 5);

                if ($diffDays == 1 || $isFridayBridge) {
                    $currentStreak++;
                    $prevDate = $currDate;
                } else {
                    break;
                }
            }
        }

        $longestStreak = max($currentStreak, count($distinctDates) > 0 ? min(30, count($distinctDates)) : 0);

        // 3. Check for Holiday Work
        $holWorkStmt = $db->prepare("
            SELECT COUNT(a.id) FROM attendance a
            INNER JOIN holidays h ON a.date = h.date
            WHERE a.user_id = :uid AND a.check_in IS NOT NULL AND a.check_out IS NOT NULL
        ");
        $holWorkStmt->execute([':uid' => $userId]);
        $holidayWorkCount = (int)$holWorkStmt->fetchColumn();

        if ($holidayWorkCount > 0) {
            self::awardBadge($db, $userId, 'holiday_hero', 'Holiday Dedication Hero 🏛️', 'Volunteered and worked during an official academy closure or holiday.', 'heart', 'gold');
            self::awardXp($db, $userId, 50, 'holiday_hero', 'badge_holiday_hero', 'Worked during official academy closure');
        }

        // 4. Check Badges Unlocks
        if ($currentStreak >= 3) {
            self::awardBadge($db, $userId, 'streak_3', '3-Day Focus Streak 🔥', 'Worked 3 consecutive days on-time without any shortfall.', 'zap', 'bronze');
        }
        if ($currentStreak >= 7) {
            self::awardBadge($db, $userId, 'streak_7', 'Week of Steel ⚡', 'Maintained 7 consecutive work days with zero penalties.', 'shield', 'silver');
        }
        if ($longestStreak >= 30) {
            self::awardBadge($db, $userId, 'streak_30', 'Monthly Iron Legend 🛡️', 'Achieved an extraordinary 30-day attendance streak!', 'award', 'gold');
        }
        if ($onTimeCount >= 10) {
            self::awardBadge($db, $userId, 'on_time_cadet', 'Punctual Prodigy ⏰', 'Logged 10 on-time morning check-ins before 9:15 AM.', 'clock', 'bronze');
        }
        if ($totalSessions >= 100) {
            self::awardBadge($db, $userId, 'century_warrior', 'Century Centurion 💯', 'Completed over 100 verified working sessions at CCA.', 'check-circle', 'legend');
        }

        // 5. Check Ripe Mangoes count
        try {
            if (file_exists(__DIR__ . '/../breaks/BreakDbHelper.php')) {
                require_once __DIR__ . '/../breaks/BreakDbHelper.php';
                $availableMins = BreakDbHelper::getAvailableMangoMinutes($db, $userId);
                $ripeMangoes = (int)floor($availableMins / 480);
                if ($ripeMangoes >= 5) {
                    self::awardBadge($db, $userId, 'mango_baron', 'Mango Orchard Baron 🥭', 'Accumulated 5 or more ripe mangoes in your Overtime Vault.', 'sun', 'gold');
                }
            }
        } catch (Throwable $e) {}

        // 6. Check 5-Star Tasks
        try {
            $starStmt = $db->prepare("SELECT COUNT(*) FROM task_reviews WHERE user_id = :uid AND rating = 5");
            $starStmt->execute([':uid' => $userId]);
            $fiveStarCount = (int)$starStmt->fetchColumn();
            if ($fiveStarCount >= 5) {
                self::awardBadge($db, $userId, 'task_virtuoso', 'Five-Star Virtuoso 🌟', 'Earned 5-star quality ratings from reviewers on completed assignments.', 'star', 'silver');
            }
        } catch (Throwable $e) {}

        // 7. Update Gamification Profile record
        $sumStmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM staff_xp_ledger WHERE user_id = :uid");
        $sumStmt->execute([':uid' => $userId]);
        $totalXp = max(0, intval($sumStmt->fetchColumn()));
        $levelData = self::calculateLevel($totalXp);

        $db->prepare("
            INSERT INTO staff_gamification_profiles (user_id, xp, level, current_streak, longest_streak, last_active_date, created_at)
            VALUES (:uid, :xp, :lvl, :cstreak, :lstreak, :actdate, NOW())
            ON DUPLICATE KEY UPDATE 
                xp = :xp2, 
                level = :lvl2, 
                current_streak = :cstreak2, 
                longest_streak = GREATEST(longest_streak, :lstreak2),
                last_active_date = :actdate2
        ")->execute([
            ':uid'       => $userId,
            ':xp'        => $totalXp,
            ':lvl'       => $levelData['level'],
            ':cstreak'   => $currentStreak,
            ':lstreak'   => $longestStreak,
            ':actdate'   => $today,
            ':xp2'       => $totalXp,
            ':lvl2'      => $levelData['level'],
            ':cstreak2'  => $currentStreak,
            ':lstreak2'  => $longestStreak,
            ':actdate2'  => $today
        ]);
    }

    /**
     * Get complete gamification profile for user including badges, XP ledger, and level info.
     */
    public static function getUserProfile($db, $userId) {
        self::ensureSchema($db);
        $userId = intval($userId);
        self::syncUser($db, $userId);

        // Fetch profile
        $stmt = $db->prepare("
            SELECT g.*, u.name, u.email, u.profile_picture 
            FROM staff_gamification_profiles g
            JOIN users u ON g.user_id = u.id
            WHERE g.user_id = :uid
            LIMIT 1
        ");
        $stmt->execute([':uid' => $userId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        $totalXp = $profile ? intval($profile['xp']) : 0;
        $levelInfo = self::calculateLevel($totalXp);

        // Fetch unlocked badges
        $bStmt = $db->prepare("SELECT * FROM staff_badges WHERE user_id = :uid ORDER BY unlocked_at DESC");
        $bStmt->execute([':uid' => $userId]);
        $unlockedBadges = $bStmt->fetchAll(PDO::FETCH_ASSOC);

        $unlockedKeys = [];
        foreach ($unlockedBadges as $b) {
            $unlockedKeys[$b['badge_key']] = $b;
        }

        // Full catalog with locked/unlocked state
        $catalog = self::getBadgeCatalog();
        $badgesResponse = [];
        foreach ($catalog as $key => $meta) {
            $isUnlocked = isset($unlockedKeys[$key]);
            $badgesResponse[] = [
                'key'         => $key,
                'title'       => $meta['title'],
                'description' => $meta['description'],
                'icon'        => $meta['icon'],
                'tier'        => $meta['tier'],
                'criteria'    => $meta['criteria'],
                'is_unlocked' => $isUnlocked,
                'unlocked_at' => $isUnlocked ? $unlockedKeys[$key]['unlocked_at'] : null
            ];
        }

        // Fetch recent XP activity
        $xpStmt = $db->prepare("
            SELECT id, amount, action, notes, created_at 
            FROM staff_xp_ledger 
            WHERE user_id = :uid 
            ORDER BY created_at DESC 
            LIMIT 15
        ");
        $xpStmt->execute([':uid' => $userId]);
        $recentXp = $xpStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'user_id'         => $userId,
            'name'            => $profile['name'] ?? 'Staff Member',
            'profile_picture' => $profile['profile_picture'] ?? null,
            'total_xp'        => $totalXp,
            'level_info'      => $levelInfo,
            'current_streak'  => intval($profile['current_streak'] ?? 0),
            'longest_streak'  => intval($profile['longest_streak'] ?? 0),
            'badges_unlocked_count' => count($unlockedBadges),
            'badges_total_count'    => count($catalog),
            'badges'          => $badgesResponse,
            'recent_xp'       => $recentXp
        ];
    }

    /**
     * Retrieve global staff leaderboard ranked by XP and Level.
     */
    public static function getLeaderboard($db, $limit = 10) {
        self::ensureSchema($db);

        // Auto-sync any active staff whose profile has not been initialized yet
        try {
            $staffIds = $db->query("
                SELECT u.id 
                FROM users u 
                INNER JOIN user_roles ur ON u.id = ur.user_id 
                LEFT JOIN staff_gamification_profiles g ON u.id = g.user_id
                WHERE ur.role IN ('staff', 'manager', 'instructor') 
                  AND u.status = 'active'
                  AND g.id IS NULL
                LIMIT 15
            ")->fetchAll(PDO::FETCH_COLUMN);

            foreach ($staffIds as $sUid) {
                self::syncUser($db, intval($sUid));
            }
        } catch (Throwable $e) {}

        $sql = "
            SELECT 
                g.user_id,
                g.xp,
                g.level,
                g.current_streak,
                g.longest_streak,
                u.name,
                u.profile_picture,
                (SELECT COUNT(*) FROM staff_badges b WHERE b.user_id = g.user_id) as badge_count
            FROM staff_gamification_profiles g
            JOIN users u ON g.user_id = u.id
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.role IN ('staff', 'manager', 'instructor')
              AND u.status = 'active'
            GROUP BY g.user_id
            ORDER BY g.xp DESC, g.level DESC, g.current_streak DESC
            LIMIT :lim
        ";

        $stmt = $db->prepare($sql);
        $stmt->bindValue(':lim', intval($limit), PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $leaderboard = [];
        $rank = 1;
        foreach ($rows as $r) {
            $lvlData = self::calculateLevel(intval($r['xp']));
            $r['rank'] = $rank++;
            $r['rank_title'] = $lvlData['title'];
            $r['tier'] = $lvlData['tier'];
            $leaderboard[] = $r;
        }

        return $leaderboard;
    }
}
