import type { UserProfile } from "../../types/models";

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

export type UserProfileDto = Omit<UserProfile, "status" | "deleted" | "deleted_at"> & {
    status: string;
    deleted: boolean;
    deleted_at: string | null;
};

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

export type UsersRepositoryRequester = {
    id?: string;
    sub?: string;
    email?: string;
};

export interface UsersRepository {
    listUsers(): UserSafe[];
    getUserById(id: string): UserSafe | null;
    getUserProfileById(id: string): UserProfileDto | null;
    getUserProfileByEmail(email: string): UserProfileDto | null;
    getAdminDetailsById(id: string): Record<string, unknown> | null;
    updateOwnProfile(requester: UsersRepositoryRequester, patch: EditableUserProfilePatch): UserProfileDto | null;
    updateUserDeleted(id: string, deleted: boolean): UserProfileDto | null;
    updateUserSuspended(id: string, suspended: boolean): UserProfileDto | null;
}
