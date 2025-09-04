// src/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_super_secret_change_me";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "missing token" });

    try {
        const payload = jwt.verify(token, JWT_SECRET) as {
            sub: string; email?: string; name?: string; roles?: string[];
        };
        (req as any).auth = payload;
        (req as any).user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            roles: payload.roles ?? [],
        };
        next();
    } catch {
        return res.status(401).json({ error: "invalid token" });
    }
}
