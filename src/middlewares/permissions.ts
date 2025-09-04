import type { Request, Response, NextFunction } from 'express';

import { permissionsForRoles, type Permission } from '../config/rbac';

/**
 * Middleware function that checks if the authenticated user has the required permissions.
 *
 * @param {...Permission[]} needed - The list of permissions required to access the route.
 * @return {function(Request, Response, NextFunction): void} A middleware function that validates permissions and proceeds if granted or returns a 403 error response if not.
 */
export function requirePermission(...needed: Permission[]): (arg0: Request, arg1: Response, arg2: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
        const roles = req.user?.roles ?? [];
        const granted = permissionsForRoles(roles);
        const ok = needed.every((permission) => granted.has(permission as Permission));

        if (!ok) {
            return res.status(403).json({error: {code: 'FORBIDDEN', message: 'Insufficient permission'}});
        }

        next();
    };
}
