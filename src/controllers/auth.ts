// src/controllers/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions, type JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { findByEmail /*, getById */ } from "../repositories/usersRepo";
import { env } from "../config/env";

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
    user?: JwtClaims;
    auth?: JwtClaims;
};

export async function login(request: Request, response: Response, next: NextFunction) {
    try {
        const { email, password } = request.body ?? {};
        if (!email || !password) {
            return response.status(400).json({ error: "email and password are required" });
        }

        const user = await findByEmail(String(email));

        if (!user || user.password !== String(password)) {
            return response.status(401).json({ error: "bad credentials" });
        }

        if (user.status !== "active") {
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

        const { password: _hidden, ...safe } = user;

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

/** GET /auth/me - return the current user from req.user/req.auth */
export async function me(request: Request, response: Response) {
    const authReq = request as RequestWithAuth;
    const fromReq = authReq.user ?? authReq.auth;
    if (!fromReq) {
        return response.status(401).json({ error: "unauthorized" });
    }

    // Bringing it to a safe form
    return response.json({
        id: fromReq.id ?? fromReq.sub,
        email: fromReq.email ?? null,
        name: fromReq.name ?? null,
        roles: Array.isArray(fromReq.roles) ? fromReq.roles : [],
    });
}
