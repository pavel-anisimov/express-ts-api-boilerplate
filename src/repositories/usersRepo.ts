// src/repositories/usersRepo.ts
import { randomUUID } from "node:crypto";
import raw from "../../mock-data/users.json" assert { type: "json" };

export type UserRecord = {
    id: string;
    email: string;
    password: string; // только для auth, наружу не отдаём
    name: string;
    roles: string[];  // массив ролей
    status: "active" | "blocked" | "pending_verification";
    emailVerified: boolean;
};

export type UserSafe = Omit<UserRecord, "password">;

let CACHE: UserRecord[] | null = null;

function normalize(): UserRecord[] {
    if (CACHE) return CACHE;

    const arr = Array.isArray(raw) ? (raw as any[]) : [];

    CACHE = arr.map((user): UserRecord => ({
        id: user.id ? String(user.id) : randomUUID(),
        email: String(user.email ?? ""),
        password: String(user.password ?? ""),        // остаётся в памяти для логина
        name: String(user.name ?? ""),
        roles: Array.isArray(user.roles) ? user.roles.map(String) : [],
        status: (user.status as UserRecord["status"]) ?? "active",
        emailVerified: Boolean(user.emailVerified ?? true),
    }));

    return CACHE;
}

/** Для /api/users — безопасный список без паролей */
export async function getAllUsers(): Promise<UserSafe[]> {
    return normalize().map(({ password, ...safe }) => safe);
}

/** Для /auth/login — поиск с паролем */
export async function findByEmail(email: string): Promise<UserRecord | null> {
    return normalize().find(user => user.email.toLowerCase() === String(email).toLowerCase()) ?? null;
}

/** (опционально) получить безопасного пользователя по id */
export async function getById(id: string): Promise<UserSafe | null> {
    const u = normalize().find(u => u.id === id);
    if (!u) return null;
    const { password, ...safe } = u;
    return safe;
}
