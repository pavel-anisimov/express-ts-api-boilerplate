import type { Request, Response, NextFunction } from 'express';

import { permissionsForRoles, type Permission } from '../config/rbac';

export function requirePermission(...needed: Permission[]) {
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
