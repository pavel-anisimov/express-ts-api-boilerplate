// src/controllers/auth.ts
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { findByEmail, getProfileByEmail, getProfileById, updateOwnProfile } from "../repositories/usersRepo";
import { env } from "../config/env";

const { TokenExpiredError } = jwt;

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

export async function login(request: Request, response: Response, next: NextFunction) {
    try {
        const { email, password } = request.body ?? {};
        if (!email || !password) {
            return response.status(400).json({ error: "email and password are required" });
        }

        const user = await findByEmail(String(email));

        if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
            return response.status(401).json({ error: "bad credentials" });
        }

        if (user.deleted || user.status !== "active") {
            return response.status(403).json({ error: "user is not active" });
        }

        if (!user.emailVerified) {
            return response.status(403).json({ error: "email not verified" });
        }

        const accessPayload = { sub: user.id, email: user.email, name: user.name, roles: user.roles };
        const refreshPayload = { sub: user.id, type: "refresh" };

        const accessOptions: SignOptions = { expiresIn: env.ACCESS_TTL, jwtid: uuid() };
        const refreshOptions: SignOptions = { expiresIn: env.REFRESH_TTL, jwtid: uuid() };

        const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, accessOptions);
        const refreshToken = jwt.sign(refreshPayload, env.JWT_SECRET, refreshOptions);

        const { passwordHash: _hidden, ...safe } = user;

        return response.json({ accessToken, refreshToken, user: safe });
    } catch (error) {
        return next(error);
    }
}

export async function refresh(request: Request, response: Response, next: NextFunction) {
    try {
        const { refreshToken } = request.body ?? {};
        if (!refreshToken) {
            return response.status(400).json({ error: "missing refreshToken" });
        }

        const decoded = jwt.verify(String(refreshToken), env.JWT_SECRET) as JwtClaims;

        if (decoded?.type !== "refresh") {
            return response.status(401).json({ error: "invalid refresh token" });
        }

        const payload = { sub: decoded.sub };
        const accessOptions: SignOptions = { expiresIn: env.ACCESS_TTL, jwtid: uuid() };
        const newAccessToken = jwt.sign(payload, env.JWT_SECRET, accessOptions);

        return response.json({ accessToken: newAccessToken });
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return response.status(401).json({ error: "refresh token expired" });
        }
        return next(error);
    }
}

export async function logout(_request: Request, response: Response) {
    return response.status(204).end();
}

/** GET /api/auth/me - return the current user from req.user/req.auth */
export async function me(request: Request, response: Response, next: NextFunction) {
    try {
        const requester = requesterFrom(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        const profile =
            (requester.id || requester.sub ? await getProfileById(requester.id ?? requester.sub ?? "") : null) ??
            (requester.email ? await getProfileByEmail(requester.email) : null);

        if (!profile) {
            return response.status(404).json({ error: "profile not found" });
        }

        return response.json(profile);
    } catch (error) {
        return next(error);
    }
}

/** PATCH /api/auth/me/profile - update editable fields on the authenticated user's own profile */
export async function updateMyProfile(request: Request, response: Response, next: NextFunction) {
    try {
        const requester = requesterFrom(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        const profile = await updateOwnProfile(requester, request.body);
        if (!profile) {
            return response.status(404).json({ error: "profile not found" });
        }

        return response.json(profile);
    } catch (error) {
        return next(error);
    }
}
