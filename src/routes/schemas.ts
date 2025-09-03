import { z } from 'zod';

export const RegisterDto = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1),
  }),
});

export const LoginDto = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),
});

export const UpdateProfileDto = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

export const AssignRoleDto = z.object({
  body: z.object({
    userId: z.string().min(1),
    role: z.string().min(1),
  }),
});

