import { z } from 'zod';

/**
 * Legacy registration DTO schema.
 *
 * Kept for routes that still validate full `{ body: ... }` request envelopes.
 * Newer route files generally define local body/query/params schemas and pass
 * them through the shared `validate` middleware.
 */
export const RegisterDto = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1),
  }),
});

/**
 * Legacy login DTO schema.
 */
export const LoginDto = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
});

/**
 * Legacy profile update DTO schema.
 */
export const UpdateProfileDto = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

/**
 * Legacy role assignment DTO schema.
 */
export const AssignRoleDto = z.object({
  body: z.object({
    userId: z.string().min(1),
    role: z.string().min(1),
  }),
});
