<?php
require_once __DIR__ . '/r2_config.php';

try {
    $client = R2Helper::getClient();
    $result = $client->putBucketCors([
        'Bucket' => 'dayalstock-assets',
        'CORSConfiguration' => [
            'CORSRules' => [
                [
                    'AllowedHeaders' => ['*'],
                    'AllowedMethods' => ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                    'AllowedOrigins' => ['*'],
                    'ExposeHeaders' => ['ETag'],
                    'MaxAgeSeconds' => 3000
                ],
            ],
        ],
    ]);
    echo "CORS configured successfully.\n";
} catch (Exception $e) {
    echo "Error configuring CORS: " . $e->getMessage() . "\n";
}
