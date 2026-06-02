import { z } from "zod";

/**
 * Query parameters accepted by the users list endpoint.
 *
 * Numeric values are coerced from query-string input and normalized to safe
 * pagination defaults. The service layer receives already parsed values from
 * the validation middleware.
 */
export const ListUsersQuerySchema = z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
});

/**
 * Request body for future user creation endpoints.
 *
 * `role` is currently a string to keep the schema compatible with older route
 * plans. Tighten it to the canonical Role enum when user creation is wired to
 * the final downstream API.
 */
export const CreateUserSchema = z.object({
    email: z.email(),
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
});

/**
 * Partial user update body derived from the create-user shape.
 */
export const UpdateUserSchema = CreateUserSchema.partial();
