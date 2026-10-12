<?php
/**
 * Prayaas Gurukul — Core Backend Configuration (Phase 3)
 * Hostinger Shared Hosting Database & Cryptographic Parameters
 */

declare(strict_types=1);

// Prevent direct web execution
if (!defined('PRAYAAS_CORE')) {
    http_response_code(403);
    exit('Direct script access is forbidden.');
}

return [
    // Database credentials (Configured in Hostinger hPanel > MySQL Management)
    'db' => [
        'host'     => getenv('DB_HOST') ?: 'localhost',
        'port'     => 3306,
        'name'     => getenv('DB_NAME') ?: 'uXXXXXX_prayaas',
        'user'     => getenv('DB_USER') ?: 'uXXXXXX_admin',
        'pass'     => getenv('DB_PASS') ?: 'YourStrongDbPasswordHere',
        'charset'  => 'utf8mb4',
    ],

    // Security and Session Settings
    'security' => [
        'app_secret'         => 'prayaas_secret_key_8f93b5a19c72e34d', // 32+ character entropy string
        'token_lifetime_days'=> 30,                                    // Active token duration
        'max_login_attempts' => 5,                                     // Rate limit per 15 min window
        'rate_limit_minutes' => 15,
    ],

    // Path definitions
    'paths' => [
        'uploads_dpp'     => dirname(__DIR__, 2) . '/public_html/uploads/dpp/',
        'uploads_profile' => dirname(__DIR__, 2) . '/public_html/uploads/profile/',
        'logs'            => dirname(__DIR__) . '/logs/',
    ],

    // System Defaults
    'app' => [
        'name'      => 'Prayaas Gurukul',
        'env'       => 'production', // 'development' or 'production'
        'timezone'  => 'Asia/Kolkata',
    ]
];