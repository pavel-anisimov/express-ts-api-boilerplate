// src/routes/auth.ts
import { Router } from "express";
import { z } from "zod";

import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/auth";
import * as ctrl from "../controllers/auth";

export const authRouter = Router();

const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

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


