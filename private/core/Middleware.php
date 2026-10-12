<?php
/**
 * Prayaas Gurukul — Security & Access Middleware
 * Extracts Bearer tokens, validates roles, and guards class boundaries.
 */

declare(strict_types=1);

namespace Prayaas\Core;

use PDO;

if (!defined('PRAYAAS_CORE')) {
    exit('Forbidden');
}

class Middleware {
    /**
     * Extract token from Authorization: Bearer <token>
     */
    public static function getBearerToken(): ?string {
        $headers = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (function_exists('apache_request_headers')) {
            $reqHeaders = apache_request_headers();
            if (isset($reqHeaders['Authorization'])) {
                $headers = trim($reqHeaders['Authorization']);
            }
        }

        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Require authenticated active student session
     */
    public static function requireStudent(PDO $db): array {
        $token = self::getBearerToken();
        $tokenData = Auth::validateToken($db, $token);

        if (!$tokenData || $tokenData['user_type'] !== 'student') {
            Response::error('Unauthorized. Valid student token required.', 401);
        }

        $stmt = $db->prepare("
            SELECT s.`id`, s.`student_code`, s.`name`, s.`class_id`, c.`class_number`, s.`status`
            FROM `students` s
            JOIN `classes` c ON c.`id` = s.`class_id`
            WHERE s.`id` = :id AND s.`status` = 'active'
            LIMIT 1
        ");
        $stmt->execute([':id' => $tokenData['user_id']]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::error('Student account is inactive or not found.', 403);
        }

        return $student;
    }

    /**
     * Require authenticated active administrator session
     */
    public static function requireAdmin(PDO $db): array {
        $token = self::getBearerToken();
        $tokenData = Auth::validateToken($db, $token);

        if (!$tokenData || $tokenData['user_type'] !== 'admin') {
            Response::error('Unauthorized. Administrator privileges required.', 401);
        }

        $stmt = $db->prepare("
            SELECT `id`, `username`, `full_name`, `role`, `status`
            FROM `admins`
            WHERE `id` = :id AND `status` = 'active'
            LIMIT 1
        ");
        $stmt->execute([':id' => $tokenData['user_id']]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin account suspended or invalid.', 403);
        }

        return $admin;
    }

    /**
     * Enforce strict class isolation (Prevents Class 6 student from opening Class 10 items)
     */
    public static function classGuard(array $student, int $targetClassNumber): void {
        if ((int)$student['class_number'] !== $targetClassNumber) {
            Response::error('Yeh content aapki class ke liye nahi hai. Access denied.', 403);
        }
    }
}