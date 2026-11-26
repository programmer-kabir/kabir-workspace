<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

/**
 * Lazy singleton PDO connector for MariaDB 10.4+ / MySQL 8+.
 */
final class Database
{
    private ?PDO $pdo = null;

    /**
     * @param array{host: string, port: string, name: string, user: string, pass: string, charset: string} $config
     */
    public function __construct(private readonly array $config)
    {
    }

    /**
     * Return an active PDO connection or throw on connection failure.
     */
    public function connection(): PDO
    {
        if ($this->pdo !== null) {
            return $this->pdo;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $this->config['host'],
            $this->config['port'],
            $this->config['name'],
            $this->config['charset']
        );

        $this->pdo = new PDO($dsn, $this->config['user'], $this->config['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return $this->pdo;
    }

    /**
     * Probe database connectivity safely for health checks without aborting the response.
     *
     * @return array{status: string, driver: string, message?: string}
     */
    public function healthStatus(): array
    {
        try {
            $this->connection()->query('SELECT 1');
            return ['status' => 'connected', 'driver' => 'mysql'];
        } catch (PDOException $e) {
            return [
                'status' => 'disconnected',
                'driver' => 'mysql',
                'message' => $e->getMessage(),
            ];
        }
    }
}
