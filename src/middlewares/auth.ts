// src/middlewares/auth.ts
import type {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";

/**
 * Represents the payload of a JSON Web Token (JWT).
 *
 * This type is used to model the data contained within a JWT, including
 * the subject (typically the user ID), email, role, and standard token
 * fields such as issued at (iat) and expiration (exp) timestamps.
 *
 * Fields:
 * - `sub`: A string representing the subject of the token, typically the user ID.
 * - `email`: An optional string containing the email address of the user.
 * - `role`: An optional string specifying the role or access level of the user.
 * - `iat`: An optional number representing the issued at timestamp in seconds since the Unix epoch.
 * - `exp`: An optional number representing the expiration timestamp in seconds since the Unix epoch.
 */
export type JwtPayload = {
    sub: string;          // userId
    email?: string;
    role?: string;
    iat?: number;
    exp?: number;
};

export type AuthenticatedRequest = Request & { auth?: JwtPayload };

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";

/**
 * Middleware function to validate the presence and validity of a Bearer token in the Authorization header of the HTTP request.
 * If the token is valid, it attaches the decoded token payload to the `req.auth` property and proceeds to the next middleware.
 * If the token is missing, invalid, or expired, it sends a 401 Unauthorized response.
 *
 * @param {Request} req - The HTTP request object, containing headers and other request-related data.
 * @param {Response} res - The HTTP response object, used to send responses back to the client.
 * @param {NextFunction} next - The callback to pass control to the next middleware function.
 * @return {void} Does not return a value but may terminate the request-response lifecycle with a 401 status on authentication failure.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): e.Response<any, Record<string, any>> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = header.slice("Bearer ".length).trim();
    try {
        (req as AuthenticatedRequest).auth = jwt.verify(token, JWT_SECRET) as JwtPayload;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

/**
 * Retrieves the authenticated user's ID from the request object.
 *
 * @param {Request} req - The request object containing authentication details.
 * @return {string | undefined} The ID of the authenticated user if available, otherwise undefined.
 */
export function getAuthUserId(req: Request): string | undefined {
    return (req as AuthenticatedRequest).auth?.sub;
}
