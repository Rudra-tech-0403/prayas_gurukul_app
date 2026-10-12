<?php
/**
 * Prayaas Gurukul — Database Connection Singleton (PDO)
 * Features persistent options, strict error mode, and UTF8MB4 encoding.
 */

declare(strict_types=1);

namespace Prayaas\Core;

use PDO;
use PDOException;

if (!defined('PRAYAAS_CORE')) {
    exit('Forbidden');
}

class Database {
    private static ?PDO $instance = null;

    /**
     * Get active PDO connection instance
     */
    public static function getConnection(array $config): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $config['db']['host'],
                $config['db']['port'],
                $config['db']['name'],
                $config['db']['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $config['db']['user'], $config['db']['pass'], $options);
            } catch (PDOException $e) {
                error_log('[Prayaas DB Error] ' . $e->getMessage());
                http_response_code(500);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode([
                    'success' => false,
                    'data'    => null,
                    'error'   => 'Database connection failed. Verify hostinger credentials in config.php.'
                ]);
                exit;
            }
        }

        return self::$instance;
    }
}