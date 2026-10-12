-- =============================================================================
-- Prayaas Gurukul — Production Database Schema (Phase 3)
-- Target: MariaDB 10.3+ / MySQL 8.0+ (Hostinger Shared Hosting)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `notification_reads`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `dpps`;
DROP TABLE IF EXISTS `videos`;
DROP TABLE IF EXISTS `leaderboard_overall`;
DROP TABLE IF EXISTS `leaderboard_class`;
DROP TABLE IF EXISTS `suspensions`;
DROP TABLE IF EXISTS `answers`;
DROP TABLE IF EXISTS `attempts`;
DROP TABLE IF EXISTS `results`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `tests`;
DROP TABLE IF EXISTS `auth_tokens`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `classes`;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Classes Master (Locked to 6, 9, 10 as per Gurukul Curriculum)
-- -----------------------------------------------------------------------------
CREATE TABLE `classes` (
    `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `class_number` TINYINT UNSIGNED NOT NULL UNIQUE,
    `display_name` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Students Master
-- -----------------------------------------------------------------------------
CREATE TABLE `students` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_code` VARCHAR(32) NOT NULL UNIQUE, -- e.g. PG-10-108
    `name` VARCHAR(100) NOT NULL,
    `class_id` TINYINT UNSIGNED NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    `photo_url` VARCHAR(255) DEFAULT NULL,
    `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_students_class` (`class_id`),
    INDEX `idx_students_status` (`status`),
    CONSTRAINT `fk_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Admins Master
-- -----------------------------------------------------------------------------
CREATE TABLE `admins` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `full_name` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('superadmin', 'faculty') NOT NULL DEFAULT 'superadmin',
    `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    `last_login_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Auth Tokens (Secure Session Management: Stored as SHA-256 Hashes)
-- -----------------------------------------------------------------------------
CREATE TABLE `auth_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_type` ENUM('student', 'admin') NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `token_hash` CHAR(64) NOT NULL UNIQUE,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_token_lookup` (`token_hash`, `expires_at`),
    INDEX `idx_token_user` (`user_type`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Tests / Exams Master
-- -----------------------------------------------------------------------------
CREATE TABLE `tests` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `class_id` TINYINT UNSIGNED NOT NULL,
    `subject` VARCHAR(60) NOT NULL,
    `duration_min` SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    `total_marks` INT UNSIGNED NOT NULL DEFAULT 40,
    `marks_per_correct` DECIMAL(4,2) NOT NULL DEFAULT 4.00,
    `marks_per_incorrect` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    `start_at` DATETIME DEFAULT NULL,
    `end_at` DATETIME DEFAULT NULL,
    `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    `created_by` INT UNSIGNED DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_tests_class_status` (`class_id`, `status`),
    CONSTRAINT `fk_tests_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Questions Master
-- -----------------------------------------------------------------------------
CREATE TABLE `questions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `test_id` INT UNSIGNED NOT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `question_text` TEXT NOT NULL,
    `option_a` TEXT NOT NULL,
    `option_b` TEXT NOT NULL,
    `option_c` TEXT NOT NULL,
    `option_d` TEXT NOT NULL,
    `correct_option` ENUM('A', 'B', 'C', 'D') NOT NULL,
    `explanation` TEXT DEFAULT NULL,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_questions_test` (`test_id`, `sort_order`),
    CONSTRAINT `fk_questions_test` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Student Test Attempts (Strict Guard: 1 Student = 1 Attempt per Test)
-- -----------------------------------------------------------------------------
CREATE TABLE `attempts` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `test_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `started_at` DATETIME NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `submitted_at` DATETIME DEFAULT NULL,
    `status` ENUM('in_progress', 'submitted', 'suspended', 'rejected') NOT NULL DEFAULT 'in_progress',
    `violation_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `score` DECIMAL(6,2) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_test_student` (`test_id`, `student_id`),
    INDEX `idx_attempts_status` (`status`, `expires_at`),
    CONSTRAINT `fk_attempts_test` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_attempts_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Answers per Attempt (Auto-saved item by item)
-- -----------------------------------------------------------------------------
CREATE TABLE `answers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `attempt_id` INT UNSIGNED NOT NULL,
    `question_id` INT UNSIGNED NOT NULL,
    `selected_option` ENUM('A', 'B', 'C', 'D') DEFAULT NULL,
    `is_reviewed` TINYINT(1) NOT NULL DEFAULT 0,
    `is_correct` TINYINT(1) DEFAULT NULL,
    `marks_awarded` DECIMAL(5,2) DEFAULT 0.00,
    `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_attempt_question` (`attempt_id`, `question_id`),
    INDEX `idx_answers_attempt` (`attempt_id`),
    CONSTRAINT `fk_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Suspensions Desk (Triggered on tab-switch / minimize exit violations)
-- -----------------------------------------------------------------------------
CREATE TABLE `suspensions` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `attempt_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `test_id` INT UNSIGNED NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'resumed', 'fresh_attempt', 'rejected') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` DATETIME DEFAULT NULL,
    `resolved_by` INT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_suspensions_status` (`status`),
    CONSTRAINT `fk_suspensions_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `attempts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_suspensions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_suspensions_test` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Results History
-- -----------------------------------------------------------------------------
CREATE TABLE `results` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `test_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `attempt_id` INT UNSIGNED DEFAULT NULL,
    `marks_obtained` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    `total_marks` DECIMAL(6,2) NOT NULL DEFAULT 40.00,
    `percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `total_questions` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `correct_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `incorrect_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `unattempted_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `evaluated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_results_test_student` (`test_id`, `student_id`),
    INDEX `idx_results_student` (`student_id`),
    CONSTRAINT `fk_results_test` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_results_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Leaderboard: Class-Wise Ranking (Calculated via Cron / Service)
-- -----------------------------------------------------------------------------
CREATE TABLE `leaderboard_class` (
    `student_id` INT UNSIGNED NOT NULL,
    `class_id` TINYINT UNSIGNED NOT NULL,
    `avg_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tests_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `rank_no` INT UNSIGNED NOT NULL DEFAULT 0,
    `prev_rank_no` INT UNSIGNED NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`student_id`),
    INDEX `idx_class_rank` (`class_id`, `rank_no`),
    CONSTRAINT `fk_lb_class_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lb_class_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Leaderboard: Overall Gurukul Ranking (Cross-Class Combined)
-- -----------------------------------------------------------------------------
CREATE TABLE `leaderboard_overall` (
    `student_id` INT UNSIGNED NOT NULL,
    `class_id` TINYINT UNSIGNED NOT NULL,
    `avg_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tests_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `rank_no` INT UNSIGNED NOT NULL DEFAULT 0,
    `prev_rank_no` INT UNSIGNED NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`student_id`),
    INDEX `idx_overall_rank` (`rank_no`),
    CONSTRAINT `fk_lb_overall_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Video Lectures (YouTube IFrame Embeds)
-- -----------------------------------------------------------------------------
CREATE TABLE `videos` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `youtube_id` VARCHAR(32) NOT NULL,
    `class_id` TINYINT UNSIGNED NOT NULL,
    `subject` VARCHAR(60) NOT NULL,
    `duration_label` VARCHAR(30) DEFAULT '25 mins',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_videos_class` (`class_id`),
    CONSTRAINT `fk_videos_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. DPPs (Daily Practice Problem PDFs)
-- -----------------------------------------------------------------------------
CREATE TABLE `dpps` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size_label` VARCHAR(30) DEFAULT '1.2 MB',
    `class_id` TINYINT UNSIGNED NOT NULL,
    `subject` VARCHAR(60) NOT NULL,
    `questions_count` SMALLINT UNSIGNED NOT NULL DEFAULT 15,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_dpps_class` (`class_id`),
    CONSTRAINT `fk_dpps_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Gurukul Notice Board / Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE `notifications` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `body` TEXT NOT NULL,
    `class_id` TINYINT UNSIGNED DEFAULT NULL, -- NULL = all enrolled classes
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_notif_class` (`class_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. Notification Read Receipts
-- -----------------------------------------------------------------------------
CREATE TABLE `notification_reads` (
    `notification_id` INT UNSIGNED NOT NULL,
    `student_id` INT UNSIGNED NOT NULL,
    `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notification_id`, `student_id`),
    CONSTRAINT `fk_nr_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_nr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;