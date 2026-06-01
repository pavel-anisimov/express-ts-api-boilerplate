// src/repositories/usersRepo.ts
import { randomUUID } from "node:crypto";

import type { AuthUser, Role, UserProfile } from "../types/models";
import { loadMockItems } from "../utils/mockDataLoader";

type MockUserStatus = "active" | "blocked" | "pending" | "pending_verification" | "suspended" | "deleted";
type MockAuthUser = Omit<AuthUser, "status" | "deleted"> & {
    status: MockUserStatus;
    deleted: boolean;
};
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
type MockUserProfile = Omit<UserProfile, "status" | "deleted" | "deleted_at"> & {
    status: string;
    deleted: boolean;
    deleted_at: string | null;
};
export type UserProfileDto = MockUserProfile;

const authRows = loadMockRecords("auth/auth-users.json");
const userListRows = loadMockRecords("auth/user-list-items.json");
const profileRows = loadMockRecords("auth/user-profiles.json");

function loadMockRecords(relativeFilePath: string): Record<string, unknown>[] {
    return loadMockItems<Record<string, unknown>>(relativeFilePath).filter((user): user is Record<string, unknown> => {
        if (!user || typeof user !== "object" || Array.isArray(user)) {
            return false;
        }

        const candidate = user as Record<string, unknown>;
        return typeof candidate.id === "string" && typeof candidate.email === "string";
    });
}

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

type RawUser = {
  id?: unknown;
  email?: unknown;
  passwordHash?: unknown;
  name?: unknown;
  display_name?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  roles?: unknown;
  status?: unknown;
  deleted?: unknown;
  deleted_at?: unknown;
  emailVerified?: unknown;   // camelCase
  email_verified?: unknown;  // snake_case (in case of another format)
};

function isRole(role: unknown): role is Role {
    return role === "user" || role === "admin" || role === "manager";
}

function isUserStatus(status: unknown): status is MockUserStatus {
    return (
        status === "active" ||
        status === "blocked" ||
        status === "pending" ||
        status === "pending_verification" ||
        status === "suspended" ||
        status === "deleted"
    );
}

function toRecord(user: unknown): MockAuthUser {
    const rawUser = user as RawUser;
    const id =
        typeof rawUser.id === "string"
            ? rawUser.id
            : typeof rawUser.email === "string"
                ? rawUser.email
                : randomUUID();

    const roles = Array.isArray(rawUser.roles)
        ? (rawUser.roles as unknown[]).filter(isRole)
        : [];

    const status: MockAuthUser["status"] = isUserStatus(rawUser.status) ? rawUser.status : "active";
    const deleted = typeof rawUser.deleted === "boolean" ? rawUser.deleted : status === "deleted";

    const emailVerified =
        typeof rawUser.emailVerified === "boolean"
            ? rawUser.emailVerified
            : rawUser.email_verified === true;
    const name =
        typeof rawUser.name === "string"
            ? rawUser.name
            : typeof rawUser.display_name === "string"
                ? rawUser.display_name
                : [rawUser.first_name, rawUser.last_name].filter((value): value is string => typeof value === "string").join(" ");

    return {
        id,
        email: typeof rawUser.email === "string" ? rawUser.email : "",
        passwordHash: typeof rawUser.passwordHash === "string" ? rawUser.passwordHash : "",
        name,
        roles,
        status,
        deleted,
        emailVerified,
    };
}

function normalizeAuthUsers(): MockAuthUser[] {
    return authRows.map(toRecord);
}

function normalizeProfileUsers(): MockAuthUser[] {
    return profileRows.map(toRecord);
}

