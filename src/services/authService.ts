import bcrypt from "bcryptjs";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { PythonAuthApiError, remoteLogin, remoteRefresh } from "../clients/pythonAuthClient";
import { env } from "../config/env";
import { authMockRepository, type AuthMockSession } from "../repositories/authMockRepository";
import { findByEmail, getProfileByEmail, getProfileById, updateOwnProfile, type EditableUserProfilePatch, type UserProfileDto } from "../repositories/usersRepo";
import { HttpError } from "../utils/httpError";

const { TokenExpiredError } = jwt;

type Role = string;

type RequesterIdentity = {
    id?: string;
    sub?: string;
    email?: string;
};

interface JwtClaims extends JwtPayload {
    sub: string;
    type?: "access" | "refresh";
}

export type LoginResponse = {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: unknown;
};

function mapPythonError(error: PythonAuthApiError): HttpError {
    const body = error.body;
    const message =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : error.message;

    return new HttpError(error.status, message);
}

export const authService = {
    async login(email: string, password: string): Promise<LoginResponse> {
        if (!env.MOCK_DATA_ENABLED) {
            try {
                return await remoteLogin(email, password);
            } catch (error) {
                if (error instanceof PythonAuthApiError) {
                    throw mapPythonError(error);
                }

                throw error;
            }
        }

        const user = await findByEmail(email);

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new HttpError(401, "bad credentials");
        }

        if (user.deleted || user.status !== "active") {
            throw new HttpError(403, "user is not active");
        }

        if (!user.emailVerified) {
            throw new HttpError(403, "email not verified");
        }

        const accessPayload = { sub: user.id, email: user.email, name: user.name, roles: user.roles };
        const refreshPayload = { sub: user.id, type: "refresh" };

        const accessOptions: SignOptions = { expiresIn: env.ACCESS_TTL, jwtid: uuid() };
        const refreshOptions: SignOptions = { expiresIn: env.REFRESH_TTL, jwtid: uuid() };

        const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, accessOptions);
        const refreshToken = jwt.sign(refreshPayload, env.JWT_SECRET, refreshOptions);
        const { passwordHash: _hidden, ...safe } = user;

        return { accessToken, refreshToken, user: safe };
    },

    async refresh(refreshToken: string): Promise<unknown> {
        if (!env.MOCK_DATA_ENABLED) {
            try {
                return await remoteRefresh(refreshToken);
            } catch (error) {
                if (error instanceof PythonAuthApiError) {
                    throw mapPythonError(error);
                }

                throw error;
            }
        }

        try {
            const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtClaims;

            if (decoded?.type !== "refresh") {
                throw new HttpError(401, "invalid refresh token");
            }

            const payload = { sub: decoded.sub };
            const accessOptions: SignOptions = { expiresIn: env.ACCESS_TTL, jwtid: uuid() };
            return { accessToken: jwt.sign(payload, env.JWT_SECRET, accessOptions) };
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }

            if (error instanceof TokenExpiredError) {
                throw new HttpError(401, "refresh token expired");
            }

            throw error;
        }
    },

    logout(): null {
        return null;
    },

    async me(requester: RequesterIdentity): Promise<UserProfileDto> {
        const profile =
            (requester.id || requester.sub ? await getProfileById(requester.id ?? requester.sub ?? "") : null) ??
            (requester.email ? await getProfileByEmail(requester.email) : null);

        if (!profile) {
            throw new HttpError(404, "profile not found");
        }

        return profile;
    },

    async updateMyProfile(requester: RequesterIdentity, patch: EditableUserProfilePatch): Promise<UserProfileDto> {
        const profile = await updateOwnProfile(requester, patch);
        if (!profile) {
            throw new HttpError(404, "profile not found");
        }

        return profile;
    },

    getSession(accessToken: string): AuthMockSession | null {
        return authMockRepository.getSession(accessToken);
    },

    issueToken(sub: string, email: string, roles: Role[], name?: string): string {
        const payload = { sub, email, roles, name };
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN, jwtid: uuid() };

        return jwt.sign(payload, env.JWT_SECRET, options);
    },
};
