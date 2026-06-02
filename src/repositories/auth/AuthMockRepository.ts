import { randomUUID } from "node:crypto";

import type { Role } from "../../types/models";
import { loadMockItems, loadMockRecords } from "../../utils/mockDataLoader";

import type {
    AuthRepository,
    AuthRepositoryIdentity,
    AuthRepositorySession,
    AuthRepositoryUser,
    AuthUserStatePatch,
} from "./AuthRepository";

type MockUserStatus = "active" | "blocked" | "pending" | "pending_verification" | "suspended" | "deleted";

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

/**
 * Narrows raw role values from mock data to gateway roles.
 */
function isRole(role: unknown): role is Role {
    return role === "user" || role === "admin" || role === "manager";
}

/**
 * Narrows raw status values accepted by auth mock records.
 */
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

/**
 * Normalizes raw mock auth rows into the internal auth user contract.
 *
 * Mock data intentionally keeps some Python-style field names, so this adapter
 * accepts both camelCase and snake_case fields without leaking that detail to
 * services. Missing ids fall back to email or a generated value so invalid mock
 * rows do not crash the gateway during local development.
 */
function toAuthUser(user: Record<string, unknown>): AuthRepositoryUser {
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

    const status: AuthRepositoryUser["status"] = isUserStatus(rawUser.status) ? rawUser.status : "active";
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

/**
 * Converts a raw mock session row to the repository session contract.
 *
 * Rows without `access_token` are ignored because they cannot be addressed by
 * the auth middleware/session lookup flow.
 */
function toSession(value: Record<string, unknown>): AuthRepositorySession | null {
    if (typeof value.access_token !== "string") {
        return null;
    }

    const session: AuthRepositorySession = {
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

/**
 * Mock auth repository backed by files under `mock-data/auth`.
 *
 * It models the current Python auth API behavior closely enough for gateway
 * controllers and services to run without downstream services. The repository
 * keeps rows in memory for the lifetime of the process, which lets tests and
 * local smoke checks observe status updates made through users repository
 * methods.
 */
export class AuthMockRepository implements AuthRepository {
    private readonly authRows = loadMockRecords("auth/auth-users.json");
    private readonly meRows = loadMockRecords("auth/auth-me.json");
    private readonly sessionRows = loadMockItems<Record<string, unknown>>("auth/auth-sessions.json");

    /**
     * Resolves the current user payload from access token, id/sub, or email.
     *
     * Token lookup wins because it most closely mirrors `/auth/me` behavior in
     * remote mode. Id/sub and email fallback support locally generated JWTs.
     */
    getMe(identity: AuthRepositoryIdentity): Record<string, unknown> | null {
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

    /**
     * Looks up a mock session by access token.
     */
    getSession(accessToken: string): AuthRepositorySession | null {
        const row = this.sessionRows.find((session) => session.access_token === accessToken);
        return row ? toSession(row) : null;
    }

    /**
     * Finds a credential-bearing auth user by email for login.
     */
    findAuthUserByEmail(email: string): AuthRepositoryUser | null {
        const row = this.authRows.find((user) => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase());
        return row ? toAuthUser(row) : null;
    }

    /**
     * Finds a credential-bearing auth user by id.
     */
    findAuthUserById(id: string): AuthRepositoryUser | null {
        const row = this.authRows.find((user) => user.id === id);
        return row ? toAuthUser(row) : null;
    }

    /**
     * Applies user status changes to the matching auth row.
     *
     * Users mock state and auth mock state are stored in separate files, but
     * gateway behavior expects status/deleted flags to stay aligned after
     * profile management endpoints mutate user state.
     */
    updateAuthUserState(identity: Pick<AuthRepositoryIdentity, "id" | "email">, patch: AuthUserStatePatch): void {
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
