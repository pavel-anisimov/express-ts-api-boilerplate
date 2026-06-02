import type { UserProfile } from "../../types/models";

/**
 * Safe user row for list/search responses.
 *
 * This shape intentionally excludes password hashes, security internals, and
 * full profile metadata.
 */
export type UserSafe = {
    id: string;
    email: string;
    name?: string;
    username?: string | null;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    roles: string[];
    status: string;
    deleted: boolean;
    emailVerified?: boolean;
    email_verified?: boolean;
    tenant_id?: string | null;
    created_at?: string | null;
    last_login_at?: string | null;
};

/**
 * Full profile DTO used by frontend profile/detail screens.
 *
 * It is derived from `UserProfile` but normalizes soft-delete fields so the
 * frontend receives stable `status`, `deleted`, and `deleted_at` values.
 */
export type UserProfileDto = Omit<UserProfile, "status" | "deleted" | "deleted_at"> & {
    status: string;
    deleted: boolean;
    deleted_at: string | null;
};

/**
 * Editable profile patch accepted by the gateway for authenticated users.
 *
 * This type mirrors the validated request body for `PATCH /api/auth/me/profile`.
 * Only these fields should be applied to profile mock data.
 */
export type EditableUserProfilePatch = {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profile?: {
        gender?: string | null;
        date_of_birth?: string | null;
        bio?: string | null;
        language?: string | null;
        timezone?: string | null;
        avatar_url?: string | null;
        phone_number?: string | null;
        location?: {
            city?: string | null;
            state?: string | null;
            country?: string | null;
            zip?: string | null;
        };
        social?: Record<string, unknown>;
    };
    preferences?: {
        theme?: string;
        notifications?: {
            email?: boolean;
            sms?: boolean;
            marketing?: boolean;
        };
        privacy?: {
            email?: string;
        };
    };
};

/**
 * Requester identity used when resolving the authenticated user's profile.
 *
 * The gateway supports multiple identity sources during auth migration, so
 * repositories can resolve ownership by `id`, JWT `sub`, or `email`.
 */
export type UsersRepositoryRequester = {
    id?: string;
    sub?: string;
    email?: string;
};

/**
 * Users repository contract.
 *
 * Implementations should preserve frontend-facing response shapes while hiding
 * storage details such as mock file layout or future downstream HTTP clients.
 */
export interface UsersRepository {
    /** Return safe users for list/search endpoints. */
    listUsers(): UserSafe[];

    /** Return a safe user by id. */
    getUserById(id: string): UserSafe | null;

    /** Return a full profile by id. */
    getUserProfileById(id: string): UserProfileDto | null;

    /** Return a full profile by email. */
    getUserProfileByEmail(email: string): UserProfileDto | null;

    /** Return admin-only details for management views. */
    getAdminDetailsById(id: string): Record<string, unknown> | null;

    /** Update editable fields on the authenticated user's own profile. */
    updateOwnProfile(requester: UsersRepositoryRequester, patch: EditableUserProfilePatch): UserProfileDto | null;

    /** Soft-delete or restore a user profile. */
    updateUserDeleted(id: string, deleted: boolean): UserProfileDto | null;

    /** Suspend or unsuspend a user profile. */
    updateUserSuspended(id: string, suspended: boolean): UserProfileDto | null;
}
