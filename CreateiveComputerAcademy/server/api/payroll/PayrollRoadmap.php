<?php
/**
 * PayrollRoadmap.php — Contract Tiers & Staggered Roadmap Engine
 *
 * Dedicated engine to manage contract tiers and compute progress roadmaps,
 * tier promotions, monthly span milestones, and active hourly rates for Staggered Contracts.
 */

class PayrollRoadmap {

    /**
     * Fetch contract tiers for a scheme
     *
     * @param PDO $pdo
     * @param int $schemeId
     * @return array
     */
    public static function getContractTiers($pdo, $schemeId) {
        if (!$pdo || !$schemeId) return [];
        try {
            $stmt = $pdo->prepare("SELECT * FROM staff_contract_tiers WHERE scheme_id = :scheme_id ORDER BY tier_number ASC");
            $stmt->execute([':scheme_id' => $schemeId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            error_log("Error in PayrollRoadmap::getContractTiers: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Save/replace contract tiers for a scheme
     *
     * @param PDO   $pdo
     * @param int   $schemeId
     * @param int   $userId
     * @param array $tiers
     * @param int   $workingDays
     * @param float $dailyHours
     */
    public static function saveContractTiers($pdo, $schemeId, $userId, $tiers, $workingDays = 26, $dailyHours = 8.0) {
        if (!$pdo || !$schemeId || empty($tiers) || !is_array($tiers)) return;

        try {
            $pdo->prepare("DELETE FROM staff_contract_tiers WHERE scheme_id = :scheme_id")->execute([':scheme_id' => $schemeId]);

            $insStmt = $pdo->prepare("
                INSERT INTO staff_contract_tiers (
                    scheme_id, user_id, tier_number, tier_name,
                    start_month_index, end_month_index, monthly_salary,
                    hourly_rate, working_days_per_month, standard_daily_hours, status, created_at
                ) VALUES (
                    :scheme_id, :user_id, :tier_number, :tier_name,
                    :start_month_index, :end_month_index, :monthly_salary,
                    :hourly_rate, :working_days_per_month, :standard_daily_hours, 'pending', NOW()
                )
            ");

            $dailyHours = max(0.1, floatval($dailyHours));
            $workingDays = max(1, intval($workingDays));
            $dailyMins = PayrollHelper::getStandardDailyMinutes($dailyHours);
            $effectiveDailyHours = $dailyMins / 60.0;
            $monthlyHours = $workingDays * $effectiveDailyHours;

            foreach ($tiers as $idx => $t) {
                $tNum = isset($t['tier_number']) ? intval($t['tier_number']) : ($idx + 1);
                $tName = !empty($t['tier_name']) ? trim($t['tier_name']) : "Tier {$tNum}";
                $sIdx = isset($t['start_month_index']) ? intval($t['start_month_index']) : (($idx * 3) + 1);
                $eIdx = isset($t['end_month_index']) ? intval($t['end_month_index']) : (($idx + 1) * 3);
                $salary = floatval($t['monthly_salary'] ?? 0.0);
                $rate = ($monthlyHours > 0) ? round($salary / $monthlyHours, 6) : 0.0;

                $insStmt->execute([
                    ':scheme_id' => $schemeId,
                    ':user_id' => $userId,
                    ':tier_number' => $tNum,
                    ':tier_name' => $tName,
                    ':start_month_index' => $sIdx,
                    ':end_month_index' => $eIdx,
                    ':monthly_salary' => $salary,
                    ':hourly_rate' => $rate,
                    ':working_days_per_month' => $workingDays,
                    ':standard_daily_hours' => $dailyHours
                ]);
            }
        } catch (Throwable $e) {
            error_log("Error in PayrollRoadmap::saveContractTiers: " . $e->getMessage());
        }
    }

    /**
     * Resolve the active tier and rate for a specific date or YYYY-MM
     *
     * @param array       $scheme
     * @param string      $dateOrMonth
     * @param array|null  $tiers
     * @return array
     */
    public static function getTierInfoForMonth($scheme, $dateOrMonth, $tiers = null) {
        $defaultRate = floatval($scheme['hourly_rate'] ?? 0.0);
        $defaultSalary = floatval($scheme['salary_amount'] ?? 0.0);

        if (empty($scheme['contract_start_date'])) {
            return [
                'tier_number' => null,
                'tier_name' => null,
                'monthly_salary' => $defaultSalary,
                'hourly_rate' => $defaultRate,
                'month_index' => 1
            ];
        }

        $startTs = strtotime($scheme['contract_start_date']);
        $startYear = (int)date('Y', $startTs);
        $startMonth = (int)date('n', $startTs);

        $targetTs = strtotime((strlen($dateOrMonth) === 7 ? $dateOrMonth . '-01' : $dateOrMonth));
        $targetYear = (int)date('Y', $targetTs);
        $targetMonth = (int)date('n', $targetTs);

        $monthIndex = ($targetYear - $startYear) * 12 + ($targetMonth - $startMonth) + 1;
        if ($monthIndex < 1) $monthIndex = 1;

        if (($scheme['scheme_type'] ?? '') !== 'STAGGERED_CONTRACT' || empty($tiers)) {
            return [
                'tier_number' => null,
                'tier_name' => null,
                'monthly_salary' => $defaultSalary,
                'hourly_rate' => $defaultRate,
                'month_index' => $monthIndex
            ];
        }

        // Match against existing tiers
        foreach ($tiers as $t) {
            $sIdx = intval($t['start_month_index']);
            $eIdx = intval($t['end_month_index']);
            if ($monthIndex >= $sIdx && $monthIndex <= $eIdx) {
                return [
                    'tier_number' => intval($t['tier_number']),
                    'tier_name' => $t['tier_name'],
                    'monthly_salary' => floatval($t['monthly_salary']),
                    'hourly_rate' => floatval($t['hourly_rate']),
                    'month_index' => $monthIndex
                ];
            }
        }

        // If month index exceeds, return final tier
        $lastTier = end($tiers);
        return [
            'tier_number' => intval($lastTier['tier_number']),
            'tier_name' => $lastTier['tier_name'],
            'monthly_salary' => floatval($lastTier['monthly_salary']),
            'hourly_rate' => floatval($lastTier['hourly_rate']),
            'month_index' => $monthIndex
        ];
    }

    /**
     * Build visual roadmap object for Staggered Contracts
     *
     * @param array    $scheme
     * @param array    $tiers
     * @param float    $totalEarned
     * @param PDO|null $pdo
     * @param int|null $userId
     * @return array|null
     */
    public static function buildContractRoadmap($scheme, $tiers, $totalEarned, $pdo = null, $userId = null) {
        if (($scheme['scheme_type'] ?? '') !== 'STAGGERED_CONTRACT' || empty($tiers)) {
            return null;
        }

        $contractStart = !empty($scheme['contract_start_date']) ? $scheme['contract_start_date'] : date('Y-m-d');
        $contractTarget = floatval($scheme['contract_amount'] ?: 60000.0);
        $startTs = strtotime($contractStart);
        $startYear = (int)date('Y', $startTs);
        $startMonth = (int)date('n', $startTs);

        $nowYear = (int)date('Y');
        $nowMonth = (int)date('n');
        $currentMonthIndex = max(1, ($nowYear - $startYear) * 12 + ($nowMonth - $startMonth) + 1);
        $today = date('Y-m-d');
        $todayTs = strtotime($today);

        $tierList = [];
        $activeTier = null;
        $totalContractMonths = intval($scheme['contract_duration_months'] ?: 12);

        foreach ($tiers as $idx => $t) {
            $tNum = intval($t['tier_number']);
            $sIdx = intval($t['start_month_index']);
            $eIdx = intval($t['end_month_index']);
            $sal = floatval($t['monthly_salary']);
            $rate = floatval($t['hourly_rate']);

            // Precise date boundaries for this tier
            $tierStartDate = date('Y-m-d', strtotime("+" . ($sIdx - 1) . " months", $startTs));
            $nextMonthStart = date('Y-m-d', strtotime("+" . $eIdx . " months", $startTs));
            $tierEndDate = date('Y-m-d', strtotime("-1 day", strtotime($nextMonthStart)));
            $totalDays = max(1, (int)round((strtotime($tierEndDate) - strtotime($tierStartDate)) / 86400) + 1);

            $status = 'upcoming';
            $daysElapsed = 0;
            $daysRemaining = $totalDays;

            if ($today > $tierEndDate) {
                $status = 'completed';
                $daysElapsed = $totalDays;
                $daysRemaining = 0;
            } elseif ($today >= $tierStartDate && $today <= $tierEndDate) {
                $status = 'active';
                $daysElapsed = max(1, (int)round(($todayTs - strtotime($tierStartDate)) / 86400) + 1);
                $daysRemaining = max(0, (int)round((strtotime($tierEndDate) - $todayTs) / 86400));
            } else {
                $status = 'upcoming';
                $daysElapsed = 0;
                $daysRemaining = $totalDays;
            }

            // Attendance days worked in this tier
            $attendanceDays = 0;
            if ($pdo && $userId) {
                try {
                    $stmtAttCount = $pdo->prepare("
                        SELECT COUNT(DISTINCT work_date) 
                        FROM staff_work_earnings 
                        WHERE user_id = :user_id 
                          AND work_date BETWEEN :t_start AND :t_end
                    ");
                    $stmtAttCount->execute([
                        ':user_id' => $userId,
                        ':t_start' => $tierStartDate,
                        ':t_end' => $tierEndDate
                    ]);
                    $attendanceDays = intval($stmtAttCount->fetchColumn() ?: 0);
                } catch (Throwable $e) {}
            }

            $daysProgress = min(100.0, round(($daysElapsed / $totalDays) * 100, 1));
            $nextTier = isset($tiers[$idx + 1]) ? $tiers[$idx + 1] : null;

            $tObj = [
                'tier_number' => $tNum,
                'tier_name' => $t['tier_name'],
                'start_month_index' => $sIdx,
                'end_month_index' => $eIdx,
                'month_span_label' => "Month {$sIdx}–{$eIdx}",
                'start_date' => $tierStartDate,
                'end_date' => $tierEndDate,
                'total_days' => $totalDays,
                'days_elapsed' => $daysElapsed,
                'days_remaining' => $daysRemaining,
                'days_progress' => $daysProgress,
                'attendance_days' => $attendanceDays,
                'next_promotion_date' => $nextTier ? $nextMonthStart : null,
                'next_tier_salary' => $nextTier ? floatval($nextTier['monthly_salary']) : null,
                'next_tier_name' => $nextTier ? $nextTier['tier_name'] : null,
                'monthly_salary' => $sal,
                'hourly_rate' => $rate,
                'status' => $status
            ];

            if ($status === 'active') {
                $tObj['months_remaining_in_tier'] = max(0, $eIdx - $currentMonthIndex + 1);
                $activeTier = $tObj;
            }

            $tierList[] = $tObj;
        }

        if (!$activeTier && !empty($tierList)) {
            $lastT = end($tierList);
            $activeTier = ($today > $lastT['end_date']) 
                ? $lastT 
                : $tierList[0];
        }

        return [
            'scheme_type' => 'STAGGERED_CONTRACT',
            'contract_amount' => $contractTarget,
            'total_earned' => round($totalEarned, 2),
            'remaining_contract' => max(0.0, round($contractTarget - $totalEarned, 2)),
            'progress_percent' => $contractTarget > 0 ? min(100.0, round(($totalEarned / $contractTarget) * 100, 1)) : 100.0,
            'current_month_index' => $currentMonthIndex,
            'total_months' => $totalContractMonths,
            'active_tier' => $activeTier,
            'tiers' => $tierList
        ];
    }
}

