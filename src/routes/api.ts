import { Router, type Request, type Response } from "express";

import { authRouter } from "./auth";
import { usersRouter } from "./users";

/**
 * Root API router mounted by the Express application.
 *
 * This file owns gateway-level route composition. Domain route files keep their
 * own validation and auth middleware, while this router decides the public
 * `/api/*` namespace layout.
 */
export const apiRouter = Router();

/**
 * GET /api/health
 *
 * Lightweight process health check used by smoke tests and deployment probes.
 */
apiRouter.get("/health", (_req: Request, res: Response): void => {
    res.json({ status: "ok", ts: new Date().toISOString() });
});

/**
 * Domain route mounts.
 */
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
