import { randomUUID } from "node:crypto";

import type { Role } from "../types/models";
import { loadMockItems, loadMockRecords } from "../utils/mockDataLoader";

type MockUserStatus = "active" | "blocked" | "pending" | "pending_verification" | "suspended" | "deleted";

export type AuthMockUser = {
    id: string;
    email: string;
    passwordHash: string;
    name?: string;
    roles: string[];
    status: string;
    deleted: boolean;
    emailVerified: boolean;
};

export type AuthMockSession = {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    user?: Record<string, unknown>;
};

type RawAuthUser = {
    id?: unknown;
    email?: unknown;
    passwordHash?: unknown;
    name?: unknown;
    display_name?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    roles?: unknown;
    status?: unknown;
    deleted?: unknown;
    emailVerified?: unknown;
    email_verified?: unknown;
};

function isRole(role: unknown): role is Role {
    return role === "user" || role === "admin" || role === "manager";
}

function isUserStatus(status: unknown): status is MockUserStatus {
    return (
        status === "active" ||
        status === "blocked" ||
        status === "pending" ||
        status === "pending_verification" ||
        status === "suspended" ||
        status === "deleted"
    );
}

function toAuthUser(user: Record<string, unknown>): AuthMockUser {
    const rawUser = user as RawAuthUser;
    const id =
        typeof rawUser.id === "string"
            ? rawUser.id
            : typeof rawUser.email === "string"
                ? rawUser.email
                : randomUUID();

    const roles = Array.isArray(rawUser.roles)
        ? (rawUser.roles as unknown[]).filter(isRole)
        : [];

    const status: AuthMockUser["status"] = isUserStatus(rawUser.status) ? rawUser.status : "active";
    const deleted = typeof rawUser.deleted === "boolean" ? rawUser.deleted : status === "deleted";
    const emailVerified =
        typeof rawUser.emailVerified === "boolean"
            ? rawUser.emailVerified
            : rawUser.email_verified === true;
    const name =
        typeof rawUser.name === "string"
            ? rawUser.name
            : typeof rawUser.display_name === "string"
                ? rawUser.display_name
                : [rawUser.first_name, rawUser.last_name].filter((value): value is string => typeof value === "string").join(" ");

    return {
        id,
        email: typeof rawUser.email === "string" ? rawUser.email : "",
        passwordHash: typeof rawUser.passwordHash === "string" ? rawUser.passwordHash : "",
        name,
        roles,
        status,
        deleted,
        emailVerified,
    };
}

function toSession(value: Record<string, unknown>): AuthMockSession | null {
    if (typeof value.access_token !== "string") {
        return null;
    }

    const session: AuthMockSession = {
        access_token: value.access_token,
    };

    if (typeof value.token_type === "string") {
        session.token_type = value.token_type;
    }

    if (typeof value.expires_in === "number") {
        session.expires_in = value.expires_in;
    }

    if (value.user && typeof value.user === "object" && !Array.isArray(value.user)) {
        session.user = value.user as Record<string, unknown>;
    }

    return session;
}

export class AuthMockRepository {
    private readonly authRows = loadMockRecords("auth/auth-users.json");
    private readonly meRows = loadMockRecords("auth/auth-me.json");
    private readonly sessionRows = loadMockItems<Record<string, unknown>>("auth/auth-sessions.json");

    getMe(identity: { id?: string; sub?: string; email?: string; accessToken?: string }): Record<string, unknown> | null {
        if (identity.accessToken) {
            return this.getSession(identity.accessToken)?.user ?? null;
        }

        const id = identity.id ?? identity.sub;
        if (id) {
            return this.meRows.find((user) => user.id === id) ?? null;
        }

        if (identity.email) {
            return this.meRows.find((user) => typeof user.email === "string" && user.email.toLowerCase() === identity.email?.toLowerCase()) ?? null;
        }

        return null;
    }

    getSession(accessToken: string): AuthMockSession | null {
        const row = this.sessionRows.find((session) => session.access_token === accessToken);
        return row ? toSession(row) : null;
    }

    findAuthUserByEmail(email: string): AuthMockUser | null {
        const row = this.authRows.find((user) => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase());
        return row ? toAuthUser(row) : null;
    }

    findAuthUserById(id: string): AuthMockUser | null {
        const row = this.authRows.find((user) => user.id === id);
        return row ? toAuthUser(row) : null;
    }

    updateAuthUserState(identity: { id?: string; email?: string }, patch: { deleted?: boolean; status?: string }): void {
        const row =
            (identity.id ? this.authRows.find((user) => user.id === identity.id) : null) ??
            (identity.email ? this.authRows.find((user) => typeof user.email === "string" && user.email.toLowerCase() === identity.email?.toLowerCase()) : null);

        if (!row) {
            return;
        }

        if (patch.deleted !== undefined) {
            row.deleted = patch.deleted;
        }

        if (patch.status !== undefined) {
            row.status = patch.status;
        }
    }
}

export const authMockRepository = new AuthMockRepository();
