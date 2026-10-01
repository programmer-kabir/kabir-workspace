<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header('Content-Type: application/json');

// Only allow admin
requireRole('admin');

$response = [
    'success' => true,
    'today' => [
        'downloads' => 0,
        'revenue' => 0,
        'new_users' => 0,
        'sales' => 0,
        'subscriptions' => 0
    ],
    'chart_data' => [], // array of { date, downloads, revenue, new_users }
    'top_contents' => []
];

// Detect actual latest date from DB to handle Timezone offsets
$latest_date = date('Y-m-d');
$res_latest = $mysqli->query("
    SELECT MAX(d) as max_d FROM (
        SELECT DATE(downloaded_at) as d FROM downloads_history
        UNION
        SELECT DATE(created_at) as d FROM company_earnings
        UNION
        SELECT DATE(created_at) as d FROM users
        UNION
        SELECT DATE(created_at) as d FROM billing_history
    ) as all_dates
");
if ($res_latest && $row_latest = $res_latest->fetch_assoc()) {
    if ($row_latest['max_d'] && $row_latest['max_d'] > $latest_date) {
        $latest_date = $row_latest['max_d'];
    }
}

// Initialize chart data with last 30 days ending at $latest_date
for ($i = 29; $i >= 0; $i--) {
    $dateStr = date('Y-m-d', strtotime("$latest_date -$i days"));
    $response['chart_data'][$dateStr] = [
        'date' => $dateStr,
        'downloads' => 0,
        'revenue' => 0,
        'new_users' => 0
    ];
}

// 1. Fetch Downloads History (last 30 days)
$downloads_query = "
    SELECT DATE(downloaded_at) as d_date, COUNT(*) as count
    FROM downloads_history 
    WHERE downloaded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
    GROUP BY DATE(downloaded_at)
";
$res_dl = $mysqli->query($downloads_query);
if ($res_dl) {
    while ($row = $res_dl->fetch_assoc()) {
        $date = $row['d_date'];
        if (isset($response['chart_data'][$date])) {
            $response['chart_data'][$date]['downloads'] = (int)$row['count'];
        }
        if ($date === $latest_date) {
            $response['today']['downloads'] += (int)$row['count'];
        }
    }
}

// 2. Fetch Revenue (company_earnings) (last 30 days)
$revenue_query = "
    SELECT DATE(created_at) as r_date, SUM(company_earned) as total
    FROM company_earnings 
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
    GROUP BY DATE(created_at)
";
$res_rev = $mysqli->query($revenue_query);
if ($res_rev) {
    while ($row = $res_rev->fetch_assoc()) {
        $date = $row['r_date'];
        if (isset($response['chart_data'][$date])) {
            $response['chart_data'][$date]['revenue'] = (float)$row['total'];
        }
        if ($date === $latest_date) {
            $response['today']['revenue'] += (float)$row['total'];
        }
    }
}

// 3. Fetch New Users (last 30 days)
$users_query = "
    SELECT DATE(created_at) as u_date, COUNT(*) as count
    FROM users 
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
    GROUP BY DATE(created_at)
";
$res_usr = $mysqli->query($users_query);
if ($res_usr) {
    while ($row = $res_usr->fetch_assoc()) {
        $date = $row['u_date'];
        if (isset($response['chart_data'][$date])) {
            $response['chart_data'][$date]['new_users'] = (int)$row['count'];
        }
        if ($date === $latest_date) {
            $response['today']['new_users'] += (int)$row['count'];
        }
    }
}

// 4. Fetch Sales and Subscriptions (billing_history)
$billing_query = "
    SELECT DATE(created_at) as b_date, COUNT(*) as subs_count, SUM(amount) as total_sales
    FROM billing_history 
    WHERE status = 'success' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
    GROUP BY DATE(created_at)
";
$res_billing = $mysqli->query($billing_query);
if ($res_billing) {
    while ($row = $res_billing->fetch_assoc()) {
        $date = $row['b_date'];
        if ($date === $latest_date) {
            $response['today']['sales'] += (float)$row['total_sales'];
            $response['today']['subscriptions'] += (int)$row['subs_count'];
        }
    }
}

// Convert chart associative array to indexed array
$response['chart_data'] = array_values($response['chart_data']);

// 5. Fetch Top 5 Most Downloaded Contents
$top_contents_query = "
    SELECT c.id, c.title, c.slug, c.downloads_count, c.preview_image, 'PikSea Official' as author_name
    FROM contents c
    ORDER BY c.downloads_count DESC 
    LIMIT 5
";
$res_contents = $mysqli->query($top_contents_query);
if ($res_contents) {
    while ($row = $res_contents->fetch_assoc()) {
        $response['top_contents'][] = $row;
    }
}

echo json_encode($response);
