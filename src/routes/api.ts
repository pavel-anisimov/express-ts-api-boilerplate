// src/routes/api.ts
import { Router } from "express";

import { usersRouter } from "./users";

export const apiRouter = Router();

// Health check: GET /api/health
apiRouter.get("/health",
    /**
     * Handles an HTTP request and sends a JSON response with a success status and the current timestamp.
     *
     * @param {Object} _req - The HTTP request object (not used in this function).
     * @param {Object} res - The HTTP response object used to send the JSON response.
     * @returns {void}
     */
    (_req: object, res: object): void => {
    res.json({ status: "ok", ts: new Date().toISOString() });
});

// Business routes
apiRouter.use("/users", usersRouter);
