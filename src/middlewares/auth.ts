import type {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { tokenRevocation } from '../services/tokenRevocation';
import type { Role } from '../types/models';

export type JwtPayload = { sub: string; roles: Role[]; email: string; name?: string; jti?: string; exp?: number };

declare module 'express-serve-static-core' {
    interface Request {
        user?: JwtPayload;
        tokenJti?: string | null;
        tokenExp?: number | null; // seconds epoch
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const hdr = req.headers.authorization ?? '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';

    if (!token) {
        return res.status(401).json({ error: { code: 'NO_TOKEN', message: 'Auth required' } });
    }

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        if (tokenRevocation.isRevoked(payload.jti ?? null)) {
            return res.status(401).json({ error: { code: 'TOKEN_REVOKED', message: 'Token revoked' } });
        }
        req.user = payload;
        req.tokenJti = payload.jti ?? null;
        req.tokenExp = payload.exp ?? null;

        next();
    } catch {
        res.status(401).json({ error: { code: 'BAD_TOKEN', message: 'Invalid token' } });
    }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];
    const ok = roles.some(role => userRoles.includes(<Role>role));

    if (!ok) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' }});
    }

    next();
  };
}