function normalizeListUser(user: Record<string, unknown>): UserSafe {
    const { passwordHash: _passwordHash, security: _security, metadata: _metadata, ...safe } = user;
    const status = stringOrDefault(safe.status, "active");

    return {
        ...safe,
        id: stringOrDefault(safe.id, ""),
        email: stringOrDefault(safe.email, ""),
        name: stringOrDefault(safe.name, stringOrDefault(safe.display_name, "")),
        roles: stringArrayOrDefault(safe.roles),
        status,
        deleted: booleanOrDefault(safe.deleted, status === "deleted"),
        emailVerified: booleanOrDefault(safe.emailVerified, safe.email_verified === true),
        email_verified: booleanOrDefault(safe.email_verified, safe.emailVerified === true),
    };
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringOrNull(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

function stringOrDefault(value: unknown, fallback: string): string {
    return typeof value === "string" ? value : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}

function numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === "number" ? value : fallback;
}

function stringArrayOrDefault(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeFullProfile(user: Record<string, unknown>): MockUserProfile {
    const security = asRecord(user.security);
    const profile = asRecord(user.profile);
    const location = asRecord(profile.location);
    const preferences = asRecord(user.preferences);
    const notifications = asRecord(preferences.notifications);
    const privacy = asRecord(preferences.privacy);
    const metadata = asRecord(user.metadata);
    const externalIds = asRecord(user.external_ids);
    const featureGates = Array.isArray(user.feature_gates) ? user.feature_gates : [];

    return {
        id: stringOrDefault(user.id, ""),
        email: stringOrDefault(user.email, ""),
        username: stringOrNull(user.username),
        display_name: stringOrNull(user.display_name),
        first_name: stringOrNull(user.first_name),
        last_name: stringOrNull(user.last_name),
        status: stringOrDefault(user.status, "active"),
        deleted: booleanOrDefault(user.deleted, user.status === "deleted"),
        deleted_at: stringOrNull(user.deleted_at),
        status_changed_at: stringOrNull(user.status_changed_at),
        status_changed_by: stringOrNull(user.status_changed_by),
        email_verified: booleanOrDefault(user.email_verified, false),
        email_verified_at: stringOrNull(user.email_verified_at),
        roles: stringArrayOrDefault(user.roles),
        tenant_id: stringOrNull(user.tenant_id),
        created_at: stringOrNull(user.created_at),
        updated_at: stringOrNull(user.updated_at),
        last_login_at: stringOrNull(user.last_login_at),
        security: {
            two_factor_enabled: booleanOrDefault(security.two_factor_enabled, false),
            failed_login_count: numberOrDefault(security.failed_login_count, 0),
            last_failed_login_at: stringOrNull(security.last_failed_login_at),
            password_updated_at: stringOrNull(security.password_updated_at),
            locked_until: stringOrNull(security.locked_until),
        },
        profile: {
            gender: stringOrNull(profile.gender),
            date_of_birth: stringOrNull(profile.date_of_birth),
            location: {
                city: stringOrNull(location.city),
                state: stringOrNull(location.state),
                country: stringOrNull(location.country),
                zip: stringOrNull(location.zip),
            },
            language: stringOrNull(profile.language),
            timezone: stringOrNull(profile.timezone),
            avatar_url: stringOrNull(profile.avatar_url),
            bio: stringOrNull(profile.bio),
            social: asRecord(profile.social),
            phone_number: stringOrNull(profile.phone_number),
            phone_verified: booleanOrDefault(profile.phone_verified, false),
        },
        preferences: {
            theme: stringOrDefault(preferences.theme, "system"),
            notifications: {
                email: booleanOrDefault(notifications.email, false),
                sms: booleanOrDefault(notifications.sms, false),
                marketing: booleanOrDefault(notifications.marketing, false),
            },
            privacy: {
                email: stringOrDefault(privacy.email, "private"),
            },
        },
        metadata: {
            signup_ip: stringOrNull(metadata.signup_ip),
            last_login_ip: stringOrNull(metadata.last_login_ip),
            login_count: numberOrDefault(metadata.login_count, 0),
            user_agent: stringOrNull(metadata.user_agent),
        },
        external_ids: externalIds,
        auth_provider: stringOrDefault(user.auth_provider, "password"),
        terms_version: stringOrNull(user.terms_version),
        terms_accepted_at: stringOrNull(user.terms_accepted_at),
        privacy_accepted_at: stringOrNull(user.privacy_accepted_at),
        feature_gates: featureGates,
    };
}

function getProfiles(): UserProfileDto[] {
    return profileRows.map(normalizeFullProfile);
}

function assignDefined(target: Record<string, unknown>, source: Record<string, unknown>, keys: string[]): void {
    for (const key of keys) {
        if (Object.hasOwn(source, key)) {
            target[key] = source[key];
        }
    }
}

function findProfileRowById(id: string): Record<string, unknown> | null {
    return profileRows.find(user => user.id === id) ?? null;
}

function findListRowById(id: string): Record<string, unknown> | null {
    return userListRows.find(user => user.id === id) ?? null;
}

function findAuthRowById(id: string): Record<string, unknown> | null {
    return authRows.find(user => user.id === id) ?? null;
}

function findProfileRowByEmail(email: string): Record<string, unknown> | null {
    return profileRows.find(user => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

function findAuthRowByEmail(email: string): Record<string, unknown> | null {
    return authRows.find(user => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

function findListRowByEmail(email: string): Record<string, unknown> | null {
    return userListRows.find(user => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

function syncRowsForProfile(profile: Record<string, unknown>): Record<string, unknown>[] {
    const id = typeof profile.id === "string" ? profile.id : "";
    const email = typeof profile.email === "string" ? profile.email : "";
    const rows = [
        id ? findAuthRowById(id) : null,
        email ? findAuthRowByEmail(email) : null,
        id ? findListRowById(id) : null,
        email ? findListRowByEmail(email) : null,
    ];

    return rows.filter((row, index): row is Record<string, unknown> => Boolean(row) && rows.indexOf(row) === index);
}

function applyDeletedState(user: Record<string, unknown>, deleted: boolean): void {
    user.deleted = deleted;

    if (Object.hasOwn(user, "deleted_at")) {
        user.deleted_at = null;
    }

    if (deleted) {
        user.status = "deleted";
    } else if (user.status === "deleted") {
        user.status = "active";
    }
}

function applySuspendedState(user: Record<string, unknown>, suspended: boolean): void {
    if (user.deleted === true || user.status === "deleted") {
        return;
    }

    if (suspended) {
        user.status = "suspended";
    } else if (user.status === "suspended") {
        user.status = "active";
    }
}

function applyEditableProfilePatch(profile: Record<string, unknown>, patch: EditableUserProfilePatch): void {
    assignDefined(profile, patch as Record<string, unknown>, ["display_name", "first_name", "last_name"]);

    if (patch.profile) {
        const currentProfile = asRecord(profile.profile);
        profile.profile = currentProfile;

        assignDefined(currentProfile, patch.profile as Record<string, unknown>, [
            "gender",
            "date_of_birth",
            "bio",
            "language",
            "timezone",
            "avatar_url",
            "phone_number",
            "social",
        ]);

        if (patch.profile.location) {
            const currentLocation = asRecord(currentProfile.location);
            currentProfile.location = currentLocation;
            assignDefined(currentLocation, patch.profile.location as Record<string, unknown>, ["city", "state", "country", "zip"]);
        }
    }

    if (patch.preferences) {
        const currentPreferences = asRecord(profile.preferences);
        profile.preferences = currentPreferences;
        assignDefined(currentPreferences, patch.preferences as Record<string, unknown>, ["theme"]);

        if (patch.preferences.notifications) {
            const currentNotifications = asRecord(currentPreferences.notifications);
            currentPreferences.notifications = currentNotifications;
            assignDefined(currentNotifications, patch.preferences.notifications as Record<string, unknown>, ["email", "sms", "marketing"]);
        }

        if (patch.preferences.privacy) {
            const currentPrivacy = asRecord(currentPreferences.privacy);
            currentPreferences.privacy = currentPrivacy;
            assignDefined(currentPrivacy, patch.preferences.privacy as Record<string, unknown>, ["email"]);
        }
    }
}



/** For /api/users - a safe list without passwords */
export async function getAllUsers(): Promise<UserSafe[]> {
    return userListRows.map(normalizeListUser);
}

/** For /api/auth/login - search with password hash */
export async function findByEmail(email: string): Promise<MockAuthUser | null> {
    return normalizeAuthUsers().find(user => user.email.toLowerCase() === String(email).toLowerCase()) ?? null;
}

/** (optional) get safe user by id */
export async function getById(id: string): Promise<UserSafe | null> {
    const user = findListRowById(id) ?? findProfileRowById(id);
    if (!user) {
        return null;
    }

    return normalizeListUser(user);
}

/** Full profile for frontend profile pages */
export async function getProfileById(id: string): Promise<UserProfileDto | null> {
    return getProfiles().find(user => user.id === id) ?? null;
}

/** Full profile lookup for resolving requester identity from token email */
export async function getProfileByEmail(email: string): Promise<UserProfileDto | null> {
    return getProfiles().find(user => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Update editable profile fields for the authenticated requester in the mock profile store */
export async function updateOwnProfile(
    requester: { id?: string; sub?: string; email?: string },
    patch: EditableUserProfilePatch
): Promise<UserProfileDto | null> {
    const row =
        (requester.id || requester.sub ? findProfileRowById(requester.id ?? requester.sub ?? "") : null) ??
        (requester.email ? findProfileRowByEmail(requester.email) : null);

    if (!row) {
        return null;
    }

    applyEditableProfilePatch(row, patch);

    return normalizeFullProfile(row);
}

/** Soft-delete or restore a mock user profile and matching auth record */
export async function updateUserDeleted(id: string, deleted: boolean): Promise<UserProfileDto | null> {
    const profile = findProfileRowById(id);
    if (!profile) {
        return null;
    }

    applyDeletedState(profile, deleted);

    for (const row of syncRowsForProfile(profile)) {
        applyDeletedState(row, deleted);
    }

    return normalizeFullProfile(profile);
}

/** Suspend or unsuspend a mock user profile and matching auth record */
export async function updateUserSuspended(id: string, suspended: boolean): Promise<UserProfileDto | null> {
    const profile = findProfileRowById(id);
    if (!profile) {
        return null;
    }

    applySuspendedState(profile, suspended);

    for (const row of syncRowsForProfile(profile)) {
        applySuspendedState(row, suspended);
    }

    return normalizeFullProfile(profile);
}
