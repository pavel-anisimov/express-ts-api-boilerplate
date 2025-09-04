// type-only imports from express
import type {Request, Response, NextFunction, RequestHandler} from 'express';
import type { ZodType } from 'zod';
import type { z } from "zod";

type AnyZod = ZodType<unknown>; // equivalent to "any zod schema"

/**
 * Middleware function to validate incoming request data against a specified schema.
 *
 * @param {AnyZod} schema The Zod schema to validate the incoming data against.
 * @param {"body" | "query"} [where="body"] Specifies whether to validate the `body` or `query` parameters of the request.
 * @return {RequestHandler} Returns a middleware function for request validation.
 */
export function validate(schema: AnyZod, where: "body" | "query" = "body"): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = where === "body" ? req.body : req.query;
        const parsed = schema.safeParse(data);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validation error",
                issues: parsed.error.issues.map(
                    ({path, message}) => ({ path, message })
                ),
            });
        }

        if (where === "body") {
            // avoid any: use unknown -> specify a field type
            (req as unknown as { body: z.infer<AnyZod> }).body = parsed.data;
        } else {
            (req as unknown as { query: z.infer<AnyZod> }).query = parsed.data;
        }
        next();
    };
}

