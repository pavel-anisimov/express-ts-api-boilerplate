import {
    getAdminDetailsById,
    getAllUsers,
    getProfileByEmail,
    getProfileById,
    updateUserDeleted,
    updateUserSuspended,
    type UserProfileDto,
    type UserSafe,
} from "../repositories/usersRepo";
import { HttpError } from "../utils/httpError";

/**
 * Authenticated requester used for ownership and role checks.
 */
export type Requester = {
    id?: string;
    sub?: string;
    email?: string;
    roles?: string[];
};

/**
 * Query shape accepted by the users list service.
 */
type ListUsersQuery = {
    query?: string;
    q?: string;
    page?: string | number;
    limit?: string | number;
};

/**
 * Paginated users list response returned to controllers.
 */
type ListUsersResponse = {
    items: UserSafe[];
    total: number;
    page: number;
    limit: number;
};

/**
 * Returns the canonical requester id from normalized or JWT identity.
 */
function requesterId(requester: Requester): string {
    return requester.id ?? requester.sub ?? "";
}

/**
 * Detects whether a profile is already soft-deleted.
 */
function isDeletedUserProfile(profile: unknown): boolean {
    if (!profile || typeof profile !== "object") {
        return false;
    }

    const candidate = profile as { deleted?: unknown; status?: unknown };
    return candidate.deleted === true || candidate.status === "deleted";
}

/**
 * Resolves the requester's full profile from id/sub or email.
 */
async function requesterProfile(requester: Requester): Promise<UserProfileDto | null> {
    const id = requesterId(requester);
    return (id ? await getProfileById(id) : null) ?? (requester.email ? await getProfileByEmail(requester.email) : null);
}

/**
 * Determines whether a requester may soft-delete/restore the target user.
 *
 * Admins can update any user; non-admins can only update their own profile.
 */
async function canRequesterDelete(requester: Requester, targetId: string): Promise<boolean> {
    const id = requesterId(requester);
    const profile = await requesterProfile(requester);

    return (requester.roles ?? []).includes("admin") || profile?.id === targetId || id === targetId;
}

/**
 * Determines whether a requester may suspend/unsuspend users.
 */
function canRequesterSuspend(requester: Requester): boolean {
    const roles = requester.roles ?? [];
    return roles.includes("admin") || roles.includes("manager");
}

/**
 * Users domain service.
 *
 * This layer owns user-facing orchestration and authorization checks. It keeps
 * controllers thin while repositories remain focused on data access.
 */
export const userService = {
    /**
     * Lists safe users with search and normalized pagination.
     */
    async listUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
        const pageRaw = query.page ?? 1;
        const limitRaw = query.limit ?? 20;
        const page = Math.max(1, Number(pageRaw) || 1);
        const limit = Math.max(1, Number(limitRaw) || 20);
        const searchRaw = (query.query ?? query.q ?? "").toString().trim().toLowerCase();

        let items = await getAllUsers();

        if (searchRaw) {
            items = items.filter((user) =>
                user.email.toLowerCase().includes(searchRaw) ||
                (user.name ?? "").toLowerCase().includes(searchRaw) ||
                (user.username ?? "").toLowerCase().includes(searchRaw) ||
                (user.display_name ?? "").toLowerCase().includes(searchRaw) ||
                (user.first_name ?? "").toLowerCase().includes(searchRaw) ||
                (user.last_name ?? "").toLowerCase().includes(searchRaw) ||
                (user.status ?? "").toLowerCase().includes(searchRaw) ||
                (user.roles ?? []).some((role) => role.toLowerCase().includes(searchRaw))
            );
        }

        const total = items.length;
        const start = (page - 1) * limit;
        return { items: items.slice(start, start + limit), total, page, limit };
    },

    /**
     * Returns a user profile when the requester is an admin or the owner.
     */
    async getUserProfile(requester: Requester, targetId: string): Promise<UserProfileDto> {
        const target = await getProfileById(targetId);
        if (!target) {
            throw new HttpError(404, "profile not found");
        }

        const profile = await requesterProfile(requester);
        const isAdmin = (requester.roles ?? []).includes("admin");
        const isOwner = profile?.id === target.id || requesterId(requester) === target.id;

        if (!isAdmin && !isOwner) {
            throw new HttpError(403, "forbidden");
        }

        return target;
    },

    /**
     * Returns admin-only metadata for user management screens.
     */
    async getAdminDetailsById(id: string): Promise<Record<string, unknown> | null> {
        return getAdminDetailsById(id);
    },

    /**
     * Soft-deletes or restores a user after authorization checks.
     */
    async setUserDeleted(requester: Requester, targetId: string, deleted: boolean): Promise<UserProfileDto | null> {
        const target = await getProfileById(targetId);
        if (!target) {
            throw new HttpError(404, "profile not found");
        }

        if (!(await canRequesterDelete(requester, target.id))) {
            throw new HttpError(403, "forbidden");
        }

        return updateUserDeleted(target.id, deleted);
    },

    /**
     * Suspends or unsuspends a non-deleted user after role checks.
     */
    async setUserSuspended(requester: Requester, targetId: string, suspended: boolean): Promise<UserProfileDto | null> {
        const target = await getProfileById(targetId);
        if (!target) {
            throw new HttpError(404, "profile not found");
        }

        if (!canRequesterSuspend(requester)) {
            throw new HttpError(403, "forbidden");
        }

        if (isDeletedUserProfile(target)) {
            throw new HttpError(400, "deleted user cannot be suspended");
        }

        return updateUserSuspended(target.id, suspended);
    },

    /**
     * Deletes a user using the same soft-delete behavior as PATCH deleted.
     */
    async deleteUser(requester: Requester, targetId: string): Promise<UserProfileDto | null> {
        return this.setUserDeleted(requester, targetId, true);
    },
};
