/**
 * Identity data the gateway can derive from a request token or session lookup.
 *
 * Repositories accept all fields because different auth paths provide
 * different identifiers: JWT claims usually provide `sub`, normalized request
 * identity provides `id`, and remote/mock session lookup may provide a token.
 */
export type AuthRepositoryIdentity = {
    id?: string;
    sub?: string;
    email?: string;
    accessToken?: string;
};

/**
 * Internal auth user shape used for credential checks.
 *
 * This can include passwordHash because it is never returned directly to the
 * frontend. Service/controller layers must sanitize auth users before
 * responding.
 */
export type AuthRepositoryUser = {
    id: string;
    email: string;
    passwordHash: string;
    name?: string;
    roles: string[];
    status: string;
    deleted: boolean;
    emailVerified: boolean;
};

/**
 * Session response shape used by auth session lookup behavior.
 *
 * Field names intentionally mirror Python auth API responses.
 */
export type AuthRepositorySession = {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    user?: Record<string, unknown>;
};

/**
 * Minimal auth state patch used when users repository mutates related status.
 */
export type AuthUserStatePatch = {
    deleted?: boolean;
    status?: string;
};

/**
 * Auth repository contract.
 *
 * Implementations may read from mock data or downstream auth services, but
 * they must preserve these gateway-facing DTO shapes. The gateway service
 * layer relies on this contract rather than concrete mock storage.
 */
export interface AuthRepository {
    /** Resolve the current user/session payload from token identity data. */
    getMe(identity: AuthRepositoryIdentity): Record<string, unknown> | null;

    /** Find a mock/API session by access token. */
    getSession(accessToken: string): AuthRepositorySession | null;

    /** Find an auth user by email for login credential checks. */
    findAuthUserByEmail(email: string): AuthRepositoryUser | null;

    /** Find an auth user by id for token/session related behavior. */
    findAuthUserById(id: string): AuthRepositoryUser | null;

    /** Update auth-side state when user status changes in the users repository. */
    updateAuthUserState(identity: Pick<AuthRepositoryIdentity, "id" | "email">, patch: AuthUserStatePatch): void;
}
