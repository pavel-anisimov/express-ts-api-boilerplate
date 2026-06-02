/**
 * Gateway role names used by RBAC and mock auth data.
 */
export type Role = 'user' | 'admin' | 'manager';

/**
 * User lifecycle states accepted by the gateway.
 */
export type UserStatus = 'active' | 'blocked' | 'pending' | 'pending_verification' | 'suspended' | 'deleted';

/**
 * Auth-side user shape used for credential checks and token claims.
 *
 * This type includes `passwordHash` and must not be returned directly from
 * controllers.
 */
export type AuthUser = {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    roles: Role[];
    status: UserStatus;
    deleted: boolean;
    emailVerified: boolean;
};

/**
 * Auth user with local creation metadata.
 */
export type User = AuthUser & {
    createdAt: string;
};

/**
 * Public-safe auth user shape with password data removed.
 */
export type UserSafe = Omit<AuthUser, "passwordHash">;

/**
 * Security metadata shown in full profile/admin views.
 */
export type UserSecurity = {
    two_factor_enabled: boolean;
    failed_login_count: number;
    last_failed_login_at: string | null;
    password_updated_at: string | null;
    locked_until: string | null;
};

/**
 * Editable and display profile details nested inside a full user profile.
 */
export type UserProfileDetails = {
    gender: string | null;
    date_of_birth: string | null;
    location: {
        city: string | null;
        state: string | null;
        country: string | null;
        zip: string | null;
    };
    language: string | null;
    timezone: string | null;
    avatar_url: string | null;
    bio: string | null;
    social: Record<string, unknown>;
    phone_number: string | null;
    phone_verified: boolean;
};

/**
 * Frontend-facing user preferences.
 */
export type UserPreferences = {
    theme: string;
    notifications: {
        email: boolean;
        sms: boolean;
        marketing: boolean;
    };
    privacy: {
        email: string;
    };
};

/**
 * Operational metadata associated with a user profile.
 */
export type UserMetadata = {
    signup_ip: string | null;
    last_login_ip: string | null;
    login_count: number;
    user_agent: string | null;
};

/**
 * Full frontend-facing profile shape.
 *
 * Field names intentionally follow the Python auth API/mock payload style, so
 * many properties are snake_case. Repository adapters normalize mock data into
 * this contract before services return it.
 */
export type UserProfile = {
    id: string;
    email: string;
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    status: string;
    deleted: boolean;
    deleted_at: string | null;
    status_changed_at: string | null;
    status_changed_by: string | null;
    email_verified: boolean;
    email_verified_at: string | null;
    roles: string[];
    tenant_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    last_login_at: string | null;
    security: UserSecurity;
    profile: UserProfileDetails;
    preferences: UserPreferences;
    metadata: UserMetadata;
    external_ids: Record<string, unknown>;
    auth_provider: string;
    terms_version: string | null;
    terms_accepted_at: string | null;
    privacy_accepted_at: string | null;
    feature_gates: unknown[];
};
