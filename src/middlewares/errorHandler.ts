import type {Request, Response, NextFunction} from 'express';

import type { HttpError } from '../utils/httpError';

/**
 * Final Express error formatter for the gateway.
 *
 * Domain code should throw `HttpError` when it needs a specific status/code.
 * Unknown errors are intentionally collapsed to a generic 500 response so
 * implementation details do not leak through the public API.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const e = err as Partial<HttpError>;
  const status = typeof e.status === 'number' ? e.status : 500;
  const code = e.code ?? 'INTERNAL_ERROR';
  const message = e.message ?? 'Internal Server Error';

  res.status(status).json({ error: { code, message } });
}
