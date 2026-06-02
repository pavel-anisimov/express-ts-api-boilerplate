// src/repositories/usersRepo.ts
import {
    remoteFindByEmail,
    remoteGetAllUsers,
    remoteGetById,
    remoteGetProfileByEmail,
    remoteGetProfileById,
    remoteUpdateOwnProfile,
    remoteUpdateUserDeleted,
    remoteUpdateUserSuspended,
} from "../clients/pythonAuthClient";
import { env } from "../config/env";
import type { UserProfile } from "../types/models";

import { authMockRepository, type AuthMockUser } from "./authMockRepository";
import { usersMockRepository } from "./usersMockRepository";

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

/** For /api/users - a safe list without passwords */
export async function getAllUsers(): Promise<UserSafe[]> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.listUsers() : remoteGetAllUsers();
}

/** For /api/auth/login - search with password hash */
export async function findByEmail(email: string): Promise<AuthMockUser | null> {
    return env.MOCK_DATA_ENABLED ? authMockRepository.findAuthUserByEmail(email) : remoteFindByEmail(email);
}

/** (optional) get safe user by id */
export async function getById(id: string): Promise<UserSafe | null> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.getUserById(id) : remoteGetById(id);
}

/** Full profile for frontend profile pages */
export async function getProfileById(id: string): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.getUserProfileById(id) : remoteGetProfileById(id);
}

/** Full profile lookup for resolving requester identity from token email */
export async function getProfileByEmail(email: string): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.getUserProfileByEmail(email) : remoteGetProfileByEmail(email);
}

/** Update editable profile fields for the authenticated requester in the mock profile store */
export async function updateOwnProfile(
    requester: { id?: string; sub?: string; email?: string },
    patch: EditableUserProfilePatch,
): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.updateOwnProfile(requester, patch) : remoteUpdateOwnProfile(requester, patch);
}

/** Soft-delete or restore a mock user profile and matching auth record */
export async function updateUserDeleted(id: string, deleted: boolean): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.updateUserDeleted(id, deleted) : remoteUpdateUserDeleted(id, deleted);
}

/** Suspend or unsuspend a mock user profile and matching auth record */
export async function updateUserSuspended(id: string, suspended: boolean): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? usersMockRepository.updateUserSuspended(id, suspended) : remoteUpdateUserSuspended(id, suspended);
}
