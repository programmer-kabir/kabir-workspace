<?php

declare(strict_types=1);

$serverRoot = file_exists(__DIR__ . '/config/env.php') ? __DIR__ : dirname(__DIR__);
require_once $serverRoot . '/config/env.php';
loadEnvFile($serverRoot . '/.env');
require_once $serverRoot . '/src/Core/Autoloader.php';

use App\Controllers\AiController;
use App\Controllers\AnalyticsController;
use App\Controllers\BillingController;
use App\Controllers\ContributorController;
use App\Controllers\HealthController;
use App\Controllers\ProxyController;
use App\Controllers\SearchController;
use App\Controllers\TrendingController;
use App\Controllers\UserController;
use App\Core\Cache;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\QuotaMiddleware;
use App\Middleware\SecurityMiddleware;
use App\Services\AdobeClientFactory;
use App\Services\AuthService;
use App\Services\CalendarService;
use App\Services\CatalogQueryService;
use App\Services\EnrichmentService;
use App\Services\HeatmapService;
use App\Services\PromptAiService;
use App\Services\ScoringService;
use App\Services\TagClusterService;
use App\Services\WatchlistService;

$appConfig = require $serverRoot . '/config/app.php';
$dbConfig = require $serverRoot . '/config/database.php';

$request = Request::fromGlobals();
Response::applyCors($request, $appConfig['corsOrigins']);

