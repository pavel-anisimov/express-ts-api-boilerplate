// src/controllers/users.ts
import { randomUUID } from "node:crypto";

import type { Request, Response } from "express";

import seed from "../../mock-data/users.json" assert { type: "json" };

/** User type in the application. */
export type User = {
    id: string;
    email: string;
    name?: string | null | undefined;
    role?: string | undefined;
};

/** Entry type in the seed file (may not contain all fields) */
type SeedUser = {
    id?: string;
    email?: string;
    name?: string | null;
    role?: string;
};

/** Helper types for queries. */
type ListUsersQuery = { q?: string; page?: number; limit?: number };
type CreateUserBody = { email: string; name?: string | null; role?: string };
type UpdateUserBody = Partial<CreateUserBody>;
type AssignRoleBody = { userId: string; role: string };

/** Safe id generator. */
function cryptoRandomId(): string {
    try {
        return randomUUID();
    } catch {
        return Math.random().toString(36).slice(2, 10);
    }
}

/** Initializing memory from JSON, softly normalizing data. */
const DB: { users: User[] } = {
    users: (Array.isArray(seed) ? (seed as unknown as SeedUser[]) : []).map((user): User => ({
        id: (user.id && String(user.id)) || cryptoRandomId(),
        email: (user.email && String(user.email)) || "",
        name: user.name ?? null,
        role: user.role ?? undefined,
    })),
};

/** GET /api/users?q=&page=&limit= */
export async function listUsers(
    req: Request<unknown, unknown, unknown, ListUsersQuery>,
    res: Response
) {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const q = (req.query.q ?? "").toString().trim().toLowerCase();

    let items = DB.users;
    if (q) {
        items = items.filter(
            (user) =>
                user.email.toLowerCase().includes(q) ||
                ((user.name ?? "") as string).toLowerCase().includes(q) ||
                (user.role ?? "").toLowerCase().includes(q)
        );
    }

    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    res.json({ items: paged, total: items.length, page, limit });
}

/** GET /api/users/:id */
export async function getUser(req: Request<{ id: string }>, res: Response) {
    const user = DB.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
}

/** POST /api/users */
export async function createUser(
    req: Request<unknown, unknown, CreateUserBody>,
    res: Response
) {
    const { email, name = null, role } = req.body;

    if (!email?.trim()) {
        return res.status(400).json({ message: "email is required" });
    }

    const user: User = {
        id: cryptoRandomId(),
        email: email.trim(),
        name,                    // string | null | undefined — acceptable
        role: role ?? undefined, // normalization to string | undefined
    };

    DB.users.push(user);
    res.status(201).json(user);
}

/** PUT /api/users/:id */
export async function updateUser(
    req: Request<{ id: string }, unknown, UpdateUserBody>,
    res: Response
) {
    const current = DB.users.find((u) => u.id === req.params.id);
    if (!current) {
        return res.status(404).json({ message: "User not found" });
    }

    const next: User = {
        id: current.id, // important: explicitly save the id (otherwise TS may consider it optional)
        email: req.body.email !== undefined ? req.body.email : current.email,
        name: Object.prototype.hasOwnProperty.call(req.body, "name")
            ? req.body.name! // can be string or null
            : current.name,
        role: Object.prototype.hasOwnProperty.call(req.body, "role")
            ? (req.body.role ?? undefined)
            : current.role,
    };

    const idx = DB.users.findIndex((u) => u.id === current.id);
    DB.users[idx] = next;

    res.json(next);
}

/** DELETE /api/users/:id */
export async function deleteUser(req: Request<{ id: string }>, res: Response) {
    const idx = DB.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "User not found" });
    DB.users.splice(idx, 1);
    res.status(204).end();
}

/** POST /api/users/assign-role */
export async function assignRole(
    req: Request<unknown, unknown, AssignRoleBody>,
    res: Response
) {
    const { userId, role } = req.body;
    const user = DB.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = role ?? undefined;
    res.json({ ok: true, user });
}
