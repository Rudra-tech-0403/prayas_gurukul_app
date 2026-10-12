<?php
/**
 * Prayaas Gurukul — Public API Front Controller & Router
 * Dispatches all student and admin JSON requests.
 */

declare(strict_types=1);

define('PRAYAAS_CORE', true);

// Set default timezone and standard headers
date_default_timezone_set('Asia/Kolkata');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Preflight CORS response
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Locate private folder (Checks outside public_html first, then public_html/private)
$privatePath = dirname(__DIR__, 2) . '/private';
if (!is_dir($privatePath)) {
    $privatePath = dirname(__DIR__) . '/private';
}

// Load Core Dependencies
$config = require $privatePath . '/config/config.php';
require_once $privatePath . '/core/Database.php';
require_once $privatePath . '/core/Response.php';
require_once $privatePath . '/core/Auth.php';
require_once $privatePath . '/core/Middleware.php';

use Prayaas\Core\Database;
use Prayaas\Core\Response;
use Prayaas\Core\Auth;
use Prayaas\Core\Middleware;

$db = Database::getConnection($config);

// Parse input
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input  = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// Route dispatching
try {
    switch ($action) {
        // =====================================================================
        // AUTHENTICATION ROUTES
        // =====================================================================
        case 'auth/login':
            if ($method !== 'POST') Response::error('POST required', 405);
            $studentCode = trim($input['student_id'] ?? '');
            $password    = trim($input['password'] ?? '');

            if (!$studentCode || !$password) {
                Response::error('Student ID and Password are required.');
            }

            $stmt = $db->prepare("
                SELECT s.`id`, s.`student_code`, s.`name`, s.`password_hash`, s.`status`, c.`class_number`
                FROM `students` s
                JOIN `classes` c ON c.`id` = s.`class_id`
                WHERE s.`student_code` = :code LIMIT 1
            ");
            $stmt->execute([':code' => $studentCode]);
            $student = $stmt->fetch();

            if (!$student || !password_verify($password, $student['password_hash'])) {
                Response::error('Invalid Student ID or Password.', 401);
            }

            if ($student['status'] !== 'active') {
                Response::error('Your student account has been disabled. Contact admin.', 403);
            }

            $token = Auth::issueToken($db, 'student', (int)$student['id']);
            Response::json([
                'token'   => $token,
                'student' => [
                    'id'           => $student['student_code'],
                    'name'         => $student['name'],
                    'class_number' => (int)$student['class_number']
                ]
            ]);
            break;

        case 'auth/admin_login':
            if ($method !== 'POST') Response::error('POST required', 405);
            $username = trim($input['username'] ?? '');
            $password = trim($input['password'] ?? '');

            $stmt = $db->prepare("SELECT * FROM `admins` WHERE `username` = :user AND `status` = 'active' LIMIT 1");
            $stmt->execute([':user' => $username]);
            $admin = $stmt->fetch();

            if (!$admin || !password_verify($password, $admin['password_hash'])) {
                Response::error('Invalid Admin credentials.', 401);
            }

            $token = Auth::issueToken($db, 'admin', (int)$admin['id']);
            Response::json([
                'token' => $token,
                'admin' => ['username' => $admin['username'], 'name' => $admin['full_name'], 'role' => $admin['role']]
            ]);
            break;

        case 'auth/logout':
            $token = Middleware::getBearerToken();
            Auth::revokeToken($db, $token);
            Response::json(['message' => 'Logged out successfully.']);
            break;

        case 'auth/me':
            $student = Middleware::requireStudent($db);
            Response::json(['student' => $student]);
            break;

        // =====================================================================
        // STUDENT DASHBOARD & CONTENT
        // =====================================================================
        case 'student/home':
            $student = Middleware::requireStudent($db);
            $classNum = (int)$student['class_number'];

            // Fetch live/upcoming tests for this class
            $testStmt = $db->prepare("
                SELECT t.`id`, t.`title`, t.`subject`, t.`duration_min`, t.`total_marks`, t.`status`
                FROM `tests` t
                JOIN `classes` c ON c.`id` = t.`class_id`
                WHERE c.`class_number` = :classNum AND t.`status` = 'published'
                ORDER BY t.`id` DESC LIMIT 4
            ");
            $testStmt->execute([':classNum' => $classNum]);
            $tests = $testStmt->fetchAll();

            // Fetch latest class study materials (Videos & DPPs)
            $matStmt = $db->prepare("
                SELECT 'video' as type, v.`id`, v.`title`, v.`subject`, v.`youtube_id` as meta_ref, v.`duration_label` as label
                FROM `videos` v
                JOIN `classes` c ON c.`id` = v.`class_id`
                WHERE c.`class_number` = :classNum
                UNION ALL
                SELECT 'dpp' as type, d.`id`, d.`title`, d.`subject`, d.`file_path` as meta_ref, d.`file_size_label` as label
                FROM `dpps` d
                JOIN `classes` c ON c.`id` = d.`class_id`
                WHERE c.`class_number` = :classNum
                LIMIT 6
            ");
            $matStmt->execute([':classNum' => $classNum]);
            $materials = $matStmt->fetchAll();

            // Fetch student standing from precalculated leaderboard
            $rankStmt = $db->prepare("
                SELECT `rank_no`, `avg_percentage`, `tests_count`
                FROM `leaderboard_class`
                WHERE `student_id` = :sid LIMIT 1
            ");
            $rankStmt->execute([':sid' => $student['id']]);
            $rankData = $rankStmt->fetch() ?: ['rank_no' => 1, 'avg_percentage' => 0.00, 'tests_count' => 0];

            Response::json([
                'student'   => $student,
                'rank_info' => $rankData,
                'tests'     => $tests,
                'materials' => $materials
            ]);
            break;

        // =====================================================================
        // STUDENT TEST RUNNER & ATTEMPTS
        // =====================================================================
        case 'student/tests':
            $student = Middleware::requireStudent($db);
            $classNum = (int)$student['class_number'];

            $stmt = $db->prepare("
                SELECT t.`id`, t.`title`, t.`subject`, t.`duration_min`, t.`total_marks`, c.`class_number`,
                       a.`status` as attempt_status, a.`score` as attempt_score
                FROM `tests` t
                JOIN `classes` c ON c.`id` = t.`class_id`
                LEFT JOIN `attempts` a ON a.`test_id` = t.`id` AND a.`student_id` = :sid
                WHERE t.`status` = 'published'
                ORDER BY (c.`class_number` = :classNum) DESC, t.`id` DESC
            ");
            $stmt->execute([':sid' => $student['id'], ':classNum' => $classNum]);
            Response::json($stmt->fetchAll());
            break;

        case 'student/test_start':
            if ($method !== 'POST') Response::error('POST required', 405);
            $student = Middleware::requireStudent($db);
            $testId  = (int)($input['test_id'] ?? 0);

            // Fetch test details
            $testStmt = $db->prepare("
                SELECT t.*, c.`class_number`
                FROM `tests` t
                JOIN `classes` c ON c.`id` = t.`class_id`
                WHERE t.`id` = :id AND t.`status` = 'published' LIMIT 1
            ");
            $testStmt->execute([':id' => $testId]);
            $test = $testStmt->fetch();

            if (!$test) Response::error('Test not found or unavailable.', 404);
            Middleware::classGuard($student, (int)$test['class_number']);

            // Check existing attempt
            $attStmt = $db->prepare("SELECT * FROM `attempts` WHERE `test_id` = :tid AND `student_id` = :sid LIMIT 1");
            $attStmt->execute([':tid' => $testId, ':sid' => $student['id']]);
            $attempt = $attStmt->fetch();

            if ($attempt) {
                if ($attempt['status'] === 'submitted') {
                    Response::error('Test already submitted. Reattempt not permitted without admin clearance.');
                }
                if ($attempt['status'] === 'suspended') {
                    Response::error('Your test was suspended due to a security violation. Approval required from Admin.', 403);
                }
            } else {
                // Initialize new attempt row
                $durationSec = (int)$test['duration_min'] * 60;
                $startedAt   = date('Y-m-d H:i:s');
                $expiresAt   = date('Y-m-d H:i:s', time() + $durationSec);

                $insStmt = $db->prepare("
                    INSERT INTO `attempts` (`test_id`, `student_id`, `started_at`, `expires_at`, `status`)
                    VALUES (:tid, :sid, :start, :exp, 'in_progress')
                ");
                $insStmt->execute([
                    ':tid'   => $testId,
                    ':sid'   => $student['id'],
                    ':start' => $startedAt,
                    ':exp'   => $expiresAt
                ]);
                $attemptId = (int)$db->lastInsertId();
                $attempt = ['id' => $attemptId, 'expires_at' => $expiresAt];
            }

            // Fetch questions WITHOUT exposing correct answers
            $qStmt = $db->prepare("
                SELECT `id`, `sort_order`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `image_url`
                FROM `questions`
                WHERE `test_id` = :tid
                ORDER BY `sort_order` ASC
            ");
            $qStmt->execute([':tid' => $testId]);
            $questions = $qStmt->fetchAll();

            $timeLeftSec = max(0, strtotime($attempt['expires_at']) - time());

            Response::json([
                'attempt_id'     => $attempt['id'] ?? $attemptId,
                'test_title'     => $test['title'],
                'seconds_left'   => $timeLeftSec,
                'questions'      => $questions
            ]);
            break;

        case 'student/test_autosave':
            if ($method !== 'POST') Response::error('POST required', 405);
            $student = Middleware::requireStudent($db);
            $attemptId = (int)($input['attempt_id'] ?? 0);
            $questionId = (int)($input['question_id'] ?? 0);
            $selectedOpt = strtoupper(trim($input['selected_option'] ?? ''));
            $isReviewed = (int)($input['is_reviewed'] ?? 0);

            if (!in_array($selectedOpt, ['A', 'B', 'C', 'D'], true)) {
                $selectedOpt = null;
            }

            // Verify attempt ownership and valid status
            $checkStmt = $db->prepare("SELECT `id`, `status` FROM `attempts` WHERE `id` = :aid AND `student_id` = :sid LIMIT 1");
            $checkStmt->execute([':aid' => $attemptId, ':sid' => $student['id']]);
            $att = $checkStmt->fetch();

            if (!$att || $att['status'] !== 'in_progress') {
                Response::error('Attempt is closed or suspended.', 400);
            }

            $saveStmt = $db->prepare("
                INSERT INTO `answers` (`attempt_id`, `question_id`, `selected_option`, `is_reviewed`)
                VALUES (:aid, :qid, :opt, :rev)
                ON DUPLICATE KEY UPDATE `selected_option` = VALUES(`selected_option`), `is_reviewed` = VALUES(`is_reviewed`)
            ");
            $saveStmt->execute([
                ':aid' => $attemptId,
                ':qid' => $questionId,
                ':opt' => $selectedOpt,
                ':rev' => $isReviewed
            ]);

            Response::json(['saved' => true]);
            break;

        case 'student/test_violation':
            // Called by test-guard on blur / tab switch / minimize
            if ($method !== 'POST') Response::error('POST required', 405);
            $student = Middleware::requireStudent($db);
            $attemptId = (int)($input['attempt_id'] ?? 0);
            $reason = trim($input['reason'] ?? 'Tab switched / Window minimized');

            $stmt = $db->prepare("
                UPDATE `attempts`
                SET `status` = 'suspended', `violation_count` = `violation_count` + 1
                WHERE `id` = :aid AND `student_id` = :sid AND `status` = 'in_progress'
            ");
            $stmt->execute([':aid' => $attemptId, ':sid' => $student['id']]);

            // Register into suspensions table for admin clearance
            $attStmt = $db->prepare("SELECT `test_id` FROM `attempts` WHERE `id` = :aid LIMIT 1");
            $attStmt->execute([':aid' => $attemptId]);
            $tid = (int)$attStmt->fetchColumn();

            if ($tid) {
                $suspStmt = $db->prepare("
                    INSERT INTO `suspensions` (`attempt_id`, `student_id`, `test_id`, `reason`, `status`)
                    VALUES (:aid, :sid, :tid, :reason, 'pending')
                ");
                $suspStmt->execute([
                    ':aid'    => $attemptId,
                    ':sid'    => $student['id'],
                    ':tid'    => $tid,
                    ':reason' => $reason
                ]);
            }

            Response::json(['suspended' => true, 'message' => 'Test locked due to violation. Admin approval required.']);
            break;

        // =====================================================================
        // LEADERBOARD (Class & Overall)
        // =====================================================================
        case 'student/leaderboard':
            $student = Middleware::requireStudent($db);
            $type = $_GET['type'] ?? 'class'; // 'class' or 'overall'

            if ($type === 'class') {
                $stmt = $db->prepare("
                    SELECT lc.`rank_no`, s.`name`, lc.`avg_percentage`, lc.`tests_count`,
                           (lc.`prev_rank_no` - lc.`rank_no`) as rank_delta,
                           (s.`id` = :sid) as is_user
                    FROM `leaderboard_class` lc
                    JOIN `students` s ON s.`id` = lc.`student_id`
                    WHERE lc.`class_id` = :cid
                    ORDER BY lc.`rank_no` ASC LIMIT 25
                ");
                $stmt->execute([':sid' => $student['id'], ':cid' => $student['class_id']]);
            } else {
                $stmt = $db->prepare("
                    SELECT lo.`rank_no`, s.`name`, c.`class_number`, lo.`avg_percentage`, lo.`tests_count`,
                           (lo.`prev_rank_no` - lo.`rank_no`) as rank_delta,
                           (s.`id` = :sid) as is_user
                    FROM `leaderboard_overall` lo
                    JOIN `students` s ON s.`id` = lo.`student_id`
                    JOIN `classes` c ON c.`id` = lo.`class_id`
                    ORDER BY lo.`rank_no` ASC LIMIT 25
                ");
                $stmt->execute([':sid' => $student['id']]);
            }

            Response::json($stmt->fetchAll());
            break;

        // =====================================================================
        // ADMIN DESK ACTIONS
        // =====================================================================
        case 'admin/students':
            $admin = Middleware::requireAdmin($db);
            if ($method === 'GET') {
                $stmt = $db->query("
                    SELECT s.`id`, s.`student_code`, s.`name`, c.`class_number`, s.`status`,
                           COUNT(r.`id`) as tests_done,
                           COALESCE(ROUND(AVG(r.`percentage`), 1), 0.0) as avg_score
                    FROM `students` s
                    JOIN `classes` c ON c.`id` = s.`class_id`
                    LEFT JOIN `results` r ON r.`student_id` = s.`id`
                    GROUP BY s.`id`
                    ORDER BY s.`id` DESC
                ");
                Response::json($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $code = trim($input['student_code'] ?? '');
                $name = trim($input['name'] ?? '');
                $cls  = (int)($input['class_number'] ?? 10);
                $pass = trim($input['password'] ?? 'student123');

                $clsStmt = $db->prepare("SELECT `id` FROM `classes` WHERE `class_number` = :c LIMIT 1");
                $clsStmt->execute([':c' => $cls]);
                $classId = (int)$clsStmt->fetchColumn();

                $hash = password_hash($pass, PASSWORD_BCRYPT);
                $ins = $db->prepare("
                    INSERT INTO `students` (`student_code`, `name`, `class_id`, `password_hash`, `status`)
                    VALUES (:code, :name, :cid, :hash, 'active')
                ");
                $ins->execute([':code' => $code, ':name' => $name, ':cid' => $classId, ':hash' => $hash]);
                Response::json(['created' => true, 'id' => $db->lastInsertId()]);
            }
            break;

        case 'admin/suspensions':
            $admin = Middleware::requireAdmin($db);
            if ($method === 'GET') {
                $stmt = $db->query("
                    SELECT sp.`id`, s.`student_code`, s.`name`, c.`class_number`, t.`title` as test_title,
                           sp.`reason`, sp.`created_at`, sp.`status`, sp.`attempt_id`
                    FROM `suspensions` sp
                    JOIN `students` s ON s.`id` = sp.`student_id`
                    JOIN `classes` c ON c.`id` = s.`class_id`
                    JOIN `tests` t ON t.`id` = sp.`test_id`
                    WHERE sp.`status` = 'pending'
                    ORDER BY sp.`id` DESC
                ");
                Response::json($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $suspId = (int)($input['suspension_id'] ?? 0);
                $decision = $input['decision'] ?? ''; // 'resume', 'fresh', 'reject'

                $sRowStmt = $db->prepare("SELECT `attempt_id`, `test_id`, `student_id` FROM `suspensions` WHERE `id` = :id LIMIT 1");
                $sRowStmt->execute([':id' => $suspId]);
                $susp = $sRowStmt->fetch();

                if (!$susp) Response::error('Suspension record not found.', 404);

                if ($decision === 'resume') {
                    // Extend 15 minutes grace time and restore in_progress status
                    $db->prepare("
                        UPDATE `attempts`
                        SET `status` = 'in_progress', `expires_at` = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                        WHERE `id` = :aid
                    ")->execute([':aid' => $susp['attempt_id']]);

                    $db->prepare("UPDATE `suspensions` SET `status` = 'resumed', `resolved_at` = NOW() WHERE `id` = :id")
                       ->execute([':id' => $suspId]);
                } elseif ($decision === 'fresh') {
                    // Delete previous attempt so student can start cleanly
                    $db->prepare("DELETE FROM `attempts` WHERE `id` = :aid")->execute([':aid' => $susp['attempt_id']]);
                    $db->prepare("UPDATE `suspensions` SET `status` = 'fresh_attempt', `resolved_at` = NOW() WHERE `id` = :id")
                       ->execute([':id' => $suspId]);
                } else {
                    $db->prepare("UPDATE `attempts` SET `status` = 'rejected' WHERE `id` = :aid")->execute([':aid' => $susp['attempt_id']]);
                    $db->prepare("UPDATE `suspensions` SET `status` = 'rejected', `resolved_at` = NOW() WHERE `id` = :id")
                       ->execute([':id' => $suspId]);
                }

                Response::json(['resolved' => true, 'decision' => $decision]);
            }
            break;

        default:
            Response::error("Action '{$action}' is not recognized or not implemented.", 404);
            break;
    }
} catch (\Throwable $e) {
    error_log('[Prayaas API Exception] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Server encountered an internal processing error.', 500);
}