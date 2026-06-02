import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Creates an Express middleware for validating one request segment with Zod.
 *
 * Successful parses replace or merge the validated data back onto the request
 * so downstream handlers can consume normalized values. Query and params are
 * merged because Express exposes them through request-owned objects/getters.
 */
export function validate<T>(
    schema: ZodType<T>,
    where: "body" | "query" | "params" = "body"
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const src = where === "body" ? req.body : where === "params" ? req.params : req.query;

        const parsed = schema.safeParse(src);
        if (!parsed.success) {
            return res.status(400).json({
                error: { code: "BAD_REQUEST", message: parsed.error.message },
            });
        }

        // NEVER do: req[where] = parsed.data
        // In Express 5, req.query is a getter, so only merge into it.
        if (where === "query") {
            Object.assign(
                req.query as unknown as Record<string, unknown>,
                parsed.data as unknown as Record<string, unknown>
            );
        } else if (where === "params") {
            Object.assign(
                req.params as unknown as Record<string, string>,
                parsed.data as unknown as Record<string, string>
            );
        } else {
            (req as Request & { body: T }).body = parsed.data;
        }
        next();
    };
}
