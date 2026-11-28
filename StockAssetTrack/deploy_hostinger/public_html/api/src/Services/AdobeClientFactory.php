<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Instantiates the configured Adobe Stock data adapter from application configuration.
 */
final class AdobeClientFactory
{
    /**
     * @param array{mode: string, apiKey: string, productHeader: string} $adobeConfig
     */
    public static function create(array $adobeConfig, string $appUrl = 'http://localhost:5001'): AdobeClientInterface
    {
        if ($adobeConfig['mode'] === 'official') {
            return new OfficialAdobeClient($adobeConfig['apiKey'], $adobeConfig['productHeader']);
        }

        return new DemoAdobeClient($appUrl);
    }
}
