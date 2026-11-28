<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\AdobeClientInterface;

/**
 * Exposes platform health diagnostics and non-secret capability configuration.
 */
final class HealthController
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        private readonly array $config,
        private readonly Database $database,
        private readonly AdobeClientInterface $adobeClient
    ) {
    }

    public function health(Request $request): never
    {
        Response::json([
            'success' => true,
            'service' => 'StockAssetTrack PHP API',
            'phpVersion' => PHP_VERSION,
            'environment' => $this->config['env'],
            'adobeDataMode' => $this->adobeClient->mode(),
            'adobeKeyConfigured' => trim((string) ($this->config['adobe']['apiKey'] ?? '')) !== '',
            'database' => $this->database->healthStatus(),
            'timestamp' => gmdate('c'),
        ]);
    }

    public function metaConfig(Request $request): never
    {
        Response::json([
            'success' => true,
            'adobeDataMode' => $this->adobeClient->mode(),
            'scoring' => $this->config['scoring'],
            'plans' => $this->config['plans'],
        ]);
    }
}