if ($request->method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

set_exception_handler(static function (Throwable $e) use ($appConfig): never {
    $details = $appConfig['debug'] ? ['exception' => $e->getMessage()] : [];
    Response::error('Internal server error.', 500, 'INTERNAL_ERROR', $details);
});

$database = new Database($dbConfig);
$cache = new Cache($database);
$adobeClient = AdobeClientFactory::create($appConfig['adobe'], $appConfig['url']);
$scoringService = new ScoringService($appConfig['scoring']);
$enrichmentService = new EnrichmentService($scoringService);
$catalogQueryService = new CatalogQueryService($enrichmentService, $scoringService);
$heatmapService = new HeatmapService($adobeClient, $enrichmentService, $cache);
$tagClusterService = new TagClusterService($adobeClient, $enrichmentService, $cache);
$promptAiService = new PromptAiService($adobeClient, $enrichmentService, $cache, $appConfig['ai']);
$calendarService = new CalendarService($cache);
$watchlistService = new WatchlistService($database);

$authService = new AuthService($database, $appConfig);
$authMiddleware = new AuthMiddleware($authService);
$quotaMiddleware = new QuotaMiddleware($database);
$securityMiddleware = new SecurityMiddleware(
    $database,
    $authService,
    (string) ($appConfig['security']['turnstileSecretKey'] ?? '')
);

$healthController = new HealthController($appConfig, $database, $adobeClient);
$searchController = new SearchController($adobeClient, $catalogQueryService, $enrichmentService, $cache);
$trendingController = new TrendingController($adobeClient, $catalogQueryService, $cache);
$contributorController = new ContributorController(
    $adobeClient,
    $catalogQueryService,
    $enrichmentService,
    $watchlistService,
    $cache,
    $authMiddleware
);
$analyticsController = new AnalyticsController($heatmapService, $tagClusterService, $calendarService);
$aiController = new AiController($promptAiService);
$proxyController = new ProxyController($adobeClient, $cache);
$userController = new UserController(
    $appConfig,
    $database,
    $authService,
    $authMiddleware,
    $quotaMiddleware,
    $securityMiddleware,
    $adobeClient
);
$billingController = new BillingController(
    $appConfig,
    $database,
    $authMiddleware,
    $authService,
    $securityMiddleware
);

$enforceMetered = static function (callable $handler, string $quotaKind = 'search') use (
    $appConfig,
    $authMiddleware,
    $quotaMiddleware,
    $securityMiddleware
): callable {
    return static function (Request $req, array $params = []) use (
        $handler,
        $quotaKind,
        $appConfig,
        $authMiddleware,
        $quotaMiddleware,
        $securityMiddleware
    ): mixed {
        $securityMiddleware->verifyOptionalCsrHeader($req);
        $securityMiddleware->enforceRateLimit($req, 'api:' . $quotaKind, 90, 60);
        $requireAuth = (bool) ($appConfig['security']['requireAuthForMetered'] ?? false);
        $user = $authMiddleware->resolveUser($req, required: $requireAuth);
        if ($user !== null) {
            $quotaMiddleware->enforceAndConsume($user, $quotaKind);
        }
        return $handler($req, $params);
    };
};

$router = new Router();
$router->get('/', [$healthController, 'health']);
$router->get('/api/health', [$healthController, 'health']);
$router->get('/api/meta/config', [$healthController, 'metaConfig']);

// Metered Discovery & AI Endpoints (atomic quota & verification enforcement when signed in or strict mode enabled)
$router->get('/api/search', $enforceMetered([$searchController, 'search'], 'search'));
$router->get('/api/trending', $enforceMetered([$trendingController, 'trending'], 'search'));
$router->get('/api/similar', $enforceMetered([$searchController, 'similar'], 'search'));
$router->post('/api/upload-search', $enforceMetered([$searchController, 'uploadSearch'], 'search'));
$router->get('/api/contributor/search', $enforceMetered([$contributorController, 'search'], 'search'));
$router->post('/api/prompts/reconstruct', $enforceMetered([$aiController, 'reconstruct'], 'prompt'));

// Supporting Analytics & Lookup Endpoints
$router->get('/api/contributor/stats', [$contributorController, 'stats']);
$router->post('/api/contributor/country', [$contributorController, 'countries']);
$router->get('/api/contributor/watchlist', [$contributorController, 'watchlistIndex']);
$router->post('/api/contributor/watchlist', [$contributorController, 'watchlistStore']);
$router->delete('/api/contributor/watchlist', [$contributorController, 'watchlistDelete']);
$router->get('/api/heatmap', [$analyticsController, 'heatmap']);
$router->post('/api/keywords/clusters', [$analyticsController, 'keywordClusters']);
$router->get('/api/calendar', [$analyticsController, 'calendar']);
$router->post('/api/images/stats', [$proxyController, 'batchStats']);
$router->get('/api/images/proxy', [$proxyController, 'proxyImage']);
$router->get('/api/demo-media/{id}', [$proxyController, 'demoMedia']);

// Phase 6 Auth, Security, Usage, Device Slots, Favorites & Billing Endpoints
$router->post('/api/auth/register', [$userController, 'register']);
$router->post('/api/auth/login', [$userController, 'login']);
$router->post('/api/auth/verify-email', [$userController, 'verifyEmail']);
$router->post('/api/auth/resend-verification', [$userController, 'resendVerification']);
$router->get('/api/auth/me', [$userController, 'me']);
$router->post('/api/auth/csr-token', [$userController, 'csrToken']);
$router->get('/api/usage/check', [$userController, 'usageCheck']);

$router->get('/api/user/dashboard', [$userController, 'dashboard']);
$router->post('/api/user/profile', [$userController, 'updateProfile']);
$router->get('/api/user/devices', [$userController, 'listDevices']);
$router->post('/api/user/device/replace', [$userController, 'replaceDevice']);
$router->delete('/api/user/devices', [$userController, 'revokeDevice']);

$router->get('/api/favorites', [$userController, 'listFavorites']);
$router->post('/api/favorites', [$userController, 'saveFavorite']);
$router->delete('/api/favorites', [$userController, 'deleteFavorite']);

$router->post('/api/billing/checkout', [$billingController, 'checkout']);
$router->get('/api/billing/portal', [$billingController, 'portal']);
$router->post('/api/billing/portal', [$billingController, 'portal']);
$router->post('/api/billing/cancel', [$billingController, 'cancel']);
$router->post('/api/billing/resubscribe', [$billingController, 'resubscribe']);
$router->post('/api/billing/webhook/{gateway}', [$billingController, 'webhook']);

$router->dispatch($request);
