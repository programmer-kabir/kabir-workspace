<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

try {
    // If course_id is 0 but user_id is passed, lookup student's active course_id
    if ($course_id === 0 && $user_id > 0) {
        $hasEnrollmentsTable = $db->query("SHOW TABLES LIKE 'student_enrollments'")->rowCount() > 0;
        $table = $hasEnrollmentsTable ? "student_enrollments" : "students";
        $s_chk = $db->prepare("SELECT course_id FROM {$table} WHERE user_id = :uid AND (status = 'active' OR status IS NULL) ORDER BY id DESC LIMIT 1");
        $s_chk->execute([':uid' => $user_id]);
        $s_row = $s_chk->fetch(PDO::FETCH_ASSOC);
        if ($s_row && !empty($s_row['course_id'])) {
            $course_id = intval($s_row['course_id']);
        }
    }

    $params = [];
    $where = ["r.status = 'active'"];

    if ($course_id > 0) {
        $where[] = "(r.course_id = :cid OR r.course_id IS NULL)";
        $params[':cid'] = $course_id;
    }

    $where_sql = implode(' AND ', $where);

    $sql = "
        SELECT 
            r.id,
            r.course_id,
            r.title,
            r.category,
            r.file_type,
            r.file_size,
            r.download_url,
            r.description,
            r.is_external_link,
            r.order_index,
            COALESCE(c.title, 'General Resource') AS course_title
        FROM course_resources r
        LEFT JOIN courses c ON r.course_id = c.id
        WHERE {$where_sql}
        ORDER BY r.category ASC, r.order_index ASC, r.id ASC
    ";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $all_resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group into materials and software tools
    $materials = [];
    $tools = [];

    foreach ($all_resources as $res) {
        if ($res['category'] === 'software_tool') {
            $tools[] = [
                'id' => $res['id'],
                'name' => $res['title'],
                'desc' => $res['description'],
                'link' => $res['download_url'],
                'file_type' => $res['file_type'],
                'file_size' => $res['file_size']
            ];
        } else {
            $materials[] = [
                'id' => $res['id'],
                'title' => $res['title'],
                'type' => $res['file_type'] ?: 'PDF Guide',
                'size' => $res['file_size'] ?: 'Document',
                'download_url' => $res['download_url'],
                'description' => $res['description'],
                'category' => $res['category'],
                'is_external_link' => intval($res['is_external_link'])
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "resolved_course_id" => $course_id,
        "data" => [
            "materials" => $materials,
            "tools" => $tools,
            "total" => count($all_resources)
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
