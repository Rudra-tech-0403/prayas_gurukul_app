<?php
/**
 * Prayaas Gurukul — Automated Leaderboard Rebuilder (Cron Script)
 * Hostinger Cron Command:
 * /usr/bin/php /home/uXXXXXX/private/cron/rebuild_leaderboard.php
 */

declare(strict_types=1);

define('PRAYAAS_CORE', true);

$privatePath = dirname(__DIR__);
$config = require $privatePath . '/config/config.php';
require_once $privatePath . '/core/Database.php';

use Prayaas\Core\Database;

$db = Database::getConnection($config);

echo "[" . date('Y-m-d H:i:s') . "] Starting Gurukul Leaderboard Rebuild...\n";

try {
    $db->beginTransaction();

    // 1. Rebuild Class-Wise Leaderboard
    $classSql = "
        INSERT INTO `leaderboard_class`
            (`student_id`, `class_id`, `avg_percentage`, `tests_count`, `rank_no`, `prev_rank_no`, `updated_at`)
        SELECT 
            t.student_id,
            t.class_id,
            t.avg_pct,
            t.tests,
            t.new_rank,
            COALESCE(lc.rank_no, t.new_rank),
            NOW()
        FROM (
            SELECT 
                r.student_id,
                s.class_id,
                ROUND(AVG(r.percentage), 2) AS avg_pct,
                COUNT(r.id) AS tests,
                RANK() OVER (
                    PARTITION BY s.class_id 
                    ORDER BY AVG(r.percentage) DESC, COUNT(r.id) DESC
                ) AS new_rank
            FROM `results` r
            JOIN `students` s ON s.id = r.student_id
            WHERE s.status = 'active'
            GROUP BY r.student_id, s.class_id
        ) t
        LEFT JOIN `leaderboard_class` lc ON lc.student_id = t.student_id
        ON DUPLICATE KEY UPDATE
            `prev_rank_no`   = `rank_no`,
            `avg_percentage` = VALUES(`avg_percentage`),
            `tests_count`    = VALUES(`tests_count`),
            `rank_no`        = VALUES(`rank_no`),
            `updated_at`     = NOW();
    ";
    $db->exec($classSql);
    echo " -> Class leaderboard calculated.\n";

    // 2. Rebuild Overall Gurukul Leaderboard (Combined Classes)
    $overallSql = "
        INSERT INTO `leaderboard_overall`
            (`student_id`, `class_id`, `avg_percentage`, `tests_count`, `rank_no`, `prev_rank_no`, `updated_at`)
        SELECT 
            t.student_id,
            t.class_id,
            t.avg_pct,
            t.tests,
            t.new_rank,
            COALESCE(lo.rank_no, t.new_rank),
            NOW()
        FROM (
            SELECT 
                r.student_id,
                s.class_id,
                ROUND(AVG(r.percentage), 2) AS avg_pct,
                COUNT(r.id) AS tests,
                RANK() OVER (
                    ORDER BY AVG(r.percentage) DESC, COUNT(r.id) DESC
                ) AS new_rank
            FROM `results` r
            JOIN `students` s ON s.id = r.student_id
            WHERE s.status = 'active'
            GROUP BY r.student_id, s.class_id
        ) t
        LEFT JOIN `leaderboard_overall` lo ON lo.student_id = t.student_id
        ON DUPLICATE KEY UPDATE
            `prev_rank_no`   = `rank_no`,
            `avg_percentage` = VALUES(`avg_percentage`),
            `tests_count`    = VALUES(`tests_count`),
            `rank_no`        = VALUES(`rank_no`),
            `updated_at`     = NOW();
    ";
    $db->exec($overallSql);
    echo " -> Overall leaderboard calculated.\n";

    $db->commit();
    echo "[" . date('Y-m-d H:i:s') . "] Leaderboard Rebuild Complete! Status: OK\n";
} catch (\Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo "[ERROR] Rebuild Failed: " . $e->getMessage() . "\n";
    exit(1);
}