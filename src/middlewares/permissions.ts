import type { Request, Response, NextFunction } from 'express';

import { permissionsForRoles, type Permission } from '../config/rbac';

/**
 * Authenticated request shape used by permission checks.
 *
 * `request.user` is preferred because it is normalized by auth middleware.
 * `request.auth` remains supported for JWT-claim-based middleware paths.
 */
type AuthedRequest = Request & {
  user?: { roles?: string[] };
  auth?: { roles?: string[] };
};

/**
 * Creates middleware that requires all requested permissions.
 *
 * The middleware aggregates permissions from every requester role and requires
 * every permission in `needed` to be present. Unknown roles grant no access.
 */
export function requirePermission(...needed: Permission[]) {
    return (request: Request, response: Response, next: NextFunction) => {
        const anyRequest = request as AuthedRequest;
        const roles: string[] = anyRequest.user?.roles ?? anyRequest.auth?.roles ?? [];

        const granted = permissionsForRoles(roles);
        const ok = needed.every((permission) => granted.has(permission));
        if (!ok) {
            return response
                .status(403)
                .json({ error: { code: "FORBIDDEN", message: "Insufficient permission" } });
        }

        next();
    };
}
