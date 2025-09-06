// src/controllers/users.ts
import type { Request, Response, NextFunction } from "express";

import { getAllUsers, type UserSafe /*, getById*/ } from "../repositories/usersRepo";

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
export async function deleteUser(_request: Request, response: Response, next: NextFunction) {
    try {
        // TODO: delete/deactivate, publish Kafka events
        return response.status(501).json({ error: "not implemented" });
    } catch (error) {
        return next(error);
    }
}
