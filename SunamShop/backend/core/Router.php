<?php
declare(strict_types=1);

namespace SunamShop\Core;

/**
 * Fast Lightweight Regex REST Router
 */
final class Router
{
    private array $routes = [];
    private array $globalMiddlewares = [];

    public function addGlobalMiddleware(callable $middleware): void
    {
        $this->globalMiddlewares[] = $middleware;
    }

    public function add(string $method, string $pattern, mixed $handler, array $middlewares = []): void
    {
        // Convert URL pattern like /api/v1/products/{slug} into regex
        $regex = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        $this->routes[] = [
            'method'      => strtoupper($method),
            'pattern'     => $pattern,
            'regex'       => $regex,
            'handler'     => $handler,
            'middlewares' => $middlewares,
        ];
    }

    public function get(string $pattern, mixed $handler, array $middlewares = []): void
    {
        $this->add('GET', $pattern, $handler, $middlewares);
    }

    public function post(string $pattern, mixed $handler, array $middlewares = []): void
    {
        $this->add('POST', $pattern, $handler, $middlewares);
    }

    public function put(string $pattern, mixed $handler, array $middlewares = []): void
    {
        $this->add('PUT', $pattern, $handler, $middlewares);
    }

    public function patch(string $pattern, mixed $handler, array $middlewares = []): void
    {
        $this->add('PATCH', $pattern, $handler, $middlewares);
    }

    public function delete(string $pattern, mixed $handler, array $middlewares = []): void
    {
        $this->add('DELETE', $pattern, $handler, $middlewares);
    }

    public function options(string $pattern, mixed $handler): void
    {
        $this->add('OPTIONS', $pattern, $handler);
    }

    public function dispatch(Request $request): void
    {
        // Run global middlewares (e.g. CORS)
        foreach ($this->globalMiddlewares as $middleware) {
            $middleware($request);
        }

        if ($request->getMethod() === 'OPTIONS') {
            Response::json(null, 'OK', 200);
            return;
        }

        $requestPath = rtrim($request->getPath(), '/') ?: '/';
        $requestMethod = $request->getMethod();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $requestMethod) {
                continue;
            }

            if (preg_match($route['regex'], $requestPath, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                // Run route-level middlewares
                foreach ($route['middlewares'] as $middleware) {
                    if (is_callable($middleware)) {
                        $middleware($request);
                        if (Response::$hasResponded) {
                            return;
                        }
                    }
                }

                if (Response::$hasResponded) {
                    return;
                }

                $handler = $route['handler'];
                if (is_callable($handler)) {
                    $handler($request, $params);
                    return;
                }

                if (is_array($handler) && count($handler) === 2) {
                    [$class, $method] = $handler;
                    $controller = new $class();
                    $controller->$method($request, $params);
                    return;
                }
            }
        }

        Response::notFound('API route not found: ' . $requestMethod . ' ' . $requestPath);
    }
}
