<?php

/**
 * Simple .env file loader for PHP (no Composer needed)
 * Loads KEY=VALUE pairs from a .env file into getenv() / $_ENV
 */
function loadEnv(string $filePath): void {
    if (!file_exists($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Skip comments
        $line = trim($line);
        if (str_starts_with($line, '#') || $line === '') {
            continue;
        }

        // Split on first '=' only
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $key   = trim($parts[0]);
        $value = trim($parts[1]);

        // Remove surrounding quotes if any ("value" or 'value')
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        // Only set if not already defined (server-level env takes priority)
        if (getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}
