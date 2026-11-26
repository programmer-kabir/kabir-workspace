<?php

declare(strict_types=1);

/**
 * Central application configuration including scoring thresholds and plan entitlements.
 */
return [
    'env' => envValue('APP_ENV', 'local'),
    'debug' => filter_var(envValue('APP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN),
    'url' => rtrim(envValue('APP_URL', 'http://localhost:5001'), '/'),
    'corsOrigins' => array_values(array_filter(array_map(
        static fn(string $origin): string => trim($origin),
        explode(',', envValue('CORS_ALLOWED_ORIGINS', 'http://localhost:5174'))
    ))),
    'adobe' => [
        'mode' => envValue('ADOBE_DATA_MODE', 'demo'),
        'apiKey' => envValue('ADOBE_API_KEY', ''),
        'productHeader' => envValue('ADOBE_PRODUCT_HEADER', 'StockAssetTrack/1.0'),
    ],
    'ai' => [
        'geminiApiKey' => envValue('GEMINI_API_KEY', ''),
        'openaiApiKey' => envValue('OPENAI_API_KEY', ''),
    ],
    'security' => [
        'appSecret' => envValue('APP_SECRET', 'local-dev-secret-change-me'),
        'cronSecret' => envValue('CRON_SECRET', 'local-cron-secret-change-me'),
        'requireAuthForMetered' => filter_var(envValue('REQUIRE_AUTH_FOR_METERED', 'false'), FILTER_VALIDATE_BOOLEAN),
        'tokenTtlSeconds' => max(3600, (int) envValue('AUTH_TOKEN_TTL_SECONDS', '604800')),
        'turnstileSecretKey' => envValue('TURNSTILE_SECRET_KEY', ''),
    ],
    'billing' => [
        'stripeWebhookSecret' => envValue('STRIPE_WEBHOOK_SECRET', ''),
        'creemWebhookSecret' => envValue('CREEM_WEBHOOK_SECRET', ''),
        'cryptomusApiKey' => envValue('CRYPTOMUS_API_KEY', ''),
    ],
    'scoring' => [
        'competitionLowMax' => 10000,
        'competitionMediumMax' => 500000,
    ],
    'plans' => [
        'free' => ['dailySearches' => 2, 'maxDevices' => 1, 'priceMonthly' => 0],
        'starter' => ['dailySearches' => 20, 'maxDevices' => 1, 'priceMonthly' => 4],
        'pro' => ['dailySearches' => -1, 'maxDevices' => 3, 'priceMonthly' => 8],
        'annual' => ['dailySearches' => -1, 'maxDevices' => 5, 'priceAnnualFirstYear' => 67, 'priceAnnual' => 96],
    ],
];
