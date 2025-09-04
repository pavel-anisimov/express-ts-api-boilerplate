// src/routes/auth.ts
import { Router } from "express";
import { z } from "zod";

import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import * as ctrl from "../controllers/auth";

/**
 * The `authRouter` variable represents an instance of an Express Router.
 * It is used to define and group routes related to authentication functionality.
 * Routes defined under this router typically handle operations such as
 * user login, signup, and other authentication-related tasks.
 */
export const authRouter = Router();

/**
 * LoginSchema defines the structure and validation rules for login data.
 *
 * Properties:
 * - email: A valid email address is required.
 * - password: A non-empty string is required.
 *
 * This schema is used to validate the email and password fields
 * during user authentication processes.
 */
const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

/**
 * RefreshSchema is a validation schema used for defining the structure
 * and constraints of a refresh token object.
 *
 * The schema specifies the following properties:
 * - `refreshToken`: A non-empty string representing the token used for
 *   refreshing authentication or session validity. It must contain at
 *   least one character.
 *
 * This schema ensures that the refresh token is valid and conforms to
 * the expected format before processing.
 */
const RefreshSchema = z.object({
    refreshToken: z.string().min(1),
});

// POST /auth/login
authRouter.post("/login", validate(LoginSchema), ctrl.login);

// POST /auth/refresh
authRouter.post("/refresh", validate(RefreshSchema), ctrl.refresh);

// GET /auth/me — protected endpoint
authRouter.get("/me", requireAuth, ctrl.me);

// POST /auth/logout — protected endpoint
authRouter.post("/logout", requireAuth, ctrl.logout);

// (optional)
// authRouter.post("/register", validate(RegisterSchema), ctrl.register);
