<?php
// get_meetings.php - Fetch Active, Scheduled, and Past Meetings
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'MeetingDbHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

MeetingDbHelper::ensureSchema($db);

try {
    // 1. Fetch currently ACTIVE meetings
    $activeSql = "
        SELECT 
            m.id,
            m.room_id,
            m.title,
            m.agenda,
            m.meeting_type,
            m.created_by,
            m.hosts_json,
            m.is_chat_locked,
            m.recording_url,
            m.recording_duration,
            m.recording_size,
            m.recorded_at,
            u.name AS creator_name,
            u.profile_picture AS creator_avatar,
            d.name AS department_name,
            m.actual_start,
            m.status,
            m.created_at,
            (SELECT COUNT(DISTINCT user_id) FROM meeting_attendance_logs WHERE meeting_id = m.id AND left_at IS NULL) AS live_participants_count
        FROM academy_meetings m
        LEFT JOIN users u ON m.created_by = u.id
        LEFT JOIN departments d ON m.department_id = d.id
        WHERE m.status = 'active'
        ORDER BY m.id DESC
    ";
    $activeMeetings = $db->query($activeSql)->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch SCHEDULED meetings
    $schedSql = "
        SELECT 
            m.id,
            m.room_id,
            m.title,
            m.agenda,
            m.meeting_type,
            m.created_by,
            m.hosts_json,
            m.is_chat_locked,
            m.recording_url,
            m.recording_duration,
            m.recording_size,
            m.recorded_at,
            u.name AS creator_name,
            u.profile_picture AS creator_avatar,
            d.name AS department_name,
            m.scheduled_start,
            m.status,
            m.created_at
        FROM academy_meetings m
        LEFT JOIN users u ON m.created_by = u.id
        LEFT JOIN departments d ON m.department_id = d.id
        WHERE m.status = 'scheduled'
        ORDER BY m.scheduled_start ASC
        LIMIT 20
    ";
    $scheduledMeetings = $db->query($schedSql)->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch recently ENDED meetings
    $endedSql = "
        SELECT 
            m.id,
            m.room_id,
            m.title,
            m.agenda,
            m.meeting_type,
            m.created_by,
            m.hosts_json,
            m.is_chat_locked,
            m.recording_url,
            m.recording_duration,
            m.recording_size,
            m.recorded_at,
            u.name AS creator_name,
            u.profile_picture AS creator_avatar,
            d.name AS department_name,
            m.actual_start,
            m.actual_end,
            m.status,
            (SELECT COUNT(DISTINCT user_id) FROM meeting_attendance_logs WHERE meeting_id = m.id) AS total_attendees_count
        FROM academy_meetings m
        LEFT JOIN users u ON m.created_by = u.id
        LEFT JOIN departments d ON m.department_id = d.id
        WHERE m.status = 'ended'
        ORDER BY m.id DESC
        LIMIT 15
    ";
    $endedMeetings = $db->query($endedSql)->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"             => "success",
        "active_meetings"    => $activeMeetings,
        "scheduled_meetings" => $scheduledMeetings,
        "past_meetings"      => $endedMeetings
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
