<?php
declare(strict_types=1);

namespace SunamShop\Controllers;

use SunamShop\Core\Database;
use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class HealthController
{
    public function check(Request $request): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->query('SELECT VERSION() as version');
            $dbVersion = $stmt->fetchColumn();

            Response::success([
                'status'     => 'healthy',
                'app_name'   => 'Sunam Shop API',
                'database'   => [
                    'connected' => true,
                    'version'   => $dbVersion,
                ],
                'php_version' => PHP_VERSION,
                'server_time' => date('c'),
            ], 'Sunam Shop REST API is operational.');
        } catch (\Throwable $e) {
            Response::error('Database connection failed: ' . $e->getMessage(), 500);
        }
    }
}
