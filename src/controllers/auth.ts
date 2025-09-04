// src/controllers/auth.ts
import type { Response } from "express";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

import { usersRepo } from "../repositories/usersRepo";
import type { AuthenticatedRequest } from "../middlewares/auth";

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? "dev_secret_change_me") as Secret;
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
    ((process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "15m");
const REFRESH_EXPIRES_IN: SignOptions["expiresIn"] =
    ((process.env.REFRESH_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d");

// In-memory storage of refresh tokens: userId -> refreshToken
const refreshStore = new Map<string, string>();

/**
 * Generates and signs a new access token with user-specific information.
 *
 * @param {string} userId - The unique identifier for the user. Used as the subject (sub) in the token payload.
 * @param {string} [email] - Optional. The email address of the user to include in the token payload.
 * @param {string} [role] - Optional. The role of the user to include in the token payload.
 * @return {string} A signed JWT access token containing the provided payload and expiry settings.
 */
function signAccessToken(userId: string, email?: string, role?: string) {
    const payload = { sub: userId, email, role }; // 'sub' — standard claim (subject)
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Signs and generates a refresh token for the specified user.
 *
 * @param {string} userId - The unique identifier of the user for whom the refresh token is being generated.
 * @return {string} The signed refresh token string.
 */
function signRefreshToken(userId: string) {
    const payload = { sub: userId, type: "refresh" as const };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

/**
 * Handles user login by validating email and password and returning access and refresh tokens on success.
 *
 * @param {AuthenticatedRequest} req - The authenticated HTTP request object, containing `email` and `password` in the body.
 * @param {Response} res - The HTTP response object used for sending the result back to the client.
 * @return {Promise<void>} A promise that resolves when the login process is complete and the response has been sent.
 */
export async function login(req: AuthenticatedRequest, res: Response) {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }

    const user = usersRepo.findByEmail(email);
    // There are no passwords in the seed data - for the demo we accept any, if the user is found
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user.id, user.email, user.role);
    const refreshToken = signRefreshToken(user.id);
    refreshStore.set(user.id, refreshToken);

    return res.json({ accessToken, refreshToken, user });
}

/**
 * Refreshes the access token using the provided refresh token.
 * Verifies the refresh token, ensures it is valid and belongs to the user,
 * then generates a new access token if successful.
 *
 * @param {AuthenticatedRequest} req - The authenticated request object containing the refresh token in the body.
 * @param {Response} res - The response object used to send back the status and data.
 * @return {Promise<Response>} Returns a response containing a new access token if successful,
 *                             otherwise sends an error status and message.
 */
export async function refresh(req: AuthenticatedRequest, res: Response) {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
    if (!refreshToken) {
        return res.status(400).json({ message: "refreshToken is required" });
    }

    try {
        const payload = jwt.verify(refreshToken, JWT_SECRET) as { sub: string; type?: string };
        if (payload.type !== "refresh") {
            throw new Error("invalid token type");
        }

        const stored = refreshStore.get(payload.sub);
        if (stored !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = usersRepo.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const accessToken = signAccessToken(user.id, user.email, user.roles);
        return res.json({ accessToken });
    } catch {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

/**
 * Handles the authenticated user's request to retrieve their profile information.
 *
 * @param {AuthenticatedRequest} req The request object containing the authenticated user's information.
 * @param {Response} res The response object used to send back the user's profile or an error message.
 * @return {Promise<Response>} Returns a promise that resolves to the HTTP response with the user's profile data or appropriate error status and message.
 */
export async function me(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const userId = req.auth?.sub;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = usersRepo.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
}

/**
 * Logs out the authenticated user by deleting their refresh token from the store.
 *
 * @param {AuthenticatedRequest} req - The request object containing authentication details.
 * @param {Response} res - The response object to send the status code and end the response.
 * @return {Promise<void>} Resolves when the logout process is complete and the response is sent.
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<e.Response<any, Record<string, any>>> {
    const userId = req.auth?.sub;
    if (userId) {
        refreshStore.delete(userId);
    }
    return res.status(204).end();
}

/**
 * Handles the registration process for users. Currently, this method is not implemented.
 *
 * @param {AuthenticatedRequest} _req - The authenticated request object containing user details and other request information.
 * @param {Response} res - The response object used to send the HTTP response.
 * @return {Promise<Response>} The HTTP response with a status code of 501 indicating that the functionality is not implemented.
 */
export async function register(_req: AuthenticatedRequest, res: Response) {
    return res.status(501).json({ message: "Not implemented" });
}
