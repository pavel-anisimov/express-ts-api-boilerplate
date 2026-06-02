import { services } from "../config/services";
import type { EditableUserProfilePatch, UserProfileDto, UserSafe } from "../repositories/usersRepo";

type RequestOptions = {
    method?: string;
    body?: unknown;
    token?: string;
};

export type RemoteAuthUser = UserSafe & {
    passwordHash: "";
    emailVerified: boolean;
};

export type RemoteLoginResponse = {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: UserSafe;
};

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

function normalizeRemoteAuthUser(user: UserSafe): RemoteAuthUser {
    return {
        ...user,
        passwordHash: "",
        emailVerified: user.emailVerified ?? user.email_verified === true,
    };
}

export async function remoteLogin(email: string, password: string): Promise<RemoteLoginResponse> {
    return requestJson<RemoteLoginResponse>(services.auth, "/auth/login", {
        method: "POST",
        body: { email, password },
    });
}

export async function remoteRefresh(refreshToken: string): Promise<unknown> {
    return requestJson<unknown>(services.auth, "/auth/refresh", {
        method: "POST",
        body: { refreshToken },
    });
}

export async function remoteGetMe(token: string): Promise<UserSafe> {
    return requestJson<UserSafe>(services.auth, "/auth/me", { token });
}

export async function remoteGetAllUsers(): Promise<UserSafe[]> {
    return asItems<UserSafe>(await requestJson<unknown>(services.users, "/users"));
}

export async function remoteFindByEmail(email: string): Promise<RemoteAuthUser | null> {
    const users = await remoteGetAllUsers();
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    return user ? normalizeRemoteAuthUser(user) : null;
}

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

export async function remoteGetProfileByEmail(email: string): Promise<UserProfileDto | null> {
    const users = await remoteGetAllUsers();
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    return user ? remoteGetProfileById(user.id) : null;
}

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

export async function remoteUpdateUserDeleted(id: string, deleted: boolean): Promise<UserProfileDto | null> {
    return requestJson<UserProfileDto>(services.users, `/users/${encodeURIComponent(id)}/deleted`, {
        method: "PATCH",
        body: { deleted },
    });
}

export async function remoteUpdateUserSuspended(id: string, suspended: boolean): Promise<UserProfileDto | null> {
    return requestJson<UserProfileDto>(services.users, `/users/${encodeURIComponent(id)}/suspended`, {
        method: "PATCH",
        body: { suspended },
    });
}
