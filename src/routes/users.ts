// src/routes/users.ts
import { Router } from "express";
import { z } from "zod";

import { validate } from "../middlewares/validate";
import * as ctrl from "../controllers/users";

export const usersRouter = Router();

// Schemes (minimum; you can move them to /schemas/users.ts)
const ListUsersQuerySchema = z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
});

const CreateUserSchema = z.object({
    email: z.email(),
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
});

const UpdateUserSchema = CreateUserSchema.partial();

const AssignRoleSchema = z.object({
    userId: z.string().min(1),
    role: z.string().min(1),
});

// GET /api/users
usersRouter.get("/", validate(ListUsersQuerySchema, "query"), ctrl.listUsers);

// POST /api/users
usersRouter.post("/", validate(CreateUserSchema), ctrl.createUser);

// GET /api/users/:id
usersRouter.get("/:id", ctrl.getUser);

// PUT /api/users/:id
usersRouter.put("/:id", validate(UpdateUserSchema), ctrl.updateUser);

// DELETE /api/users/:id
usersRouter.delete("/:id", ctrl.deleteUser);

// POST /api/users/assign-role
usersRouter.post("/assign-role", validate(AssignRoleSchema), ctrl.assignRole);
