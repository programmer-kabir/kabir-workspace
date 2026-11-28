<?php
declare(strict_types=1);

/**
 * SUNAM SHOP — Master RESTful Front Controller
 * Location: Sunamganj Sadar, Bangladesh
 */

// Enable strict error reporting in development
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Autoload core namespaces
spl_autoload_register(function (string $class): void {
    $prefix = 'SunamShop\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/../' . str_replace('\\', '/', $relative) . '.php';

    if (file_exists($path)) {
        require_once $path;
    }
});

use SunamShop\Core\Request;
use SunamShop\Core\Router;
use SunamShop\Middleware\CorsMiddleware;
use SunamShop\Middleware\AuthMiddleware;
use SunamShop\Middleware\RoleMiddleware;
use SunamShop\Controllers\HealthController;
use SunamShop\Controllers\AuthController;
use SunamShop\Controllers\CategoryController;
use SunamShop\Controllers\ProductController;
use SunamShop\Controllers\DeliveryZoneController;

$request = new Request();
$router = new Router();

// 1. Global CORS Middleware
$router->addGlobalMiddleware([CorsMiddleware::class, 'handle']);

// 2. Health & Diagnostic Routes
$router->get('/api/v1/health', [HealthController::class, 'check']);

// 3. Authentication Routes
$router->post('/api/v1/auth/register', [AuthController::class, 'register']);
$router->post('/api/v1/auth/login', [AuthController::class, 'login']);
$router->get('/api/v1/auth/me', [AuthController::class, 'me'], [[AuthMiddleware::class, 'handle']]);

// 4. Catalog & Location Routes (Public)
$router->get('/api/v1/categories', [CategoryController::class, 'index']);
$router->get('/api/v1/products', [ProductController::class, 'index']);
$router->get('/api/v1/products/{slug}', [ProductController::class, 'show']);
$router->get('/api/v1/delivery-zones', [DeliveryZoneController::class, 'index']);

// 5. Admin Protected Routes (Role: 1 = SUPER_ADMIN, 2 = ADMIN, 3 = STORE_MANAGER)
$adminRoleCheck = RoleMiddleware::hasAny([1, 2, 3]);

$router->get('/api/v1/admin/dashboard/stats', function (Request $req) {
    \SunamShop\Core\Response::success([
        'today_sales'     => 14250.00,
        'today_orders'    => 18,
        'pending_orders'  => 4,
        'low_stock_items' => 2,
        'gross_profit'    => 2850.00,
        'net_profit'      => 1950.00,
    ], 'Admin dashboard statistics retrieved successfully.');
}, [[AuthMiddleware::class, 'handle'], $adminRoleCheck]);

// Dispatch incoming request
$router->dispatch($request);
