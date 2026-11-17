<?php
/**
 * PayrollSync.php — Attendance & Mango Claims Earnings Synchronization
 *
 * Dedicated engine to sync daily attendance records and approved Mango Full Day breaks
 * into `staff_work_earnings` with tier-aware hourly rates, 40-minute break deductibility,
 * and contract threshold surplus tracking.
 */

class PayrollSync {

    /**
     * Synchronize attendance records into staff_work_earnings for active pay schemes.
     *
     * @param PDO      $pdo
     * @param int|null $userId
     * @param int|null $schemeId
     * @return array
     */
    public static function syncAttendanceEarnings($pdo, $userId = null, $schemeId = null) {
        if (!$pdo) {
            return ['status' => 'error', 'message' => 'Invalid database connection'];
        }

        $schemes = [];
        if ($schemeId) {
            $stmt = $pdo->prepare("SELECT * FROM staff_pay_schemes WHERE id = :id AND status = 'active'");
            $stmt->execute([':id' => $schemeId]);
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } elseif ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM staff_pay_schemes WHERE user_id = :user_id AND status = 'active' ORDER BY id DESC");
            $stmt->execute([':user_id' => $userId]);
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $pdo->query("SELECT * FROM staff_pay_schemes WHERE status = 'active' ORDER BY id DESC");
            $schemes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $totalSyncedSessions = 0;
        $totalSyncedAmount = 0.0;

        foreach ($schemes as $scheme) {
            $sId = $scheme['id'];
            $uId = $scheme['user_id'];
            $startDate = $scheme['contract_start_date'];
            $endDate = !empty($scheme['contract_end_date']) ? $scheme['contract_end_date'] : null;
            $hourlyRate = floatval($scheme['hourly_rate']);
            $tiers = PayrollHelper::getContractTiers($pdo, $sId);

            // Find all attendance records within contract period
            $sql = "
                SELECT id, user_id, date, check_in, check_out, status
                FROM attendance
                WHERE user_id = :user_id
                  AND date >= :start_date
                  " . ($endDate ? "AND date <= :end_date" : "") . "
                  AND check_in IS NOT NULL AND check_in != ''
                  AND check_out IS NOT NULL AND check_out != ''
                  AND status IN ('Present', 'Late', 'Half Day')
                ORDER BY date ASC, check_in ASC
            ";

            $params = [
                ':user_id' => $uId,
                ':start_date' => $startDate,
            ];
            if ($endDate) {
                $params[':end_date'] = $endDate;
            }

            $stmtAtt = $pdo->prepare($sql);
            $stmtAtt->execute($params);
            $attendances = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($attendances as $att) {
                $attId = $att['id'];
                $attDate = $att['date'];
                $checkInRaw = trim($att['check_in']);
                $checkOutRaw = trim($att['check_out']);

                // Normalize check-in / check-out timestamps
                $inTimeStr = (strpos($checkInRaw, ' ') !== false) ? $checkInRaw : ($attDate . ' ' . $checkInRaw);
                $outTimeStr = (strpos($checkOutRaw, ' ') !== false) ? $checkOutRaw : ($attDate . ' ' . $checkOutRaw);

                $inTs = strtotime($inTimeStr);
                $outTs = strtotime($outTimeStr);

                if ($outTs <= $inTs) {
                    continue; // Skip invalid or zero durations
                }

                $rawMinutes = max(1, intval(round(($outTs - $inTs) / 60)));

                // Deduct any completed breaks taken by user on this day (Breaks earn ৳ 0)
                $stmtBreak = $pdo->prepare("
                    SELECT COALESCE(SUM(duration_minutes), 0)
                    FROM user_breaks
                    WHERE user_id = :user_id 
                      AND date = :date 
                      AND status = 'Completed'
                ");
                $stmtBreak->execute([':user_id' => $uId, ':date' => $attDate]);
                $totalBreakMinutes = intval($stmtBreak->fetchColumn());

                // Option B: 40 minutes allocated paid break included in 8h shift. Excess break beyond 40m is deducted.
                $allocatedBreakMinutes = 40;
                $excessBreakMinutes = max(0, $totalBreakMinutes - $allocatedBreakMinutes);
                $netPaidMinutes = max(0, $rawMinutes - $excessBreakMinutes);

                $standardDailyHours = floatval($scheme['standard_daily_hours'] ?: 8.0);
                $standardDailyMinutes = PayrollHelper::getStandardDailyMinutes($standardDailyHours);
                $approvedMinutes = min($netPaidMinutes, $standardDailyMinutes);

                // Tier-aware active hourly rate for this date
                $dayTierInfo = PayrollHelper::getTierInfoForMonth($scheme, $attDate, $tiers);
                $activeDayRate = $dayTierInfo['hourly_rate'] ?: $hourlyRate;

                $earnedAmount = round(($approvedMinutes / 60.0) * $activeDayRate, 2);
                $sessionStart = date('Y-m-d H:i:s', $inTs);
                $sessionEnd = date('Y-m-d H:i:s', $outTs);
                $dispCapHours = round($standardDailyMinutes / 60.0, 2);
                $notes = "Attendance Work Session ({$att['status']}): {$checkInRaw} to {$checkOutRaw} [Total: {$rawMinutes}m, Break: {$totalBreakMinutes}m (Excess: {$excessBreakMinutes}m), Paid Work: {$approvedMinutes}m]" . ($rawMinutes > $standardDailyMinutes ? " [Capped at {$dispCapHours}h ({$standardDailyMinutes}m); overtime to Mango Bank]" : "");

                // Check if already in staff_work_earnings
                $stmtCheck = $pdo->prepare("
                    SELECT id FROM staff_work_earnings 
                    WHERE scheme_id = :scheme_id 
                      AND source_type = 'attendance' 
                      AND reference_id = :reference_id
                    LIMIT 1
                ");
                $stmtCheck->execute([
                    ':scheme_id' => $sId,
                    ':reference_id' => $attId
                ]);
                $existingEarning = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existingEarning) {
                    $stmtUpdate = $pdo->prepare("
                        UPDATE staff_work_earnings SET
                            work_date = :work_date,
                            session_start = :session_start,
                            session_end = :session_end,
                            approved_minutes = :approved_minutes,
                            applied_rate = :applied_rate,
                            earned_amount = :earned_amount,
                            notes = :notes
                        WHERE id = :id
                    ");
                    $stmtUpdate->execute([
                        ':work_date' => $attDate,
                        ':session_start' => $sessionStart,
                        ':session_end' => $sessionEnd,
                        ':approved_minutes' => $approvedMinutes,
                        ':applied_rate' => $activeDayRate,
                        ':earned_amount' => $earnedAmount,
                        ':notes' => $notes,
                        ':id' => $existingEarning['id']
                    ]);
                } else {
                    $stmtInsert = $pdo->prepare("
                        INSERT INTO staff_work_earnings (
                            user_id, scheme_id, work_date, session_start, session_end,
                            approved_minutes, applied_rate, earned_amount, is_surplus,
                            source_type, reference_id, notes, created_at
                        ) VALUES (
                            :user_id, :scheme_id, :work_date, :session_start, :session_end,
                            :approved_minutes, :applied_rate, :earned_amount, 0,
                            'attendance', :reference_id, :notes, NOW()
                        )
                    ");
                    $stmtInsert->execute([
                        ':user_id' => $uId,
                        ':scheme_id' => $sId,
                        ':work_date' => $attDate,
                        ':session_start' => $sessionStart,
                        ':session_end' => $sessionEnd,
                        ':approved_minutes' => $approvedMinutes,
                        ':applied_rate' => $activeDayRate,
                        ':earned_amount' => $earnedAmount,
                        ':reference_id' => $attId,
                        ':notes' => $notes
                    ]);
                }

                $totalSyncedSessions++;
                $totalSyncedAmount += $earnedAmount;
            }

            // Also sync approved mango full day breaks from user_breaks into staff_work_earnings so leave day is fully paid
            try {
                $sqlMango = "
                    SELECT id, user_id, date, duration_minutes, reason 
                    FROM user_breaks 
                    WHERE user_id = :user_id 
                      AND break_type = 'Mango Full Day'
                      AND status = 'Approved'
                      AND date >= :start_date
                      " . ($endDate ? "AND date <= :end_date" : "") . "
                ";
                $stmtMangoClaims = $pdo->prepare($sqlMango);
                $stmtMangoClaims->execute($params);
                $mangoClaims = $stmtMangoClaims->fetchAll(PDO::FETCH_ASSOC);

                foreach ($mangoClaims as $mc) {
                    $mcId = $mc['id'];
                    $mcDate = $mc['date'];
                    $mcMinutes = intval($mc['duration_minutes'] ?: 480);
                    $mcHours = round($mcMinutes / 60.0, 2);
                    $mcTierInfo = PayrollHelper::getTierInfoForMonth($scheme, $mcDate, $tiers);
                    $mcRate = $mcTierInfo['hourly_rate'] ?: $hourlyRate;
                    $mcEarned = round($mcHours * $mcRate, 2);
                    $mcNotes = "Paid Mango Day Off (Redeemed {$mcHours}h Break from Overtime Bank)";

                    $stmtCheckMc = $pdo->prepare("
                        SELECT id FROM staff_work_earnings 
                        WHERE scheme_id = :scheme_id 
                          AND source_type = 'mango_leave' 
                          AND reference_id = :reference_id
                        LIMIT 1
                    ");
                    $stmtCheckMc->execute([
                        ':scheme_id' => $sId,
                        ':reference_id' => $mcId
                    ]);
                    $existingMcEarning = $stmtCheckMc->fetch(PDO::FETCH_ASSOC);

                    if (!$existingMcEarning) {
                        $stmtInsMc = $pdo->prepare("
                            INSERT INTO staff_work_earnings (
                                user_id, scheme_id, work_date, session_start, session_end,
                                approved_minutes, applied_rate, earned_amount, is_surplus,
                                source_type, reference_id, notes, created_at
                            ) VALUES (
                                :user_id, :scheme_id, :work_date, :session_start, :session_end,
                                :approved_minutes, :applied_rate, :earned_amount, 0,
                                'mango_leave', :reference_id, :notes, NOW()
                            )
                        ");
                        $stmtInsMc->execute([
                            ':user_id' => $uId,
                            ':scheme_id' => $sId,
                            ':work_date' => $mcDate,
                            ':session_start' => $mcDate . ' 09:00:00',
                            ':session_end' => $mcDate . ' 17:00:00',
                            ':approved_minutes' => $mcMinutes,
                            ':applied_rate' => $mcRate,
                            ':earned_amount' => $mcEarned,
                            ':reference_id' => $mcId,
                            ':notes' => $mcNotes
                        ]);
                        $totalSyncedSessions++;
                        $totalSyncedAmount += $mcEarned;
                    }
                }
            } catch (Throwable $tMango) {
                error_log("Error syncing mango claims to earnings: " . $tMango->getMessage());
            }

            // Recalculate surplus flags chronologically for yearly contract schemes
            if ($scheme['scheme_type'] === 'YEARLY_CONTRACT') {
                $contractTarget = floatval($scheme['contract_amount']);
                $stmtAll = $pdo->prepare("
                    SELECT id, earned_amount 
                    FROM staff_work_earnings 
                    WHERE scheme_id = :scheme_id 
                    ORDER BY work_date ASC, session_start ASC, id ASC
                ");
                $stmtAll->execute([':scheme_id' => $sId]);
                $allEarnings = $stmtAll->fetchAll(PDO::FETCH_ASSOC);

                $runningEarned = 0.0;
                $stmtUpdateSurplus = $pdo->prepare("UPDATE staff_work_earnings SET is_surplus = :is_surplus WHERE id = :id");

                foreach ($allEarnings as $row) {
                    $rowEarned = floatval($row['earned_amount']);
                    $isSurplus = ($runningEarned >= $contractTarget) ? 1 : 0;
                    $stmtUpdateSurplus->execute([
                        ':is_surplus' => $isSurplus,
                        ':id' => $row['id']
                    ]);
                    $runningEarned += $rowEarned;
                }
            }
        }

        return [
            'status' => 'success',
            'synced_sessions' => $totalSyncedSessions,
            'synced_amount' => round($totalSyncedAmount, 2),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

