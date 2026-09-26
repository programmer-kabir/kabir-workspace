<?php
/**
 * DayalStock – Centralised Download Permission Helper
 *
 * Usage:
 *   require_once __DIR__ . '/../helper/download_permission.php';
 *   $perm = getDownloadPermission($mysqli, $user_id, $content_id, $user_roles);
 *   if (!$perm['allowed']) { http_response_code(403); exit($perm['message']); }
 */
function getDownloadPermission(mysqli $mysqli, int $user_id, int $content_id, array $user_roles = []): array
{
    // ── 0. Admin bypass – admins have unlimited downloads ───────────────────
    $is_admin = in_array('admin', $user_roles, true) || in_array('superadmin', $user_roles, true);
    if ($is_admin) {
        return [
            'allowed'                        => true,
            'message'                        => 'Admin: unlimited access.',
            'is_premium'                     => false,
            'content_type'                   => 'image',
            'has_active_sub'                 => true,
            'limit'                          => PHP_INT_MAX,
            'total'                          => 0,
            'period'                         => 'unlimited',
            'already_downloaded_this_period' => false,
        ];
    }

    // ── 1. Fetch content metadata ────────────────────────────────────────────
    $is_premium = false;
    $content_type = 'image';

    if ($content_id > 0) {
        $stmt = $mysqli->prepare("SELECT is_premium, content_type FROM contents WHERE id = ?");
        $stmt->bind_param("i", $content_id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0) {
            return ['allowed' => false, 'message' => 'Content not found.'];
        }
        $row          = $res->fetch_assoc();
        $is_premium   = (bool) $row['is_premium'];
        $content_type = strtolower(trim($row['content_type']));
    }

    // ── 2. Resolve subscription / limits ────────────────────────────────────
    $img_limit      = 0;
    $vid_limit      = 0;
    $period         = 'daily';
    $has_active_sub = false;
    $start_date     = null;

    $sub_sql = "
        SELECT sp.image_limit, sp.video_limit, sp.limit_period, us.start_date
        FROM user_subscriptions us
        JOIN subscription_plans sp ON sp.id = us.plan_id
        WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= NOW()
        ORDER BY us.id DESC LIMIT 1
    ";
    $sub_stmt = $mysqli->prepare($sub_sql);
    $sub_stmt->bind_param("i", $user_id);
    $sub_stmt->execute();
    $sub_res = $sub_stmt->get_result();

    if ($sub_res->num_rows > 0) {
        $sub_row        = $sub_res->fetch_assoc();
        $img_limit      = (int) $sub_row['image_limit'];
        $vid_limit      = (int) $sub_row['video_limit'];
        $period         = strtolower($sub_row['limit_period']);
        $start_date     = $sub_row['start_date'];
        $has_active_sub = true;
    } else {
        // Free plan fallback
        $free_sql = "SELECT image_limit, video_limit, limit_period FROM subscription_plans WHERE price = 0 OR slug = 'free' ORDER BY price ASC LIMIT 1";
        $free_res = $mysqli->query($free_sql);
        if ($free_res && $free_res->num_rows > 0) {
            $free_row  = $free_res->fetch_assoc();
            $img_limit = (int) $free_row['image_limit'];
            $vid_limit = (int) $free_row['video_limit'];
            $period    = strtolower($free_row['limit_period']);
            // Free users have NO start_date — period window handled below
        }
    }

    // ── 3. Block premium content for free users ──────────────────────────────
    if ($content_id > 0 && $is_premium && !$has_active_sub) {
        return [
            'allowed'        => false,
            'message'        => 'This is premium content. Please purchase a subscription to download.',
            'is_premium'     => $is_premium,
            'content_type'   => $content_type,
            'has_active_sub' => false,
            'limit'          => 0,
            'total'          => 0,
            'period'         => $period,
        ];
    }

    // ── 4. Determine applicable limit for this content type ──────────────────
    $limit = ($content_type === 'video') ? $vid_limit : $img_limit;

    // ── 5. Compute billing-cycle window ─────────────────────────────────────
    $now = new DateTime();

    if ($period === 'monthly') {
        if ($start_date) {
            // Paid subscription: use exact billing cycle from subscription start_date
            $cycle_start = new DateTime($start_date);
            while ($cycle_start <= $now) {
                $next = clone $cycle_start;
                $next->modify('+1 month');
                if ($next > $now) break;
                $cycle_start = $next;
            }
            $cycle_end = clone $cycle_start;
            $cycle_end->modify('+1 month')->modify('-1 second');
            $start_str = $cycle_start->format('Y-m-d H:i:s');
            $end_str   = $cycle_end->format('Y-m-d H:i:s');
        } else {
            // Free user with monthly limit: use the current calendar month
            $start_str = $now->format('Y-m-01 00:00:00');
            $end_str   = $now->format('Y-m-t 23:59:59');
        }
    } else {
        // Daily window
        $start_str = $now->format('Y-m-d 00:00:00');
        $end_str   = $now->format('Y-m-d 23:59:59');
    }

    // ── 6. Count DISTINCT contents downloaded of this type in the period ─────
    $count_sql = "
        SELECT 
            COUNT(DISTINCT CASE WHEN c.content_type != 'video' THEN dh.content_id END) AS image_total,
            COUNT(DISTINCT CASE WHEN c.content_type = 'video' THEN dh.content_id END) AS video_total
        FROM downloads_history dh
        JOIN contents c ON dh.content_id = c.id
        WHERE dh.user_id = ?
          AND dh.downloaded_at BETWEEN ? AND ?
    ";
    $count_stmt = $mysqli->prepare($count_sql);
    $count_stmt->bind_param("iss", $user_id, $start_str, $end_str);
    $count_stmt->execute();
    $counts = $count_stmt->get_result()->fetch_assoc();
    $image_total = (int) $counts['image_total'];
    $video_total = (int) $counts['video_total'];
    $total_downloads = ($content_type === 'video') ? $video_total : $image_total;

    // ── 7. Check if THIS content was already downloaded this billing period ──
    // If yes, allow re-download (any file, any format) without a new credit.
    $already_downloaded_this_period = false;
    if ($content_id > 0) {
        $hist_sql = "
            SELECT id FROM downloads_history
            WHERE user_id = ? AND content_id = ?
              AND downloaded_at BETWEEN ? AND ?
            LIMIT 1
        ";
        $hist_stmt = $mysqli->prepare($hist_sql);
        $hist_stmt->bind_param("iiss", $user_id, $content_id, $start_str, $end_str);
        $hist_stmt->execute();
        $already_downloaded_this_period = $hist_stmt->get_result()->num_rows > 0;
    }

    // ── 8. Enforce limit ────────────────────────────────────────────────────
    // Re-downloading same content within the billing period is always free.
    // New content requires an unused credit.
    if (!$already_downloaded_this_period && $total_downloads >= $limit) {
        $type_label = ($content_type === 'video') ? 'videos' : 'images';
        $msg = ($period === 'monthly')
            ? "Download limit reached. Upgrade to continue."
            : "Daily download limit reached. Upgrade to continue.";

        return [
            'allowed'                        => false,
            'message'                        => $msg,
            'upgrade_required'               => true,
            'is_premium'                     => $is_premium,
            'content_type'                   => $content_type,
            'has_active_sub'                 => $has_active_sub,
            'limit'                          => $limit,
            'total'                          => $total_downloads,
            'image_limit'                    => $img_limit,
            'video_limit'                    => $vid_limit,
            'image_total'                    => $image_total,
            'video_total'                    => $video_total,
            'period'                         => $period,
            'already_downloaded_this_period' => false,
        ];
    }

    return [
        'allowed'                        => true,
        'message'                        => 'Download allowed.',
        'is_premium'                     => $is_premium,
        'content_type'                   => $content_type,
        'has_active_sub'                 => $has_active_sub,
        'limit'                          => $limit,
        'total'                          => $total_downloads,
        'image_limit'                    => $img_limit,
        'video_limit'                    => $vid_limit,
        'image_total'                    => $image_total,
        'video_total'                    => $video_total,
        'period'                         => $period,
        'start_date'                     => $start_date,
        'already_downloaded_this_period' => $already_downloaded_this_period,
    ];
}

/**
 * Record a download credit.
 * Only inserts if this content was NOT already downloaded in the current billing period.
 */
function recordDownload(mysqli $mysqli, int $user_id, int $content_id, array $perm): void
{
    if ($perm['already_downloaded_this_period'] ?? false) {
        // Re-download of same content — no new credit consumed.
        return;
    }

    // Also skip for admin (unlimited)
    if (($perm['period'] ?? '') === 'unlimited') {
        return;
    }

    $mysqli->begin_transaction();
    try {
        $ins = $mysqli->prepare("INSERT INTO downloads_history (user_id, content_id, downloaded_at) VALUES (?, ?, NOW())");
        $ins->bind_param("ii", $user_id, $content_id);
        $ins->execute();
        $ins->close();

        $upd = $mysqli->prepare("UPDATE contents SET downloads_count = downloads_count + 1 WHERE id = ?");
        $upd->bind_param("i", $content_id);
        $upd->execute();
        $upd->close();

        $mysqli->commit();
    } catch (Exception $e) {
        $mysqli->rollback();
    }
}
