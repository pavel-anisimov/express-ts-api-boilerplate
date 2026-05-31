// src/routes/api.ts
import { Router, type Request, type Response } from "express";

import { authRouter } from "./auth";
import { usersRouter } from "./users";

export const apiRouter = Router();

// Health check: GET /api/health
apiRouter.get("/health", (_req: Request, res: Response): void => {
    res.json({ status: "ok", ts: new Date().toISOString() });
});

// Business routes
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
