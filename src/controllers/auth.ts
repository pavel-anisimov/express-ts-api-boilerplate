// src/controllers/auth.ts
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";

import { authService } from "../services/authService";
import { HttpError } from "../utils/httpError";

type Role = string;
interface JwtClaims extends JwtPayload {
    sub: string;                 // user id
    email?: string;
    name?: string;
    roles?: Role[];
    type?: "access" | "refresh";
}
// What do auth middlewares put in request
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

function handleServiceError(error: unknown, response: Response, next: NextFunction) {
    if (error instanceof HttpError) {
        return response.status(error.status).json({ error: error.message });
    }

    return next(error);
}

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

export async function logout(_request: Request, response: Response) {
    authService.logout();
    return response.status(204).end();
}

/** GET /api/auth/me - return the current user from req.user/req.auth */
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

/** PATCH /api/auth/me/profile - update editable fields on the authenticated user's own profile */
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
