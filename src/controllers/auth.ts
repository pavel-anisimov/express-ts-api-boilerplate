import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";

import { authService } from "../services/authService";
import { HttpError } from "../utils/httpError";

type Role = string;

/**
 * JWT claims accepted by auth controllers.
 *
 * The gateway may receive identity from different auth middleware layers while
 * local mock auth and the downstream Python auth API evolve. This type captures
 * only the fields required to build a service-facing requester identity.
 */
interface JwtClaims extends JwtPayload {
    sub: string;
    email?: string;
    name?: string;
    roles?: Role[];
    type?: "access" | "refresh";
}

/**
 * Request shape after authentication middleware has attached identity.
 *
 * Some middleware writes normalized user data to `request.user`; JWT-oriented
 * middleware may write raw claims to `request.auth`. Controllers accept both
 * forms and normalize them before calling AuthService.
 */
type RequestWithAuth = Request & {
    user?: {
        id: string;
        email?: string;
        name?: string;
        roles: string[];
    };
    auth?: JwtClaims;
};

type RequesterIdentity = {
    id?: string;
    sub?: string;
    email?: string;
};

/**
 * Extracts the minimal identity needed by AuthService.
 *
 * Controllers only reject missing identity here. Authorization and profile
 * lookup rules remain in the service/repository layer.
 */
function requesterFrom(request: Request): RequesterIdentity | null {
    const authReq = request as RequestWithAuth;
    const fromReq = authReq.user ?? authReq.auth;
    if (!fromReq) {
        return null;
    }

    const requester: RequesterIdentity = {};

    if ("id" in fromReq && typeof fromReq.id === "string") {
        requester.id = fromReq.id;
    }

    if ("sub" in fromReq && typeof fromReq.sub === "string") {
        requester.sub = fromReq.sub;
    }

    if (typeof fromReq.email === "string") {
        requester.email = fromReq.email;
    }

    return requester;
}

/**
 * Converts expected service failures into HTTP responses.
 */
function handleServiceError(error: unknown, response: Response, next: NextFunction) {
    if (error instanceof HttpError) {
        return response.status(error.status).json({ error: error.message });
    }

    return next(error);
}

/**
 * POST /api/auth/login
 *
 * Validates the minimal request shape and delegates credential checking plus
 * token/session generation to AuthService.
 */
export async function login(request: Request, response: Response, next: NextFunction) {
    try {
        const { email, password } = request.body ?? {};
        if (!email || !password) {
            return response.status(400).json({ error: "email and password are required" });
        }

        return response.json(await authService.login(String(email), String(password)));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * POST /api/auth/refresh
 *
 * Accepts a refresh token and returns the refreshed auth payload produced by
 * AuthService. Token semantics intentionally stay outside the controller.
 */
export async function refresh(request: Request, response: Response, next: NextFunction) {
    try {
        const { refreshToken } = request.body ?? {};
        if (!refreshToken) {
            return response.status(400).json({ error: "missing refreshToken" });
        }

        return response.json(await authService.refresh(String(refreshToken)));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * POST /api/auth/logout
 *
 * Keeps the current no-content response contract while delegating session
 * invalidation behavior to AuthService.
 */
export async function logout(_request: Request, response: Response) {
    authService.logout();
    return response.status(204).end();
}

/**
 * GET /api/auth/me
 *
 * Returns the current frontend-facing profile for the authenticated requester.
 */
export async function me(request: Request, response: Response, next: NextFunction) {
    try {
        const requester = requesterFrom(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        return response.json(await authService.me(requester));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * PATCH /api/auth/me/profile
 *
 * Applies editable profile fields for the authenticated user. Field-level
 * validation and persistence rules are handled by AuthService/repositories.
 */
export async function updateMyProfile(request: Request, response: Response, next: NextFunction) {
    try {
        const requester = requesterFrom(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        return response.json(await authService.updateMyProfile(requester, request.body));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}
