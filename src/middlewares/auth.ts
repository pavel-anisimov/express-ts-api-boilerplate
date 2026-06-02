import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { PythonAuthApiError, remoteGetMe } from "../clients/pythonAuthClient";
import { env } from "../config/env";

const { TokenExpiredError } = jwt;

const JWT_SECRET = process.env.JWT_SECRET || "dev_super_secret_change_me";

/**
 * JWT payload fields required by downstream controllers and RBAC middleware.
 */
type JwtClaims = JwtPayload & {
    sub: string;
    email?: string;
    name?: string;
    roles?: string[];
};

/**
 * Request shape after a caller has been authenticated.
 *
 * `auth` keeps JWT-style claims; `user` is the normalized identity shape used
 * by controllers and permission middleware. Both are populated to keep older
 * and newer gateway code paths compatible.
 */
type AuthedRequest = Request & {
    auth?: JwtClaims;
    user?: {
        id: string;
        email?: string;
        name?: string;
        roles: string[];
    };
};

/**
 * Requires a valid bearer token and attaches requester identity to Express.
 *
 * In mock mode the gateway verifies local JWTs. In non-mock mode it delegates
 * token validation and user lookup to the Python auth API via `/me`, then maps
 * that response into the same `request.auth` and `request.user` shapes.
 */
export async function requireAuth(request: Request, response: Response, next: NextFunction) {
    const headers = request.headers.authorization ?? "";
    const token = headers.startsWith("Bearer ") ? headers.slice(7) : "";
    if (!token) {
        return response.status(401).json({ error: "missing token" });
    }

    if (!env.MOCK_DATA_ENABLED) {
        try {
            const user = await remoteGetMe(token);
            (request as AuthedRequest).user = {
                id: user.id,
                email: user.email,
                name: user.name ?? user.display_name ?? "",
                roles: user.roles,
            };
            (request as AuthedRequest).auth = {
                sub: user.id,
                email: user.email,
                name: user.name ?? user.display_name ?? "",
                roles: user.roles,
            };
            return next();
        } catch (error) {
            if (error instanceof PythonAuthApiError) {
                return response.status(error.status).json(error.body ?? { error: error.message });
            }

            return next(error);
        }
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
