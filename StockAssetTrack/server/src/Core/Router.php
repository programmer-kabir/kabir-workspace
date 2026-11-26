<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Lightweight REST router supporting exact paths and {param} placeholders.
 */
final class Router
{
    /** @var array<int, array{method: string, pattern: string, regex: string, handler: callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->addRoute('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->addRoute('POST', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->addRoute('DELETE', $pattern, $handler);
    }

    public function dispatch(Request $request): never
    {
        $matchedOtherMethod = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $request->path(), $matches)) {
                continue;
            }

            if ($route['method'] !== $request->method()) {
                $matchedOtherMethod = true;
                continue;
            }

            $params = array_filter($matches, static fn(string|int $key): bool => is_string($key), ARRAY_FILTER_USE_KEY);
            ($route['handler'])($request, $params);
            Response::json(['success' => true]);
        }

        if ($matchedOtherMethod) {
            Response::error('Method not allowed for this route.', 405, 'METHOD_NOT_ALLOWED');
        }

        Response::error('Endpoint not found.', 404, 'NOT_FOUND');
    }

    private function addRoute(string $method, string $pattern, callable $handler): void
    {
        $normalized = '/' . trim($pattern, '/');
        if ($normalized !== '/') {
            $normalized = rtrim($normalized, '/');
        }

        $regexBody = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $normalized);
        $regex = '#^' . $regexBody . '$#';

        $this->routes[] = [
            'method' => $method,
            'pattern' => $normalized,
            'regex' => $regex,
            'handler' => $handler,
        ];
    }
}
