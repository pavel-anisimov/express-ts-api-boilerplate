import type { UserProfile } from "../../types/models";
import { loadMockRecords } from "../../utils/mockDataLoader";
import type { AuthRepository } from "../auth/AuthRepository";

import type {
    EditableUserProfilePatch,
    UserProfileDto,
    UserSafe,
    UsersRepository,
    UsersRepositoryRequester,
} from "./UsersRepository";

type MockUserProfile = Omit<UserProfile, "status" | "deleted" | "deleted_at"> & {
    status: string;
    deleted: boolean;
    deleted_at: string | null;
};

/**
 * Returns a plain object for nested mock data fields.
 */
function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/**
 * Reads a string value from raw mock data, otherwise returns null.
 */
function stringOrNull(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}

/**
 * Reads a string value from raw mock data, otherwise returns a fallback.
 */
function stringOrDefault(value: unknown, fallback: string): string {
    return typeof value === "string" ? value : fallback;
}

/**
 * Reads a boolean value from raw mock data, otherwise returns a fallback.
 */
function booleanOrDefault(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}

/**
 * Reads a number value from raw mock data, otherwise returns a fallback.
 */
function numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === "number" ? value : fallback;
}

/**
 * Reads string arrays from raw mock data and filters invalid items.
 */
function stringArrayOrDefault(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

/**
 * Converts raw mock rows to the safe list DTO returned by `/api/users`.
 *
 * Password hashes and nested security/metadata fields are stripped here so
 * list responses cannot expose auth-only data.
 */
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

/**
 * Converts raw profile mock rows to the full profile DTO.
 *
 * The mock files intentionally mirror Python API payloads, so this function
 * fills missing nested structures with stable defaults expected by consumers.
 */
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

/**
 * Copies only fields explicitly present in the patch object.
 *
 * This preserves existing mock values when a PATCH body omits a field while
 * still allowing explicit `null` updates where the schema permits them.
 */
function assignDefined(target: Record<string, unknown>, source: Record<string, unknown>, keys: string[]): void {
    for (const key of keys) {
        if (Object.hasOwn(source, key)) {
            target[key] = source[key];
        }
    }
}

/**
 * Applies soft-delete semantics used by user management endpoints.
 */
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

/**
 * Applies suspend/unsuspend semantics without reviving deleted users.
 */
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

/**
 * Applies only fields accepted by the profile update schema.
 *
 * The patch is intentionally selective: unknown top-level and nested fields are
 * ignored here, and existing nested objects are created on demand so partial
 * mock rows can still accept valid updates.
 */
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

/**
 * Mock users repository backed by files under `mock-data/users`.
 *
 * It owns user list/profile/admin-detail reads and keeps related auth mock
 * state synchronized through the injected auth repository. The files are split
 * by downstream API response shape, so this repository normalizes them into the
 * stable DTOs used by gateway services.
 */
export class UsersMockRepository implements UsersRepository {
    private readonly listRows = loadMockRecords("users/user-list-items.json");
    private readonly profileRows = loadMockRecords("users/user-profiles.json");
    private readonly adminRows = loadMockRecords("users/admin-details.json");

    constructor(private readonly authRepository: AuthRepository) {}

    /**
     * Returns safe list users without passwordHash or security internals.
     */
    listUsers(): UserSafe[] {
        return this.listRows.map(normalizeListUser);
    }

    /**
     * Returns a safe user by id from list rows, falling back to profile rows.
     */
    getUserById(id: string): UserSafe | null {
        const row = this.findListRowById(id) ?? this.findProfileRowById(id);
        return row ? normalizeListUser(row) : null;
    }

    /**
     * Returns the full frontend profile by user id.
     */
    getUserProfileById(id: string): UserProfileDto | null {
        const row = this.findProfileRowById(id);
        return row ? normalizeFullProfile(row) : null;
    }

    /**
     * Returns the full frontend profile by email.
     */
    getUserProfileByEmail(email: string): UserProfileDto | null {
        const row = this.findProfileRowByEmail(email);
        return row ? normalizeFullProfile(row) : null;
    }

    /**
     * Returns admin-only metadata by user id.
     */
    getAdminDetailsById(id: string): Record<string, unknown> | null {
        return this.adminRows.find((user) => user.id === id) ?? null;
    }

    /**
     * Updates editable fields on the requester's own profile.
     */
    updateOwnProfile(requester: UsersRepositoryRequester, patch: EditableUserProfilePatch): UserProfileDto | null {
        const row =
            (requester.id || requester.sub ? this.findProfileRowById(requester.id ?? requester.sub ?? "") : null) ??
            (requester.email ? this.findProfileRowByEmail(requester.email) : null);

        if (!row) {
            return null;
        }

        applyEditableProfilePatch(row, patch);
        return normalizeFullProfile(row);
    }

    /**
     * Soft-deletes/restores a user and mirrors the state into related rows.
     */
    updateUserDeleted(id: string, deleted: boolean): UserProfileDto | null {
        const profile = this.findProfileRowById(id);
        if (!profile) {
            return null;
        }

        applyDeletedState(profile, deleted);
        this.syncRelatedRows(profile, (row) => applyDeletedState(row, deleted));
        return normalizeFullProfile(profile);
    }

    /**
     * Suspends/unsuspends a user and mirrors the state into related rows.
     */
    updateUserSuspended(id: string, suspended: boolean): UserProfileDto | null {
        const profile = this.findProfileRowById(id);
        if (!profile) {
            return null;
        }

        applySuspendedState(profile, suspended);
        this.syncRelatedRows(profile, (row) => applySuspendedState(row, suspended));
        return normalizeFullProfile(profile);
    }

    private findProfileRowById(id: string): Record<string, unknown> | null {
        return this.profileRows.find((user) => user.id === id) ?? null;
    }

    private findListRowById(id: string): Record<string, unknown> | null {
        return this.listRows.find((user) => user.id === id) ?? null;
    }

    private findProfileRowByEmail(email: string): Record<string, unknown> | null {
        return this.profileRows.find((user) => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase()) ?? null;
    }

    private findListRowByEmail(email: string): Record<string, unknown> | null {
        return this.listRows.find((user) => typeof user.email === "string" && user.email.toLowerCase() === email.toLowerCase()) ?? null;
    }

    /**
     * Keeps list rows and auth rows aligned with profile status mutations.
     *
     * Mock data is split by expected downstream endpoint, but gateway behavior
     * should look like the downstream services returned a consistent state.
     * Duplicate list-row references are removed before mutation so id/email
     * matches do not apply the same state change twice.
     */
    private syncRelatedRows(profile: Record<string, unknown>, mutate: (row: Record<string, unknown>) => void): void {
        const id = typeof profile.id === "string" ? profile.id : "";
        const email = typeof profile.email === "string" ? profile.email : "";
        const rows = [
            id ? this.findListRowById(id) : null,
            email ? this.findListRowByEmail(email) : null,
        ].filter((row, index, all): row is Record<string, unknown> => Boolean(row) && all.indexOf(row) === index);

        for (const row of rows) {
            mutate(row);
        }

        const identity: { id?: string; email?: string } = {};
        if (id) {
            identity.id = id;
        }

        if (email) {
            identity.email = email;
        }

        const patch: { deleted?: boolean; status?: string } = { deleted: profile.deleted === true };
        if (typeof profile.status === "string") {
            patch.status = profile.status;
        }

        this.authRepository.updateAuthUserState(identity, patch);
    }
}
