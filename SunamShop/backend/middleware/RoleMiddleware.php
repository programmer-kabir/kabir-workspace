<?php
declare(strict_types=1);

namespace SunamShop\Middleware;

use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class RoleMiddleware
{
    /**
     * @param int[] $allowedRoles
     */
    public static function hasAny(array $allowedRoles): callable
    {
        return function (Request $request) use ($allowedRoles): void {
            if (!$request->user) {
                Response::unauthorized('Authentication required.');
                return;
            }

            $userRoleId = (int)($request->user['role_id'] ?? 0);
            if (!in_array($userRoleId, $allowedRoles, true)) {
                Response::forbidden('Access denied. You do not have permission to view this resource.');
            }
        };
    }
}
