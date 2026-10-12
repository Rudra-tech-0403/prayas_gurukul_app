<?php
/**
 * Prayaas Gurukul — Authentication Service
 * Manages token hashing (SHA-256), passwords (Bcrypt), and token issuance.
 */

declare(strict_types=1);

namespace Prayaas\Core;

use PDO;
use Exception;

if (!defined('PRAYAAS_CORE')) {
    exit('Forbidden');
}

class Auth {
    /**
     * Generate secure raw token and compute its SHA-256 database hash
     */
    public static function issueToken(PDO $db, string $userType, int $userId, int $lifetimeDays = 30): string {
        $rawToken = bin2hex(random_bytes(32)); // 64 hex characters
        $tokenHash = hash('sha256', $rawToken);
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$lifetimeDays} days"));

        $stmt = $db->prepare("
            INSERT INTO `auth_tokens` (`user_type`, `user_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`)
            VALUES (:user_type, :user_id, :token_hash, :ip, :ua, :expires_at)
        ");
        $stmt->execute([
            ':user_type'  => $userType,
            ':user_id'    => $userId,
            ':token_hash' => $tokenHash,
            ':ip'         => $ip,
            ':ua'         => $userAgent,
            ':expires_at' => $expiresAt
        ]);

        return $rawToken;
    }

    /**
     * Validate Bearer token from HTTP request header
     */
    public static function validateToken(PDO $db, ?string $rawToken): ?array {
        if (!$rawToken) {
            return null;
        }

        $tokenHash = hash('sha256', $rawToken);

        $stmt = $db->prepare("
            SELECT `id`, `user_type`, `user_id`, `expires_at`
            FROM `auth_tokens`
            WHERE `token_hash` = :hash AND `expires_at` > NOW()
            LIMIT 1
        ");
        $stmt->execute([':hash' => $tokenHash]);
        $tokenRow = $stmt->fetch();

        if (!$tokenRow) {
            return null;
        }

        return $tokenRow;
    }

    /**
     * Revoke active token on Logout
     */
    public static function revokeToken(PDO $db, ?string $rawToken): bool {
        if (!$rawToken) {
            return false;
        }

        $tokenHash = hash('sha256', $rawToken);
        $stmt = $db->prepare("DELETE FROM `auth_tokens` WHERE `token_hash` = :hash");
        return $stmt->execute([':hash' => $tokenHash]);
    }
}