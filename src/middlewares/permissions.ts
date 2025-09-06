import type { Request, Response, NextFunction } from 'express';

import { permissionsForRoles, type Permission } from '../config/rbac';

type AuthedRequest = Request & {
  user?: { roles?: string[] };
  auth?: { roles?: string[] };
};

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
