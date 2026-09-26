<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

try {
    // Top 10 English Typists
    $stmtEn = $db->query("
        SELECT 
            t.user_id,
            MAX(t.wpm) as best_wpm,
            ROUND(AVG(t.accuracy_percent), 1) as avg_accuracy,
            COUNT(t.id) as test_count,
            COALESCE(u.name, 'Student') as student_name,
            COALESCE(s.student_code, CONCAT('STU-', u.id)) as student_code,
            COALESCE(u.profile_picture, '') as avatar
        FROM student_typing_sessions t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN students s ON s.user_id = u.id
        WHERE t.language = 'en' AND t.accuracy_percent >= 75
        GROUP BY t.user_id
        ORDER BY best_wpm DESC, avg_accuracy DESC
        LIMIT 10
    ");
    $topTypistsEn = $stmtEn->fetchAll(PDO::FETCH_ASSOC);

    // Top 10 Bangla Typists
    $stmtBn = $db->query("
        SELECT 
            t.user_id,
            MAX(t.wpm) as best_wpm,
            ROUND(AVG(t.accuracy_percent), 1) as avg_accuracy,
            COUNT(t.id) as test_count,
            COALESCE(u.name, 'Student') as student_name,
            COALESCE(s.student_code, CONCAT('STU-', u.id)) as student_code,
            COALESCE(u.profile_picture, '') as avatar
        FROM student_typing_sessions t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN students s ON s.user_id = u.id
        WHERE t.language IN ('bn_avro', 'bn_bijoy') AND t.accuracy_percent >= 75
        GROUP BY t.user_id
        ORDER BY best_wpm DESC, avg_accuracy DESC
        LIMIT 10
    ");
    $topTypistsBn = $stmtBn->fetchAll(PDO::FETCH_ASSOC);

    // Top Foundations Achievers (Most Badges)
    $stmtBadges = $db->query("
        SELECT 
            b.user_id,
            COUNT(b.id) as badge_count,
            COALESCE(u.name, 'Student') as student_name,
            COALESCE(s.student_code, CONCAT('STU-', u.id)) as student_code,
            COALESCE(u.profile_picture, '') as avatar
        FROM student_skill_badges b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN students s ON s.user_id = u.id
        GROUP BY b.user_id
        ORDER BY badge_count DESC
        LIMIT 10
    ");
    $topAchievers = $stmtBadges->fetchAll(PDO::FETCH_ASSOC);

    // Personal user stats & rank if user_id provided
    $myStats = null;
    if ($user_id > 0) {
        // Find English rank
        $stmtMyEn = $db->prepare("
            SELECT ranking, best_wpm, avg_accuracy FROM (
                SELECT 
                    user_id,
                    MAX(wpm) as best_wpm,
                    ROUND(AVG(accuracy_percent), 1) as avg_accuracy,
                    ROW_NUMBER() OVER (ORDER BY MAX(wpm) DESC, AVG(accuracy_percent) DESC) as ranking
                FROM student_typing_sessions
                WHERE language = 'en' AND accuracy_percent >= 75
                GROUP BY user_id
            ) ranked WHERE user_id = :uid
        ");
        $stmtMyEn->execute([':uid' => $user_id]);
        $myEn = $stmtMyEn->fetch(PDO::FETCH_ASSOC);

        // Find Bangla rank
        $stmtMyBn = $db->prepare("
            SELECT ranking, best_wpm, avg_accuracy FROM (
                SELECT 
                    user_id,
                    MAX(wpm) as best_wpm,
                    ROUND(AVG(accuracy_percent), 1) as avg_accuracy,
                    ROW_NUMBER() OVER (ORDER BY MAX(wpm) DESC, AVG(accuracy_percent) DESC) as ranking
                FROM student_typing_sessions
                WHERE language IN ('bn_avro', 'bn_bijoy') AND accuracy_percent >= 75
                GROUP BY user_id
            ) ranked WHERE user_id = :uid
        ");
        $stmtMyBn->execute([':uid' => $user_id]);
        $myBn = $stmtMyBn->fetch(PDO::FETCH_ASSOC);

        // Find Badges rank
        $stmtMyBadge = $db->prepare("
            SELECT ranking, badge_count FROM (
                SELECT 
                    user_id,
                    COUNT(id) as badge_count,
                    ROW_NUMBER() OVER (ORDER BY COUNT(id) DESC) as ranking
                FROM student_skill_badges
                GROUP BY user_id
            ) ranked WHERE user_id = :uid
        ");
        $stmtMyBadge->execute([':uid' => $user_id]);
        $myBadge = $stmtMyBadge->fetch(PDO::FETCH_ASSOC);

        $myStats = [
            "english" => $myEn ? [
                "rank" => (int)$myEn['ranking'],
                "best_wpm" => (int)$myEn['best_wpm'],
                "avg_accuracy" => (float)$myEn['avg_accuracy']
            ] : null,
            "bangla" => $myBn ? [
                "rank" => (int)$myBn['ranking'],
                "best_wpm" => (int)$myBn['best_wpm'],
                "avg_accuracy" => (float)$myBn['avg_accuracy']
            ] : null,
            "badges" => $myBadge ? [
                "rank" => (int)$myBadge['ranking'],
                "badge_count" => (int)$myBadge['badge_count']
            ] : null
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "top_english_typists" => $topTypistsEn,
            "top_bangla_typists" => $topTypistsBn,
            "top_achievers" => $topAchievers,
            "my_stats" => $myStats
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
