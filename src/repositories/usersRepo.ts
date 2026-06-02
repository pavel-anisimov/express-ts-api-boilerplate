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

import type { AuthRepositoryUser } from "./auth/AuthRepository";
import type { EditableUserProfilePatch, UserProfileDto, UserSafe } from "./users/UsersRepository";

import { repositories } from ".";

export type { EditableUserProfilePatch, UserProfileDto, UserSafe } from "./users/UsersRepository";

/** For /api/users - a safe list without passwords */
export async function getAllUsers(): Promise<UserSafe[]> {
    return env.MOCK_DATA_ENABLED ? repositories.users.listUsers() : remoteGetAllUsers();
}

/** For /api/auth/login - search with password hash */
export async function findByEmail(email: string): Promise<AuthRepositoryUser | null> {
    return env.MOCK_DATA_ENABLED ? repositories.auth.findAuthUserByEmail(email) : remoteFindByEmail(email);
}

/** (optional) get safe user by id */
export async function getById(id: string): Promise<UserSafe | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getUserById(id) : remoteGetById(id);
}

/** Full profile for frontend profile pages */
export async function getProfileById(id: string): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getUserProfileById(id) : remoteGetProfileById(id);
}

/** Full profile lookup for resolving requester identity from token email */
export async function getProfileByEmail(email: string): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getUserProfileByEmail(email) : remoteGetProfileByEmail(email);
}

/** Admin-only detail metadata for frontend management views */
export async function getAdminDetailsById(id: string): Promise<Record<string, unknown> | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.getAdminDetailsById(id) : null;
}

/** Update editable profile fields for the authenticated requester in the mock profile store */
export async function updateOwnProfile(
    requester: { id?: string; sub?: string; email?: string },
    patch: EditableUserProfilePatch,
): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.updateOwnProfile(requester, patch) : remoteUpdateOwnProfile(requester, patch);
}

/** Soft-delete or restore a mock user profile and matching auth record */
export async function updateUserDeleted(id: string, deleted: boolean): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.updateUserDeleted(id, deleted) : remoteUpdateUserDeleted(id, deleted);
}

/** Suspend or unsuspend a mock user profile and matching auth record */
export async function updateUserSuspended(id: string, suspended: boolean): Promise<UserProfileDto | null> {
    return env.MOCK_DATA_ENABLED ? repositories.users.updateUserSuspended(id, suspended) : remoteUpdateUserSuspended(id, suspended);
}
