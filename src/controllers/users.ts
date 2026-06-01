// src/controllers/users.ts
import type { Request, Response, NextFunction } from "express";

import { getAllUsers, getProfileByEmail, getProfileById, updateUserDeleted, updateUserSuspended, type UserSafe } from "../repositories/usersRepo";

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

function getRequesterId(requester: NonNullable<ReturnType<typeof getRequester>>): string {
    return "id" in requester ? requester.id : requester.sub;
}

async function canRequesterDelete(requester: NonNullable<ReturnType<typeof getRequester>>, targetId: string): Promise<boolean> {
    const requesterId = getRequesterId(requester);
    const requesterProfile =
        (await getProfileById(requesterId)) ??
        (requester.email ? await getProfileByEmail(requester.email) : null);

    return (requester.roles ?? []).includes("admin") || requesterProfile?.id === targetId || requesterId === targetId;
}

function canRequesterSuspend(requester: NonNullable<ReturnType<typeof getRequester>>): boolean {
    const roles = requester.roles ?? [];
    return roles.includes("admin") || roles.includes("manager");
}

function isDeletedUserProfile(profile: unknown): boolean {
    if (!profile || typeof profile !== "object") {
        return false;
    }

    const candidate = profile as { deleted?: unknown; status?: unknown };
    return candidate.deleted === true || candidate.status === "deleted";
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
        // secure parsing of query parameters
        const pageRaw = request.query.page ?? 1;
        const limitRaw = request.query.limit ?? 20;
        const page = Math.max(1, Number(pageRaw) || 1);
        const limit = Math.max(1, Number(limitRaw) || 20);

        const searchRaw = (request.query.query ?? request.query.q ?? "").toString().trim().toLowerCase();

        let items: UserSafe[] = await getAllUsers();

        if (searchRaw) {
            items = items.filter((user) =>
                user.email.toLowerCase().includes(searchRaw) ||
                (user.name ?? "").toLowerCase().includes(searchRaw) ||
                (user.username ?? "").toLowerCase().includes(searchRaw) ||
                (user.display_name ?? "").toLowerCase().includes(searchRaw) ||
                (user.first_name ?? "").toLowerCase().includes(searchRaw) ||
                (user.last_name ?? "").toLowerCase().includes(searchRaw) ||
                (user.status ?? "").toLowerCase().includes(searchRaw) ||
                (user.roles ?? []).some((role) => role.toLowerCase().includes(searchRaw))
            );
        }

        const total = items.length;
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);

        return response.json({ items: paged, total, page, limit });
    } catch (error) {
        return next(error);
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

        const target = await getProfileById(request.params.id);
        if (!target) {
            return response.status(404).json({ error: "profile not found" });
        }

        const requesterId = getRequesterId(requester);
        const requesterProfile =
            (await getProfileById(requesterId)) ??
            (requester.email ? await getProfileByEmail(requester.email) : null);
        const requesterRoles = requester.roles ?? [];
        const isAdmin = requesterRoles.includes("admin");
        const isOwner = requesterProfile?.id === target.id || requesterId === target.id;

        if (!isAdmin && !isOwner) {
            return response.status(403).json({ error: "forbidden" });
        }

        return response.json(target);
    } catch (error) {
        return next(error);
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

        const target = await getProfileById(request.params.id);
        if (!target) {
            return response.status(404).json({ error: "profile not found" });
        }

        if (!(await canRequesterDelete(requester, target.id))) {
            return response.status(403).json({ error: "forbidden" });
        }

        const updated = await updateUserDeleted(target.id, request.body.deleted);
        return response.json(updated);
    } catch (error) {
        return next(error);
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

        const target = await getProfileById(request.params.id);
        if (!target) {
            return response.status(404).json({ error: "profile not found" });
        }

        if (!canRequesterSuspend(requester)) {
            return response.status(403).json({ error: "forbidden" });
        }

        if (isDeletedUserProfile(target)) {
            return response.status(400).json({ error: "deleted user cannot be suspended" });
        }

        const updated = await updateUserSuspended(target.id, request.body.suspended);
        return response.json(updated);
    } catch (error) {
        return next(error);
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

        const target = await getProfileById(request.params.id);
        if (!target) {
            return response.status(404).json({ error: "profile not found" });
        }

        if (!(await canRequesterDelete(requester, target.id))) {
            return response.status(403).json({ error: "forbidden" });
        }

        const updated = await updateUserDeleted(target.id, true);
        return response.json(updated);
    } catch (error) {
        return next(error);
    }
}
