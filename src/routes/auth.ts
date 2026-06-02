import { Router } from "express";
import { z } from "zod";

import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import * as ctrl from "../controllers/auth";

/**
 * Auth route group.
 *
 * Routes in this file only compose validation/auth middleware and controller
 * handlers. Auth behavior lives in AuthService and repository/client layers.
 */
export const authRouter = Router();

/**
 * Login request body.
 */
const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

/**
 * Refresh request body.
 */
const RefreshSchema = z.object({
    refreshToken: z.string().min(1),
});

/**
 * Shared nullable string helpers for profile patch schemas.
 */
const nullableString = z.string().nullable();
const optionalNullableString = nullableString.optional();

/**
 * Editable profile fields for `PATCH /api/auth/me/profile`.
 *
 * The schema is strict at every object level so unsupported fields are rejected
 * before they reach AuthService/repositories.
 */
const ProfileUpdateSchema = z.object({
    display_name: optionalNullableString,
    first_name: optionalNullableString,
    last_name: optionalNullableString,
    profile: z.object({
        gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
        date_of_birth: optionalNullableString,
        bio: optionalNullableString,
        language: z.enum(["en", "ru", "pl"]).nullable().optional(),
        timezone: z.string().refine((value) => {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: value });
                return true;
            } catch {
                return false;
            }
        }, "Invalid IANA timezone").nullable().optional(),
        avatar_url: optionalNullableString,
        phone_number: optionalNullableString,
        location: z.object({
            city: optionalNullableString,
            state: optionalNullableString,
            country: optionalNullableString,
            zip: optionalNullableString,
        }).strict().optional(),
        social: z.record(z.string(), z.unknown()).optional(),
    }).strict().optional(),
    preferences: z.object({
        theme: z.enum(["light", "dark", "system"]).optional(),
        notifications: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            marketing: z.boolean().optional(),
        }).strict().optional(),
        privacy: z.object({
            email: z.enum(["private", "workspace", "public"]).optional(),
        }).strict().optional(),
    }).strict().optional(),
}).strict();

/**
 * POST /api/auth/login
 */
authRouter.post("/login", validate(LoginSchema), ctrl.login);

/**
 * POST /api/auth/refresh
 */
authRouter.post("/refresh", validate(RefreshSchema), ctrl.refresh);

/**
 * GET /api/auth/me
 */
authRouter.get("/me", requireAuth, ctrl.me);

/**
 * PATCH /api/auth/me/profile
 */
authRouter.patch("/me/profile", requireAuth, validate(ProfileUpdateSchema), ctrl.updateMyProfile);

/**
 * POST /api/auth/logout
 */
authRouter.post("/logout", requireAuth, ctrl.logout);

// Reserved for future registration flow.
// authRouter.post("/register", validate(RegisterSchema), ctrl.register);
