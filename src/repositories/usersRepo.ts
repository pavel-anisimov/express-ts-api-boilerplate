// src/repositories/usersRepo.ts
import { randomUUID } from "node:crypto";

import raw from "../../mock-data/users.json" assert { type: "json" };

export type UserRecord = {
    id: string;
    email: string;
    password: string; // only for auth, we do not give it out
    name: string;
    roles: string[];
    status: "active" | "blocked" | "pending_verification";
    emailVerified: boolean;
};

export type UserSafe = Omit<UserRecord, "password">;

const _CACHE: UserRecord[] | null = null;

export type UserStatus = 'active' | 'blocked' | 'pending_verification';

type RawUser = {
  id?: unknown;
  email?: unknown;
  password?: unknown;
  name?: unknown;
  roles?: unknown;
  status?: unknown;
  emailVerified?: unknown;   // camelCase
  email_verified?: unknown;  // snake_case (in case of another format)
};

function toRecord(user: unknown): UserRecord {
    const rawUser = user as RawUser;
    const id =
        typeof rawUser.id === "string"
            ? rawUser.id
            : typeof rawUser.email === "string"
                ? rawUser.email
                : randomUUID();

    const roles = Array.isArray(rawUser.roles)
        ? (rawUser.roles as unknown[]).filter((role): role is string => typeof role === "string")
        : [];

    const status: UserRecord["status"] =
        rawUser.status === "blocked" || rawUser.status === "pending_verification" ? (rawUser.status as UserStatus) : "active";

    const emailVerified =
        typeof rawUser.emailVerified === "boolean"
            ? rawUser.emailVerified
            : rawUser.email_verified === true;

    return {
        id,
        email: typeof rawUser.email === "string" ? rawUser.email : "",
        password: typeof rawUser.password === "string" ? rawUser.password : "",
        name: typeof rawUser.name === "string" ? rawUser.name : "",
        roles,
        status,
        emailVerified,
    };
}

function normalize(): UserRecord[] {
    // was: (raw as any[]).map((u: any) => ...)
    return (raw as unknown[]).map(toRecord);
}



/** For /api/users - a safe list without passwords */
export async function getAllUsers(): Promise<UserSafe[]> {
    return normalize().map(({ password: _password, ...safe }) => safe);
}

/** For /auth/login - search with password */
export async function findByEmail(email: string): Promise<UserRecord | null> {
    return normalize().find(user => user.email.toLowerCase() === String(email).toLowerCase()) ?? null;
}

/** (optional) get secure user by id */
export async function getById(id: string): Promise<UserSafe | null> {
    const user = normalize().find(user => user.id === id);
    if (!user) {
        return null;
    }
    const { password: _password, ...safe } = user;
    return safe;
}
