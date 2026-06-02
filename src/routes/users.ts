import { Router } from "express";
import { z } from "zod";

import {
    listUsers,
    getUserById,
    getUserProfile,
    setUserDeleted,
    setUserSuspended,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/users";
import { requireAuth } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
// RBAC can be enabled per route once product permissions are finalized.
// import { requirePermission } from "../middlewares/permissions";

/**
 * Users route group.
 *
 * Every route currently requires authentication. Authorization decisions that
 * depend on ownership/admin roles are handled by UserService; route-level RBAC
 * hooks are left commented until product permissions are finalized.
 */
export const usersRouter = Router();

/**
 * Request body for soft-delete/restore endpoint.
 */
const DeletedPatchSchema = z.object({
    deleted: z.boolean(),
}).strict();

/**
 * Request body for suspend/unsuspend endpoint.
 */
const SuspendedPatchSchema = z.object({
    suspended: z.boolean(),
}).strict();

/**
 * GET /api/users/:id/profile
 */
usersRouter.get(
    "/:id/profile",
    requireAuth,
    getUserProfile
);

/**
 * PATCH /api/users/:id/deleted
 */
usersRouter.patch(
    "/:id/deleted",
    requireAuth,
    validate(DeletedPatchSchema),
    setUserDeleted
);

/**
 * PATCH /api/users/:id/suspended
 */
usersRouter.patch(
    "/:id/suspended",
    requireAuth,
    validate(SuspendedPatchSchema),
    setUserSuspended
);

/**
 * GET /api/users
 */
usersRouter.get(
    "/",
    requireAuth,
    // requirePermission("user.read"),
    listUsers
);

/**
 * GET /api/users/:id
 */
usersRouter.get(
    "/:id",
    requireAuth,
    // requirePermission("user.read"),
    getUserById
);

/**
 * POST /api/users
 */
usersRouter.post(
    "/",
    requireAuth,
    // requirePermission("user.write"),
    createUser
);

/**
 * PUT /api/users/:id
 */
usersRouter.put(
    "/:id",
    requireAuth,
    // requirePermission("user.write"),
    updateUser
);

/**
 * DELETE /api/users/:id
 */
usersRouter.delete(
    "/:id",
    requireAuth,
    // requirePermission("user.write"),
    deleteUser
);
