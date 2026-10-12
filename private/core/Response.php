<?php
/**
 * Prayaas Gurukul — Standard JSON Response Helper
 * Enforces unified contract: { "success": bool, "data": any, "error": string|null }
 */

declare(strict_types=1);

namespace Prayaas\Core;

if (!defined('PRAYAAS_CORE')) {
    exit('Forbidden');
}

class Response {
    /**
     * Send HTTP Success JSON
     */
    public static function json(mixed $data = null, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        
        echo json_encode([
            'success' => true,
            'data'    => $data,
            'error'   => null
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send HTTP Error JSON
     */
    public static function error(string $message, int $statusCode = 400): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

        echo json_encode([
            'success' => false,
            'data'    => null,
            'error'   => $message
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}