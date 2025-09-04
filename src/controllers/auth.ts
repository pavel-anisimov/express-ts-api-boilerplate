// src/controllers/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findByEmail /*, getById */ } from "../repositories/usersRepo";

const JWT_SECRET = process.env.JWT_SECRET || "dev_super_secret_change_me";
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "1h";
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || "7d";

export async function login(request: Request, response: Response, next: NextFunction) {
    try {
        const { email, password } = request.body ?? {};
        if (!email || !password) return response.status(400).json({ error: "email and password are required" });

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

        const payload = { sub: user.id, email: user.email, name: user.name, roles: user.roles };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
        const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_TTL });
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

        const decoded = jwt.verify(String(refreshToken), JWT_SECRET) as any;
        if (decoded?.type !== "refresh") {
            return response.status(401).json({ error: "invalid refresh token" });
        }

        const newAccessToken = jwt.sign({ sub: decoded.sub }, JWT_SECRET, { expiresIn: ACCESS_TTL });
        return response.json({ accessToken: newAccessToken });
    } catch (error: any) {
        if (error?.name === "TokenExpiredError") {
            return response.status(401).json({ error: "refresh token expired" });
        }
        return next(error);
    }
}

export async function logout(_request: Request, response: Response) {
    return response.status(204).end();
}

/** GET /auth/me — вернуть текущего пользователя из req.user/req.auth */
export async function me(request: Request, response: Response) {
    const anyReq = request as any;
    const fromReq = anyReq.user ?? anyReq.auth;
    if (!fromReq) {
        return response.status(401).json({ error: "unauthorized" });
    }

    // Приводим к безопасной форме
    return response.json({
        id: fromReq.id ?? fromReq.sub,
        email: fromReq.email ?? null,
        name: fromReq.name ?? null,
        roles: Array.isArray(fromReq.roles) ? fromReq.roles : [],
    });
}
