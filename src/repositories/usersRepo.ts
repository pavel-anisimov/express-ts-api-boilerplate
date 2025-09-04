// src/repositories/usersRepo.ts
import { randomUUID } from "node:crypto";
import seed from "../../mock-data/users.json" assert { type: "json" };

export type User = {
    id: string;
    email: string;
    name?: string | null | undefined;
    roles?: string | undefined;
};

type SeedUser = {
    id?: string;
    email?: string;
    name?: string | null;
    roles?: string;
};

/**
 * Array of user objects.
 *
 * This variable takes an initial seed, verifies if it is an array, and maps its elements
 * to create user objects of the type `User`. If certain properties are missing in the seed,
 * default values are assigned.
 *
 * - `id` is a string representation of the user's ID or a randomly generated UUID if not provided.
 * - `email` is set to an empty string if not available.
 * - `name` is nullable and defaults to `null` if not present.
 * - `role` is optional and set to `undefined` if not specified.
 *
 * The resulting array is of the type `User[]`.
 */
const users: User[] = (Array.isArray(seed) ? (seed as unknown as SeedUser[]) : []).map(
    (user): User => ({
        id: user.id ? String(user.id) : randomUUID(),          // ✅ randomUUID is immediately available
        email: user.email ? String(user.email) : "",
        name: user.name ?? null,
        roles: user.roles ?? undefined,
    })
);

/**
 * Repository for managing and querying user data.
 *
 * Provides methods to retrieve users by unique identifiers or email,
 * as well as access the complete list of users.
 *
 * Methods:
 * - `findById(id: string): User | undefined` - Locates a single user by their unique identifier.
 * - `findByEmail(email: string): User | undefined` - Searches for a user using their email address, case-insensitively.
 * - `all(): User[]` - Retrieves a copy of the current list of all users.
 */
export const usersRepo = {
    findById(id: string): User | undefined {
        return users.find((u) => u.id === id);
    },
    findByEmail(email: string): User | undefined {
        const e = email.trim().toLowerCase();
        return users.find((user) => user.email.toLowerCase() === e);
    },
    all(): User[] {
        return users.slice();
    },
};
