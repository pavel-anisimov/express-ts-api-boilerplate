// src/schemas/users.ts
import { z } from "zod";

export const ListUsersQuerySchema = z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
});

export const CreateUserSchema = z.object({
    email: z.email(),
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(), // "admin" | "user" etc.
});

export const UpdateUserSchema = CreateUserSchema.partial();
