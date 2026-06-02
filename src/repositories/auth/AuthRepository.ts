export type AuthRepositoryIdentity = {
    id?: string;
    sub?: string;
    email?: string;
    accessToken?: string;
};

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

export type AuthRepositorySession = {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    user?: Record<string, unknown>;
};

export type AuthUserStatePatch = {
    deleted?: boolean;
    status?: string;
};

export interface AuthRepository {
    getMe(identity: AuthRepositoryIdentity): Record<string, unknown> | null;
    getSession(accessToken: string): AuthRepositorySession | null;
    findAuthUserByEmail(email: string): AuthRepositoryUser | null;
    findAuthUserById(id: string): AuthRepositoryUser | null;
    updateAuthUserState(identity: Pick<AuthRepositoryIdentity, "id" | "email">, patch: AuthUserStatePatch): void;
}
