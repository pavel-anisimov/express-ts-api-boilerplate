// src/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload, TokenExpiredError } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_super_secret_change_me";

type JwtClaims = JwtPayload & {
    sub: string;
    email?: string;
    name?: string;
    roles?: string[];
};

type AuthedRequest = Request & {
    auth?: JwtClaims;
    user?: {
        id: string;
        email?: string;
        name?: string;
        roles: string[] };
};

export function requireAuth(request: Request, response: Response, next: NextFunction) {
    const headers = request.headers.authorization ?? "";
    const token = headers.startsWith("Bearer ") ? headers.slice(7) : "";
    if (!token) {
        return response.status(401).json({ error: "missing token" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as {
            sub: string; email?: string; name?: string; roles?: string[];
        };
        (request as AuthedRequest).auth = payload;
        (request as AuthedRequest).user = {
            id: payload.sub,
            email: payload.email || "",
            name: payload.name || "",
            roles: payload.roles ?? [],
        };
        return next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            return response.status(401).json({ error: "token expired" });
        }

        return response.status(401).json({ error: "invalid token" });
    }
}
