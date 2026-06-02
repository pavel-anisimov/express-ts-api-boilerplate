import bcrypt from "bcryptjs";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { PythonAuthApiError, remoteLogin, remoteRefresh } from "../clients/pythonAuthClient";
import { env } from "../config/env";
import { repositories } from "../repositories";
import type { AuthRepositorySession } from "../repositories/auth/AuthRepository";
import { findByEmail, getProfileByEmail, getProfileById, updateOwnProfile, type EditableUserProfilePatch, type UserProfileDto } from "../repositories/usersRepo";
import { HttpError } from "../utils/httpError";

const { TokenExpiredError } = jwt;

type Role = string;

/**
 * Authenticated requester identity accepted by auth service methods.
 *
 * Different middleware paths provide different identifiers, so service methods
 * resolve users by id/sub first and fall back to email when needed.
 */
type RequesterIdentity = {
    id?: string;
    sub?: string;
    email?: string;
};

/**
 * JWT claims required for refresh-token validation.
 */
interface JwtClaims extends JwtPayload {
    sub: string;
    type?: "access" | "refresh";
}

/**
 * Login response shape returned by mock and remote auth flows.
 *
 * Both camelCase and snake_case token names are supported while the gateway
 * tracks Python auth API response shapes and older frontend expectations.
 */
export type LoginResponse = {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: unknown;
};

/**
 * Converts Python auth API failures into gateway HttpError instances.
 */
function mapPythonError(error: PythonAuthApiError): HttpError {
    const body = error.body;
    const message =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : error.message;

    return new HttpError(error.status, message);
}

/**
 * Auth domain service.
 *
 * The service coordinates remote auth clients, mock repositories, token
 * issuing, and profile lookup. Controllers should keep only HTTP validation
 * and response mapping, leaving auth decisions here.
 */
export const authService = {
    /**
     * Authenticates a user and returns tokens plus a safe user payload.
     */
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

    /**
     * Validates a refresh token and returns a new access token payload.
     */
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

    /**
     * Placeholder logout hook.
     *
     * Token revocation/session invalidation can be wired here once logout
     * behavior is backed by the downstream auth service.
     */
    logout(): null {
        return null;
    },

    /**
     * Resolves the current user's frontend profile.
     */
    async me(requester: RequesterIdentity): Promise<UserProfileDto> {
        const profile =
            (requester.id || requester.sub ? await getProfileById(requester.id ?? requester.sub ?? "") : null) ??
            (requester.email ? await getProfileByEmail(requester.email) : null);

        if (!profile) {
            throw new HttpError(404, "profile not found");
        }

        return profile;
    },

    /**
     * Updates editable fields on the current user's own profile.
     */
    async updateMyProfile(requester: RequesterIdentity, patch: EditableUserProfilePatch): Promise<UserProfileDto> {
        const profile = await updateOwnProfile(requester, patch);
        if (!profile) {
            throw new HttpError(404, "profile not found");
        }

        return profile;
    },

    /**
     * Looks up a mock auth session by access token.
     */
    getSession(accessToken: string): AuthRepositorySession | null {
        return repositories.auth.getSession(accessToken);
    },

    /**
     * Issues a local JWT for tests and mock-mode flows.
     */
    issueToken(sub: string, email: string, roles: Role[], name?: string): string {
        const payload = { sub, email, roles, name };
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN, jwtid: uuid() };

        return jwt.sign(payload, env.JWT_SECRET, options);
    },
};
