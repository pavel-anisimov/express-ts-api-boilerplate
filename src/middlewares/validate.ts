// type-only imports from express
import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

import { HttpError } from '../utils/httpError';

// Accept any Zod-scheme. For universality, ZodType<unknown> is sufficient.
type AnyZod = ZodType<unknown>; // equivalent to "any zod schema"

export const validate =
    (schema: AnyZod) =>
        (req: Request, _res: Response, next: NextFunction) => {
            const parsed = schema.safeParse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (!parsed.success) {
                // if desired, you can log parsed.error.format()
                throw new HttpError(400, 'Validation error', 'VALIDATION_ERROR');
            }

            next();
        };
