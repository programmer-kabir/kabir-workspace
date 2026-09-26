<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    if (function_exists('iconv')) {
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    }
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'item' : $text;
}

$database = new Database();
$db = $database->getConnection();

$course_param = isset($_GET['course_id']) ? trim($_GET['course_id']) : (isset($_GET['slug']) ? trim($_GET['slug']) : '');
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$course_param) {
    echo json_encode(["status" => "error", "message" => "Course ID or Slug is required."]);
    exit;
}

try {
    // 1. Fetch course details by ID or Slug
    $course = null;
    if (is_numeric($course_param)) {
        $cStmt = $db->prepare("
            SELECT id, title, course_code, category, duration_months, total_classes, 
                   thumbnail_url, banner_url, description, status 
            FROM courses 
            WHERE id = :cid LIMIT 1
        ");
        $cStmt->execute([':cid' => intval($course_param)]);
        $course = $cStmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $allC = $db->query("
            SELECT id, title, course_code, category, duration_months, total_classes, 
                   thumbnail_url, banner_url, description, status 
            FROM courses
        ")->fetchAll(PDO::FETCH_ASSOC);

        foreach ($allC as $ac) {
            $genSlug = slugify($ac['title']);
            $codeSlug = slugify($ac['course_code']);
            if ($genSlug === $course_param || $codeSlug === $course_param || strtolower($ac['course_code']) === strtolower($course_param)) {
                $course = $ac;
                break;
            }
        }
    }

    if (!$course) {
        echo json_encode(["status" => "error", "message" => "Course not found."]);
        exit;
    }

    $course_id = intval($course['id']);
    $course['slug'] = slugify($course['title']);

    // 2. Fetch student completion records for this course if user_id is provided
    $completedMap = [];
    if ($user_id > 0) {
        $progStmt = $db->prepare("
            SELECT lesson_id, is_completed, watched_seconds, completed_at 
            FROM student_lesson_progress 
            WHERE user_id = :uid AND course_id = :cid
        ");
        $progStmt->execute([':uid' => $user_id, ':cid' => $course_id]);
        $progressRows = $progStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($progressRows as $pr) {
            $completedMap[intval($pr['lesson_id'])] = [
                'is_completed' => intval($pr['is_completed']) === 1,
                'watched_seconds' => intval($pr['watched_seconds']),
                'completed_at' => $pr['completed_at']
            ];
        }
    }

    // 3. Fetch Milestones
    $mStmt = $db->prepare("
        SELECT id, course_id, milestone_no, title, description, order_index, status 
        FROM course_milestones 
        WHERE course_id = :cid AND status = 'active'
        ORDER BY milestone_no ASC, order_index ASC, id ASC
    ");
    $mStmt->execute([':cid' => $course_id]);
    $milestones = $mStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Fetch Modules
    $modStmt = $db->prepare("
        SELECT id, course_id, milestone_id, module_no, title, description, duration_classes, status 
        FROM course_modules 
        WHERE course_id = :cid AND status = 'active'
        ORDER BY module_no ASC, id ASC
    ");
    $modStmt->execute([':cid' => $course_id]);
    $allModules = $modStmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Fetch Lessons
    $lesStmt = $db->prepare("
        SELECT id, course_id, milestone_id, module_id, lesson_no, title, 
               video_type, video_url, duration_minutes, summary, resources_json, 
               order_index, is_free_preview, status 
        FROM course_lessons 
        WHERE course_id = :cid AND status = 'active'
        ORDER BY module_id ASC, lesson_no ASC, order_index ASC, id ASC
    ");
    $lesStmt->execute([':cid' => $course_id]);
    $allLessons = $lesStmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Fetch Quizzes for this Course
    $allQuizzes = [];
    $quizPassedMap = [];
    try {
        $qStmt = $db->prepare("
            SELECT q.id, q.course_id, q.milestone_id, q.module_id, q.quiz_no, q.title, 
                   q.description, q.time_limit_minutes, q.passing_score_percent, q.total_marks, 
                   q.order_index, q.status,
                   COUNT(qq.id) AS question_count
            FROM course_quizzes q
            LEFT JOIN course_quiz_questions qq ON q.id = qq.quiz_id
            WHERE q.course_id = :cid AND q.status = 'active'
            GROUP BY q.id
            ORDER BY q.module_id ASC, q.order_index ASC, q.id ASC
        ");
        $qStmt->execute([':cid' => $course_id]);
        $allQuizzes = $qStmt->fetchAll(PDO::FETCH_ASSOC);

        // Check if student has passed any of these quizzes
        if ($user_id > 0 && !empty($allQuizzes)) {
            $attCheck = $db->prepare("
                SELECT quiz_id, is_passed, score_percent, correct_answers, total_questions 
                FROM student_quiz_attempts 
                WHERE user_id = :uid AND course_id = :cid
            ");
            $attCheck->execute([':uid' => $user_id, ':cid' => $course_id]);
            $attempts = $attCheck->fetchAll(PDO::FETCH_ASSOC);
            foreach ($attempts as $at) {
                $qid = intval($at['quiz_id']);
                if (intval($at['is_passed']) === 1) {
                    $quizPassedMap[$qid] = true;
                }
            }
        }
    } catch (Throwable $e) {}

    // 7. Fetch Practical Assignments for this Course
    $allAssignments = [];
    $assignmentSubmissionMap = [];
    try {
        $asgStmt = $db->prepare("
            SELECT id, course_id, milestone_id, module_id, assignment_no, title, 
                   description, total_marks, pass_marks, resources_json, order_index, status
            FROM course_assignments
            WHERE course_id = :cid AND status = 'active'
            ORDER BY module_id ASC, order_index ASC, id ASC
        ");
        $asgStmt->execute([':cid' => $course_id]);
        $allAssignments = $asgStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($user_id > 0 && !empty($allAssignments)) {
            $subCheck = $db->prepare("
                SELECT id, assignment_id, submission_link, file_url, file_name, file_size, files_json, notes, marks_obtained, feedback, status, submitted_at, reviewed_at
                FROM student_submissions
                WHERE user_id = :uid AND course_id = :cid
            ");
            $subCheck->execute([':uid' => $user_id, ':cid' => $course_id]);
            $subs = $subCheck->fetchAll(PDO::FETCH_ASSOC);
            foreach ($subs as $s) {
                $aid = intval($s['assignment_id']);
                if (!empty($s['files_json'])) {
                    $decodedF = json_decode($s['files_json'], true);
                    if (is_array($decodedF)) {
                        $s['files'] = $decodedF;
                    }
                }
                $assignmentSubmissionMap[$aid] = $s;
            }
        }
    } catch (Throwable $e) {}

    // Organize Lessons, Quizzes and Assignments by Module ID
    $lessonsByModule = [];
    $totalLessonsCount = count($allLessons);
    $completedLessonsCount = 0;
    $firstUncompletedLesson = null;

    foreach ($allLessons as $les) {
        $lesId = intval($les['id']);
        $modId = intval($les['module_id']);
        
        $isCompleted = isset($completedMap[$lesId]) && $completedMap[$lesId]['is_completed'];
        if ($isCompleted) {
            $completedLessonsCount++;
        }

        $resources = [];
        if (!empty($les['resources_json'])) {
            $decoded = json_decode($les['resources_json'], true);
            if (is_array($decoded)) {
                $resources = $decoded;
            }
        }

        $formattedLesson = [
            'id' => $lesId,
            'slug' => slugify($les['title']),
            'item_type' => 'video',
            'course_id' => intval($les['course_id']),
            'milestone_id' => $les['milestone_id'] ? intval($les['milestone_id']) : null,
            'module_id' => $modId,
            'lesson_no' => intval($les['lesson_no']),
            'title' => $les['title'],
            'video_type' => $les['video_type'],
            'video_url' => $les['video_url'],
            'duration_minutes' => $les['duration_minutes'] ?: '10:00',
            'summary' => $les['summary'],
            'resources' => $resources,
            'order_index' => intval($les['order_index']),
            'is_free_preview' => intval($les['is_free_preview']) === 1,
            'is_completed' => $isCompleted,
            'watched_seconds' => isset($completedMap[$lesId]) ? $completedMap[$lesId]['watched_seconds'] : 0,
            'completed_at' => isset($completedMap[$lesId]) ? $completedMap[$lesId]['completed_at'] : null
        ];

        if (!$isCompleted && $firstUncompletedLesson === null) {
            $firstUncompletedLesson = $formattedLesson;
        }

        if (!isset($lessonsByModule[$modId])) {
            $lessonsByModule[$modId] = [];
        }
        $lessonsByModule[$modId][] = $formattedLesson;
    }

    // Merge Quizzes into respective modules
    foreach ($allQuizzes as $qz) {
        $qId = intval($qz['id']);
        $modId = intval($qz['module_id']);
        $isPassed = isset($quizPassedMap[$qId]);
        if ($isPassed) {
            $completedLessonsCount++;
        }
        $totalLessonsCount++;

        $formattedQuiz = [
            'id' => $qId,
            'quiz_id' => $qId,
            'slug' => slugify($qz['title']),
            'item_type' => 'quiz',
            'course_id' => intval($qz['course_id']),
            'milestone_id' => $qz['milestone_id'] ? intval($qz['milestone_id']) : null,
            'module_id' => $modId,
            'lesson_no' => intval($qz['quiz_no']),
            'title' => $qz['title'],
            'description' => $qz['description'],
            'duration_minutes' => ($qz['time_limit_minutes'] ? $qz['time_limit_minutes'] . ':00' : '10:00'),
            'time_limit_minutes' => intval($qz['time_limit_minutes']),
            'passing_score_percent' => intval($qz['passing_score_percent']),
            'question_count' => intval($qz['question_count']) ?: 5,
            'order_index' => intval($qz['order_index']) ?: 99,
            'is_free_preview' => false,
            'is_completed' => $isPassed,
            'is_passed' => $isPassed
        ];

        if (!isset($lessonsByModule[$modId])) {
            $lessonsByModule[$modId] = [];
        }
        $lessonsByModule[$modId][] = $formattedQuiz;
    }

    // Merge Practical Assignments into respective modules
    foreach ($allAssignments as $asg) {
        $aId = intval($asg['id']);
        $modId = intval($asg['module_id']);
        $sub = isset($assignmentSubmissionMap[$aId]) ? $assignmentSubmissionMap[$aId] : null;
        $isSubmitted = !empty($sub && (!empty($sub['submission_link']) || !empty($sub['file_url'])));
        if ($isSubmitted) {
            $completedLessonsCount++;
        }
        $totalLessonsCount++;

        $asgResources = [];
        if (!empty($asg['resources_json'])) {
            $decoded = json_decode($asg['resources_json'], true);
            if (is_array($decoded)) {
                $asgResources = $decoded;
            }
        }

        $formattedAssignment = [
            'id' => $aId,
            'assignment_id' => $aId,
            'slug' => slugify($asg['title']),
            'item_type' => 'assignment',
            'course_id' => intval($asg['course_id']),
            'milestone_id' => $asg['milestone_id'] ? intval($asg['milestone_id']) : null,
            'module_id' => $modId,
            'lesson_no' => intval($asg['assignment_no']),
            'title' => $asg['title'],
            'description' => $asg['description'],
            'total_marks' => intval($asg['total_marks']) ?: 100,
            'pass_marks' => intval($asg['pass_marks']) ?: 50,
            'resources' => $asgResources,
            'order_index' => intval($asg['order_index']) ?: 99,
            'is_free_preview' => false,
            'is_completed' => $isSubmitted,
            'is_submitted' => $isSubmitted,
            'submission' => $sub
        ];

        if (!isset($lessonsByModule[$modId])) {
            $lessonsByModule[$modId] = [];
        }
        $lessonsByModule[$modId][] = $formattedAssignment;
    }

    // Sort all module items (videos, quizzes, assignments) by order_index
    foreach ($lessonsByModule as $modId => $items) {
        usort($lessonsByModule[$modId], function($a, $b) {
            return ($a['order_index'] ?? 0) <=> ($b['order_index'] ?? 0);
        });
    }

    if ($firstUncompletedLesson === null && $totalLessonsCount > 0 && isset($lessonsByModule[array_key_first($lessonsByModule)][0])) {
        $firstUncompletedLesson = $lessonsByModule[array_key_first($lessonsByModule)][0];
    }

    // Organize Modules by Milestone ID
    $modulesByMilestone = [];
    $unassignedModules = [];

    foreach ($allModules as $mod) {
        $modId = intval($mod['id']);
        $modLessons = isset($lessonsByModule[$modId]) ? $lessonsByModule[$modId] : [];
        $modCompleted = 0;
        foreach ($modLessons as $ml) {
            if ($ml['is_completed']) $modCompleted++;
        }

        $formattedMod = [
            'id' => $modId,
            'slug' => slugify($mod['title']),
            'course_id' => intval($mod['course_id']),
            'milestone_id' => $mod['milestone_id'] ? intval($mod['milestone_id']) : null,
            'module_no' => intval($mod['module_no']),
            'title' => $mod['title'],
            'description' => $mod['description'],
            'duration_classes' => $mod['duration_classes'],
            'lessons' => $modLessons,
            'total_lessons' => count($modLessons),
            'completed_lessons' => $modCompleted
        ];

        if (!empty($mod['milestone_id'])) {
            $mId = intval($mod['milestone_id']);
            if (!isset($modulesByMilestone[$mId])) {
                $modulesByMilestone[$mId] = [];
            }
            $modulesByMilestone[$mId][] = $formattedMod;
        } else {
            $unassignedModules[] = $formattedMod;
        }
    }

    // Assemble Milestones hierarchy
    $structuredMilestones = [];
    foreach ($milestones as $ms) {
        $msId = intval($ms['id']);
        $msMods = isset($modulesByMilestone[$msId]) ? $modulesByMilestone[$msId] : [];
        
        $msLessonsCount = 0;
        $msCompletedCount = 0;
        foreach ($msMods as $m) {
            $msLessonsCount += $m['total_lessons'];
            $msCompletedCount += $m['completed_lessons'];
        }

        $structuredMilestones[] = [
            'id' => $msId,
            'slug' => slugify($ms['title']),
            'course_id' => intval($ms['course_id']),
            'milestone_no' => intval($ms['milestone_no']),
            'title' => $ms['title'],
            'description' => $ms['description'],
            'order_index' => intval($ms['order_index']),
            'modules' => $msMods,
            'total_modules' => count($msMods),
            'total_lessons' => $msLessonsCount,
            'completed_lessons' => $msCompletedCount
        ];
    }

    if (!empty($unassignedModules)) {
        if (empty($structuredMilestones)) {
            $totUnassignedL = 0;
            $compUnassignedL = 0;
            foreach ($unassignedModules as $um) {
                $totUnassignedL += $um['total_lessons'];
                $compUnassignedL += $um['completed_lessons'];
            }
            $structuredMilestones[] = [
                'id' => 0,
                'slug' => 'complete-curriculum',
                'course_id' => intval($course['id']),
                'milestone_no' => 1,
                'title' => 'Milestone 1: Complete Curriculum',
                'description' => 'Course curriculum modules and video classes.',
                'order_index' => 1,
                'modules' => $unassignedModules,
                'total_modules' => count($unassignedModules),
                'total_lessons' => $totUnassignedL,
                'completed_lessons' => $compUnassignedL
            ];
        } else {
            $structuredMilestones[0]['modules'] = array_merge($structuredMilestones[0]['modules'], $unassignedModules);
            $structuredMilestones[0]['total_modules'] = count($structuredMilestones[0]['modules']);
        }
    }

    $progressPercent = $totalLessonsCount > 0 ? round(($completedLessonsCount / $totalLessonsCount) * 100) : 0;

    echo json_encode([
        "status" => "success",
        "data" => [
            "course" => $course,
            "milestones" => $structuredMilestones,
            "stats" => [
                "total_milestones" => count($structuredMilestones),
                "total_modules" => count($allModules),
                "total_lessons" => $totalLessonsCount,
                "completed_lessons" => $completedLessonsCount,
                "progress_percent" => $progressPercent,
                "active_lesson_id" => $firstUncompletedLesson ? $firstUncompletedLesson['id'] : null,
                "active_lesson_slug" => $firstUncompletedLesson ? $firstUncompletedLesson['slug'] : null
            ]
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
