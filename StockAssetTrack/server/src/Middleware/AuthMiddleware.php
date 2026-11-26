<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

/**
 * Resolves and validates signed Bearer authentication + active device slots.
 */
final class AuthMiddleware
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    /**
     * Extract authenticated user (or emit 401/403 if invalid/required or revoked device slot).
     *
     * @return array<string, mixed>|null
     */
    public function resolveUser(Request $request, bool $required = false, bool $enforceDeviceSlot = true): ?array
    {
        $header = trim($request->header('authorization'));
        if (!str_starts_with(strtolower($header), 'bearer ')) {
            if ($required) {
                Response::error('Authentication required. Please sign in.', 401, 'UNAUTHORIZED');
            }
            return null;
        }

        $token = trim(substr($header, 7));
        $userId = $this->authService->verifyAuthToken($token);
        if ($userId === null) {
            Response::error('Your session has expired. Please sign in again.', 401, 'INVALID_TOKEN');
        }

        $user = $this->authService->findUserById($userId);
        if ($user === null) {
            Response::error('Account not found.', 401, 'USER_NOT_FOUND');
        }

        if ($enforceDeviceSlot) {
            $deviceToken = trim($request->header('x-device-token'));
            if ($deviceToken === '' || !$this->authService->isDeviceRegistered($userId, $deviceToken)) {
                Response::error(
                    'Active device slot is missing or was replaced on another browser.',
                    409,
                    'DEVICE_SLOT_REVOKED',
                    ['maxDevices' => $user['maxDevices']]
                );
            }
        }

        return $user;
    }
}
