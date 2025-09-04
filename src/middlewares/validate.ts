// type-only imports from express
import type {Request, Response, NextFunction, RequestHandler} from 'express';
import type { ZodType } from 'zod';
import type { z } from "zod";

type AnyZod = ZodType<unknown>; // equivalent to "any zod schema"


export function validate(schema: AnyZod, where: "body" | "query" | "params" = "body"): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const src =
            where === "body" ? req.body : where === "params" ? req.params : req.query;

        const parsed = schema.safeParse(src);
        if (!parsed.success) {
            return res.status(400).json({
                error: { code: "BAD_REQUEST", message: parsed.error.message },
            });
        }

        // НИКОГДА не делаем: req[where] = parsed.data
        // В Express 5 req.query — только getter.
        if (where === "query" || where === "params") {
            Object.assign(src as any, parsed.data);
        } else {
            req.body = parsed.data as any;
        }
        next();
    };
}

