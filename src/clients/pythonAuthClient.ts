import { services } from "../config/services";
import type { EditableUserProfilePatch, UserProfileDto, UserSafe } from "../repositories/usersRepo";

type RequestOptions = {
    method?: string;
    body?: unknown;
    token?: string;
};

/**
 * Auth user shape synthesized from remote users data.
 *
 * The gateway login flow still expects passwordHash/emailVerified fields from
 * the auth repository contract. Remote user list responses must not expose a
 * real password hash, so this client fills it with an empty string.
 */
export type RemoteAuthUser = UserSafe & {
    passwordHash: "";
    emailVerified: boolean;
};

/**
 * Login response accepted from the downstream auth API.
 *
 * Both camelCase and snake_case token fields are supported while the Python
 * API contract is still settling.
 */
export type RemoteLoginResponse = {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: UserSafe;
};

/**
 * Error wrapper for non-2xx Python API responses.
 *
 * Keeping the original response body lets services preserve meaningful
 * downstream error messages without using `any`.
 */
export class PythonAuthApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly body: unknown,
    ) {
        super(message);
    }
}

function url(baseUrl: string, path: string): string {
    return new URL(path, baseUrl).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function bearer(token: string | undefined): Record<string, string> {
    return token ? { authorization: `Bearer ${token}` } : {};
}

/**
 * Fetch JSON from a configured downstream service.
 *
 * This is intentionally small and local to the current Python auth/users API
 * integration. It should move behind repository implementations once HTTP
 * repositories are introduced.
 */
async function requestJson<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
    const init: RequestInit = {
        method: options.method ?? "GET",
        headers: {
            "content-type": "application/json",
            ...bearer(options.token),
        },
    };

    if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
    }

    const response = await fetch(url(baseUrl, path), init);

    const text = await response.text();
    const body = text ? JSON.parse(text) as unknown : null;

    if (!response.ok) {
        const message = isRecord(body) && typeof body.error === "string" ? body.error : `Python auth API returned ${response.status}`;
        throw new PythonAuthApiError(response.status, message, body);
    }

    return body as T;
}

/**
 * Normalize common collection response envelopes into a plain items array.
 *
 * Supports direct arrays, `{ items }`, `{ data: { items } }`, and `{ data }`
 * because backend response envelopes are not finalized yet.
 */
function asItems<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    if (isRecord(value) && Array.isArray(value.items)) {
        return value.items as T[];
    }

    if (isRecord(value) && isRecord(value.data) && Array.isArray(value.data.items)) {
        return value.data.items as T[];
    }

    if (isRecord(value) && Array.isArray(value.data)) {
        return value.data as T[];
    }

    return [];
}

/**
 * Adapt a safe remote user row to the auth lookup shape expected by the
 * gateway's current login compatibility facade.
 */
function normalizeRemoteAuthUser(user: UserSafe): RemoteAuthUser {
    return {
        ...user,
        passwordHash: "",
        emailVerified: user.emailVerified ?? user.email_verified === true,
    };
}

/**
 * Proxy login to the downstream auth API.
 */
export async function remoteLogin(email: string, password: string): Promise<RemoteLoginResponse> {
    return requestJson<RemoteLoginResponse>(services.auth, "/auth/login", {
        method: "POST",
        body: { email, password },
    });
}

/**
 * Proxy refresh-token exchange to the downstream auth API.
 */
export async function remoteRefresh(refreshToken: string): Promise<unknown> {
    return requestJson<unknown>(services.auth, "/auth/refresh", {
        method: "POST",
        body: { refreshToken },
    });
}

/**
 * Fetch the current user from the downstream auth API.
 */
export async function remoteGetMe(token: string): Promise<UserSafe> {
    return requestJson<UserSafe>(services.auth, "/auth/me", { token });
}

/**
 * Fetch all users from the downstream users API and normalize response envelope.
 */
export async function remoteGetAllUsers(): Promise<UserSafe[]> {
    return asItems<UserSafe>(await requestJson<unknown>(services.users, "/users"));
}

/**
 * Compatibility lookup used by the current gateway login facade.
 */
export async function remoteFindByEmail(email: string): Promise<RemoteAuthUser | null> {
    const users = await remoteGetAllUsers();
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    return user ? normalizeRemoteAuthUser(user) : null;
}

/**
 * Fetch a safe user by id, mapping downstream 404 to null.
 */
export async function remoteGetById(id: string): Promise<UserSafe | null> {
    try {
        return await requestJson<UserSafe>(services.users, `/users/${encodeURIComponent(id)}`);
    } catch (error) {
        if (error instanceof PythonAuthApiError && error.status === 404) {
            return null;
        }

        throw error;
    }
}

/**
 * Fetch a full user profile by id, mapping downstream 404 to null.
 */
export async function remoteGetProfileById(id: string): Promise<UserProfileDto | null> {
    try {
        return await requestJson<UserProfileDto>(services.users, `/users/${encodeURIComponent(id)}/profile`);
    } catch (error) {
        if (error instanceof PythonAuthApiError && error.status === 404) {
            return null;
        }

        throw error;
    }
}

/**
 * Resolve a profile by email through the users list, then fetch by id.
 */
export async function remoteGetProfileByEmail(email: string): Promise<UserProfileDto | null> {
    const users = await remoteGetAllUsers();
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    return user ? remoteGetProfileById(user.id) : null;
}

/**
 * Update the authenticated requester's own profile in the downstream users API.
 */
export async function remoteUpdateOwnProfile(
    requester: { id?: string; sub?: string },
    patch: EditableUserProfilePatch,
): Promise<UserProfileDto | null> {
    const id = requester.id ?? requester.sub;
    if (!id) {
        return null;
    }

    return requestJson<UserProfileDto>(services.users, `/users/${encodeURIComponent(id)}/profile`, {
        method: "PATCH",
        body: patch,
    });
}

/**
 * Soft-delete or restore a user through the downstream users API.
 */
export async function remoteUpdateUserDeleted(id: string, deleted: boolean): Promise<UserProfileDto | null> {
    return requestJson<UserProfileDto>(services.users, `/users/${encodeURIComponent(id)}/deleted`, {
        method: "PATCH",
        body: { deleted },
    });
}

/**
 * Suspend or unsuspend a user through the downstream users API.
 */
export async function remoteUpdateUserSuspended(id: string, suspended: boolean): Promise<UserProfileDto | null> {
    return requestJson<UserProfileDto>(services.users, `/users/${encodeURIComponent(id)}/suspended`, {
        method: "PATCH",
        body: { suspended },
    });
}
