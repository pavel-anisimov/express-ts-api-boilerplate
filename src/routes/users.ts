// src/routes/users.ts
import { Router } from "express";

import {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/users";
import { requireAuth } from "../middlewares/auth";
// If you use RBAC, you can enable read/manage user rights
// import { requirePermission } from "../middlewares/permissions";

export const usersRouter = Router();

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

