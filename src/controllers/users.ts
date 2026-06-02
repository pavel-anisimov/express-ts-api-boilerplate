// src/controllers/users.ts
import type { Request, Response, NextFunction } from "express";

import { userService } from "../services/userService";
import { HttpError } from "../utils/httpError";

type RequestWithAuth = Request & {
    auth?: {
        sub: string;
        email?: string;
        roles?: string[];
    };
    user?: {
        id: string;
        email?: string;
        roles: string[];
    };
};

function getRequester(request: Request): RequestWithAuth["user"] | RequestWithAuth["auth"] | null {
    const authReq = request as RequestWithAuth;
    return authReq.user ?? authReq.auth ?? null;
}

function handleServiceError(error: unknown, response: Response, next: NextFunction) {
    if (error instanceof HttpError) {
        return response.status(error.status).json({ error: error.message });
    }

    return next(error);
}

/**
 * GET /api/users?query=&page=&limit=
 * (also supports short ?q= for backwards compatibility)
 * Returns the patinated envelope: { items, total, page, limit }
 */
export async function listUsers(
    request: Request<unknown, unknown, unknown, { query?: string; q?: string; page?: string | number; limit?: string | number }>,
    response: Response,
    next: NextFunction
) {
    try {
        return response.json(await userService.listUsers(request.query));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * GET /api/users/:id
 * Blank - we leave it for future implementation.
 */
export async function getUserById(_request: Request, response: Response, next: NextFunction) {
    try {
        // TODO: implement via microservice repository/client
        // const user = await getById(request.params.id);
        // if (!user) return response.status(404).json({ error: "not found" });
        // return response.json(user);
        return response.status(501).json({ error: "not implemented" });
    } catch (error) {
        return next(error);
    }
}

/**
 * GET /api/users/:id/profile
 * Returns a full profile to admins, or to the authenticated owner.
 */
export async function getUserProfile(
    request: Request<{ id: string }>,
    response: Response,
    next: NextFunction
) {
    try {
        const requester = getRequester(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        return response.json(await userService.getUserProfile(requester, request.params.id));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * PATCH /api/users/:id/deleted
 * Soft-delete/restore a user. Allowed for admins or the target user.
 */
export async function setUserDeleted(
    request: Request<{ id: string }, unknown, { deleted: boolean }>,
    response: Response,
    next: NextFunction
) {
    try {
        const requester = getRequester(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        return response.json(await userService.setUserDeleted(requester, request.params.id, request.body.deleted));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * PATCH /api/users/:id/suspended
 * Suspend/unsuspend a user. Allowed for admins and managers.
 */
export async function setUserSuspended(
    request: Request<{ id: string }, unknown, { suspended: boolean }>,
    response: Response,
    next: NextFunction
) {
    try {
        const requester = getRequester(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        return response.json(await userService.setUserSuspended(requester, request.params.id, request.body.suspended));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}

/**
 * POST /api/users
 * Blank - we leave it for future implementation.
 */
export async function createUser(_request: Request, response: Response, next: NextFunction) {
    try {
        // TODO: body validation, create in service, publish Kafka events
        return response.status(501).json({ error: "not implemented" });
    } catch (error) {
        return next(error);
    }
}

/**
 * PUT /api/users/:id
 * Blank - we leave it for future implementation.
 */
export async function updateUser(_request: Request, response: Response, next: NextFunction) {
    try {
        // TODO: partial/full update, publish Kafka events
        return response.status(501).json({ error: "not implemented" });
    } catch (error) {
        return next(error);
    }
}

/**
 * DELETE /api/users/:id
 * Blank - we leave it for future implementation.
 */
export async function deleteUser(
    request: Request<{ id: string }>,
    response: Response,
    next: NextFunction
) {
    try {
        const requester = getRequester(request);
        if (!requester) {
            return response.status(401).json({ error: "unauthorized" });
        }

        return response.json(await userService.deleteUser(requester, request.params.id));
    } catch (error) {
        return handleServiceError(error, response, next);
    }
}
