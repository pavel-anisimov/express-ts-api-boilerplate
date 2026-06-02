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

import type { AuthRepositoryUser } from "./auth/AuthRepository";
import type { EditableUserProfilePatch, UserProfileDto, UserSafe } from "./users/UsersRepository";

import { repositories } from ".";

export type { EditableUserProfilePatch, UserProfileDto, UserSafe } from "./users/UsersRepository";

/**
 * Compatibility facade for older service imports.
 *
 * New code should prefer domain repositories from `src/repositories`, but this
 * facade remains while AuthService/UserService still share some legacy helper
 * names. It also owns the current mock-vs-remote switch for Python auth API
 * integration.
 */

/**
 * Returns safe users for `/api/users`.
 */
export async function getAllUsers(): Promise<UserSafe[]> {
    return env.MOCK_DATA_ENABLED ? repositories.users.listUsers() : remoteGetAllUsers();
}

/**
 * Finds an auth user by email for login credential checks.
 */
export async function findByEmail(email: string): Promise<AuthRepositoryUser | null> {
    return env.MOCK_DATA_ENABLED ? repositories.auth.findAuthUserByEmail(email) : remoteFindByEmail(email);
}

/**
 * Returns a safe user row by id.
 */
export async function getById(id: string): Promise<UserSafe | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getUserById(id) : remoteGetById(id);
}

/**
 * Returns the full frontend profile by id.
 */
export async function getProfileById(id: string): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getUserProfileById(id) : remoteGetProfileById(id);
}

/**
 * Returns the full frontend profile by email.
 *
 * This supports token identities that contain email but not a stable user id.
 */
export async function getProfileByEmail(email: string): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getUserProfileByEmail(email) : remoteGetProfileByEmail(email);
}

/**
 * Returns admin-only detail metadata for management views.
 *
 * The remote Python client does not expose this endpoint yet, so non-mock mode
 * intentionally returns `null` until the downstream API exists.
 */
export async function getAdminDetailsById(id: string): Promise<Record<string, unknown> | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getAdminDetailsById(id) : null;
}

/**
 * Updates editable profile fields for the authenticated requester.
 */
export async function updateOwnProfile(
    requester: { id?: string; sub?: string; email?: string },
    patch: EditableUserProfilePatch,
): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.updateOwnProfile(requester, patch) : remoteUpdateOwnProfile(requester, patch);
}

/**
 * Soft-deletes or restores a user.
 */
export async function updateUserDeleted(id: string, deleted: boolean): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.updateUserDeleted(id, deleted) : remoteUpdateUserDeleted(id, deleted);
}

/**
 * Suspends or unsuspends a user.
 */
export async function updateUserSuspended(id: string, suspended: boolean): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.updateUserSuspended(id, suspended) : remoteUpdateUserSuspended(id, suspended);
}
