// src/routes/users.ts
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
// If you use RBAC, you can enable read/manage user rights
// import { requirePermission } from "../middlewares/permissions";

export const usersRouter = Router();

const DeletedPatchSchema = z.object({
    deleted: z.boolean(),
}).strict();

const SuspendedPatchSchema = z.object({
    suspended: z.boolean(),
}).strict();

// Full user profile for frontend profile pages
usersRouter.get(
    "/:id/profile",
    requireAuth,
    getUserProfile
);

// Soft-delete/restore a user
usersRouter.patch(
    "/:id/deleted",
    requireAuth,
    validate(DeletedPatchSchema),
    setUserDeleted
);

// Suspend/unsuspend a user
usersRouter.patch(
    "/:id/suspended",
    requireAuth,
    validate(SuspendedPatchSchema),
    setUserSuspended
);

// List of users
usersRouter.get(
    "/",
    requireAuth,
    // requirePermission("user.read"),
    listUsers
);

// Get user by id
usersRouter.get(
    "/:id",
    requireAuth,
    // requirePermission("user.read"),
    getUserById
);

// Create user
usersRouter.post(
    "/",
    requireAuth,
    // requirePermission("user.write"),
    createUser
);

// Update user
usersRouter.put(
    "/:id",
    requireAuth,
    // requirePermission("user.write"),
    updateUser
);

// Delete user
usersRouter.delete(
    "/:id",
    requireAuth,
    // requirePermission("user.write"),
    deleteUser
);
