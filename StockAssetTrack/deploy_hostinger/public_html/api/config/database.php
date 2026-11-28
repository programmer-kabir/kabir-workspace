<?php

declare(strict_types=1);

/**
 * Database connection configuration for MariaDB 10.4+ / MySQL 8+.
 */
return [
    'host' => envValue('DB_HOST', '127.0.0.1'),
    'port' => envValue('DB_PORT', '3306'),
    'name' => envValue('DB_NAME', 'stockassettrack'),
    'user' => envValue('DB_USER', 'root'),
    'pass' => envValue('DB_PASS', ''),
    'charset' => 'utf8mb4',
];
