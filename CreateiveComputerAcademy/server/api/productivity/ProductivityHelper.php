<?php
require_once __DIR__ . '/../gamification/GamificationHelper.php';

class ProductivityHelper {

    /**
     * Self-healing database schema for productivity tables.
     */
    public static function ensureSchema($db) {
        if (!$db) return;

        try {
            // 1. Staff Daily 1-3-5 Plans
            $db->exec("
                CREATE TABLE IF NOT EXISTS `staff_daily_plans` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `plan_date` DATE NOT NULL,
                    `major_goal` TEXT NULL,
                    `major_completed` TINYINT(1) NOT NULL DEFAULT 0,
                    `medium_goals` LONGTEXT NULL,
                    `small_goals` LONGTEXT NULL,
                    `xp_awarded` TINYINT(1) NOT NULL DEFAULT 0,
                    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY `uniq_user_plan_date` (`user_id`, `plan_date`),
                    INDEX (`user_id`),
                    INDEX (`plan_date`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // 2. Staff Persistent Scratchpad
            $db->exec("
                CREATE TABLE IF NOT EXISTS `staff_scratchpads` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL UNIQUE,
                    `content` LONGTEXT NULL,
                    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX (`user_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");
        } catch (Throwable $e) {
            error_log("ProductivityHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    /**
     * Fetch daily plan for a user and date. Auto-creates empty plan if not exists.
     */
    public static function getDailyPlan($db, $userId, $date = null) {
        self::ensureSchema($db);
        $userId = intval($userId);
        if ($userId <= 0) return null;
        if (!$date) $date = date('Y-m-d');

        $stmt = $db->prepare("SELECT * FROM staff_daily_plans WHERE user_id = :uid AND plan_date = :dt LIMIT 1");
        $stmt->execute([':uid' => $userId, ':dt' => $date]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$plan) {
            return [
                'user_id'         => $userId,
                'plan_date'       => $date,
                'major_goal'      => '',
                'major_completed' => 0,
                'medium_goals'    => [],
                'small_goals'     => [],
                'xp_awarded'      => 0,
                'total_items'     => 0,
                'done_items'      => 0,
                'completion_pct'  => 0,
                'is_past_date'    => ($date < date('Y-m-d'))
            ];
        }

        $rawMedium = json_decode($plan['medium_goals'] ?? '[]', true);
        $mediumGoals = [];
        if (is_array($rawMedium)) {
            foreach ($rawMedium as $idx => $mg) {
                if (!empty(trim($mg['text'] ?? ''))) {
                    $mediumGoals[] = [
                        'id'        => $mg['id'] ?? "med_{$idx}",
                        'text'      => trim($mg['text']),
                        'completed' => !empty($mg['completed'])
                    ];
                }
            }
        }

        $rawSmall = json_decode($plan['small_goals'] ?? '[]', true);
        $smallGoals = [];
        if (is_array($rawSmall)) {
            foreach ($rawSmall as $idx => $sg) {
                if (!empty(trim($sg['text'] ?? ''))) {
                    $smallGoals[] = [
                        'id'        => $sg['id'] ?? "sm_{$idx}",
                        'text'      => trim($sg['text']),
                        'completed' => !empty($sg['completed'])
                    ];
                }
            }
        }

        // Calculate progress percentage
        $totalItems = 0;
        $doneItems = 0;

        if (!empty(trim($plan['major_goal'] ?? ''))) {
            $totalItems++;
            if (!empty($plan['major_completed'])) $doneItems++;
        }

        foreach ($mediumGoals as $mg) {
            $totalItems++;
            if (!empty($mg['completed'])) $doneItems++;
        }

        foreach ($smallGoals as $sg) {
            $totalItems++;
            if (!empty($sg['completed'])) $doneItems++;
        }

        $completionPct = $totalItems > 0 ? round(($doneItems / $totalItems) * 100) : 0;

        return [
            'id'              => intval($plan['id']),
            'user_id'         => $userId,
            'plan_date'       => $plan['plan_date'],
            'major_goal'      => $plan['major_goal'] ?? '',
            'major_completed' => intval($plan['major_completed']),
            'medium_goals'    => $mediumGoals,
            'small_goals'     => $smallGoals,
            'xp_awarded'      => intval($plan['xp_awarded']),
            'total_items'     => $totalItems,
            'done_items'      => $doneItems,
            'completion_pct'  => $completionPct,
            'is_past_date'    => ($plan['plan_date'] < date('Y-m-d'))
        ];
    }

    /**
     * Save daily 1-3-5 plan and award XP if fully completed.
     * Past dates rule: cannot add new goals or alter text; can only update checkmark completion.
     */
    public static function saveDailyPlan($db, $userId, $planDate, $majorGoal, $majorCompleted, $mediumGoals, $smallGoals) {
        self::ensureSchema($db);
        $userId = intval($userId);
        if ($userId <= 0) throw new InvalidArgumentException("Invalid user ID");
        if (!$planDate) $planDate = date('Y-m-d');

        $today = date('Y-m-d');
        $isPastDate = ($planDate < $today);

        // Filter and clean incoming arrays
        $cleanMedium = [];
        if (is_array($mediumGoals)) {
            foreach ($mediumGoals as $idx => $mg) {
                if (!empty(trim($mg['text'] ?? ''))) {
                    $cleanMedium[] = [
                        'id'        => $mg['id'] ?? "med_{$idx}",
                        'text'      => trim($mg['text']),
                        'completed' => !empty($mg['completed'])
                    ];
                }
            }
        }

        $cleanSmall = [];
        if (is_array($smallGoals)) {
            foreach ($smallGoals as $idx => $sg) {
                if (!empty(trim($sg['text'] ?? ''))) {
                    $cleanSmall[] = [
                        'id'        => $sg['id'] ?? "sm_{$idx}",
                        'text'      => trim($sg['text']),
                        'completed' => !empty($sg['completed'])
                    ];
                }
            }
        }

        $majorComp = !empty($majorCompleted) ? 1 : 0;

        // Check existing record
        $stmt = $db->prepare("SELECT * FROM staff_daily_plans WHERE user_id = :uid AND plan_date = :dt LIMIT 1");
        $stmt->execute([':uid' => $userId, ':dt' => $planDate]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        $xpAwarded = $existing ? intval($existing['xp_awarded']) : 0;
        $planId = $existing ? intval($existing['id']) : 0;

        // ── PAST DATE GUARD ──
        if ($isPastDate) {
            if (!$existing) {
                throw new InvalidArgumentException("Cannot create new daily plans for past dates ({$planDate}). You can only view or check off existing items.");
            }

            // Preserve original texts, only update checkmarks!
            $origMajor = $existing['major_goal'];
            $origMedium = json_decode($existing['medium_goals'] ?? '[]', true) ?: [];
            $origSmall = json_decode($existing['small_goals'] ?? '[]', true) ?: [];

            $incomingMedMap = [];
            foreach ($cleanMedium as $cm) {
                $incomingMedMap[$cm['id']] = !empty($cm['completed']);
            }
            foreach ($origMedium as &$om) {
                if (isset($om['id']) && isset($incomingMedMap[$om['id']])) {
                    $om['completed'] = $incomingMedMap[$om['id']];
                }
            }

            $incomingSmallMap = [];
            foreach ($cleanSmall as $cs) {
                $incomingSmallMap[$cs['id']] = !empty($cs['completed']);
            }
            foreach ($origSmall as &$os) {
                if (isset($os['id']) && isset($incomingSmallMap[$os['id']])) {
                    $os['completed'] = $incomingSmallMap[$os['id']];
                }
            }

            $mediumJson = json_encode($origMedium, JSON_UNESCAPED_UNICODE);
            $smallJson = json_encode($origSmall, JSON_UNESCAPED_UNICODE);

            $update = $db->prepare("
                UPDATE staff_daily_plans 
                SET major_completed = :maj_c, 
                    medium_goals = :med, 
                    small_goals = :sm,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $update->execute([
                ':maj_c' => $majorComp,
                ':med'   => $mediumJson,
                ':sm'    => $smallJson,
                ':id'    => $existing['id']
            ]);

            return [
                'id'              => $planId,
                'xp_awarded'      => $xpAwarded,
                'newly_earned_xp' => false,
                'is_past_date'    => true
            ];
        }

        // ── TODAY OR FUTURE DATE: Full adding, editing and deleting allowed ──
        $mediumJson = json_encode($cleanMedium, JSON_UNESCAPED_UNICODE);
        $smallJson = json_encode($cleanSmall, JSON_UNESCAPED_UNICODE);

        if ($existing) {
            $update = $db->prepare("
                UPDATE staff_daily_plans 
                SET major_goal = :maj, 
                    major_completed = :maj_c, 
                    medium_goals = :med, 
                    small_goals = :sm,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $update->execute([
                ':maj'   => trim($majorGoal),
                ':maj_c' => $majorComp,
                ':med'   => $mediumJson,
                ':sm'    => $smallJson,
                ':id'    => $existing['id']
            ]);
        } else {
            $insert = $db->prepare("
                INSERT INTO staff_daily_plans (user_id, plan_date, major_goal, major_completed, medium_goals, small_goals)
                VALUES (:uid, :dt, :maj, :maj_c, :med, :sm)
            ");
            $insert->execute([
                ':uid'   => $userId,
                ':dt'    => $planDate,
                ':maj'   => trim($majorGoal),
                ':maj_c' => $majorComp,
                ':med'   => $mediumJson,
                ':sm'    => $smallJson
            ]);
            $planId = intval($db->lastInsertId());
        }

        // Check if plan has meaningful goals and is 100% completed to award XP
        $hasGoals = !empty(trim($majorGoal));
        $allCompleted = ($majorComp === 1);

        foreach ($cleanMedium as $mg) {
            $hasGoals = true;
            if (empty($mg['completed'])) $allCompleted = false;
        }

        foreach ($cleanSmall as $sg) {
            $hasGoals = true;
            if (empty($sg['completed'])) $allCompleted = false;
        }

        $newlyEarnedXp = false;
        if ($hasGoals && $allCompleted && $xpAwarded === 0) {
            // Award +25 XP via Gamification engine
            GamificationHelper::awardXp($db, $userId, 25, 'daily_plan_complete', "plan_{$planId}", "Completed 1-3-5 Planner for {$planDate}");
            $db->prepare("UPDATE staff_daily_plans SET xp_awarded = 1 WHERE id = :id")->execute([':id' => $planId]);
            $xpAwarded = 1;
            $newlyEarnedXp = true;
        }

        return [
            'id'             => $planId,
            'xp_awarded'     => $xpAwarded,
            'newly_earned_xp'=> $newlyEarnedXp,
            'is_past_date'   => false
        ];
    }

    /**
     * Get persistent scratchpad for user.
     */
    public static function getScratchpad($db, $userId) {
        self::ensureSchema($db);
        $userId = intval($userId);
        if ($userId <= 0) return '';

        $stmt = $db->prepare("SELECT content FROM staff_scratchpads WHERE user_id = :uid LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? ($row['content'] ?? '') : '';
    }

    /**
     * Save scratchpad content for user.
     */
    public static function saveScratchpad($db, $userId, $content) {
        self::ensureSchema($db);
        $userId = intval($userId);
        if ($userId <= 0) throw new InvalidArgumentException("Invalid user ID");

        $stmt = $db->prepare("
            INSERT INTO staff_scratchpads (user_id, content, updated_at)
            VALUES (:uid, :cnt, NOW())
            ON DUPLICATE KEY UPDATE content = :cnt2, updated_at = NOW()
        ");
        $stmt->execute([
            ':uid'  => $userId,
            ':cnt'  => $content,
            ':cnt2' => $content
        ]);

        return true;
    }
}
