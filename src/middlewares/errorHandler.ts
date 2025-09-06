import type {Request, Response, NextFunction} from 'express';

import type { HttpError } from '../utils/httpError';

/**
 * Handles application errors by formatting and sending a response with the appropriate status and message.
 *
 * @param {unknown} err - The error object that needs to be handled. It may contain properties such as status, code, and message.
 * @param {Request} _req - The HTTP request object (not used in this method).
 * @param {Response} res - The HTTP response object used to send back the error details.
 * @param {NextFunction} _next - The next middleware function (not used in this method).
 * @return {void} Does not return any value. Sends an error response to the client.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const e = err as Partial<HttpError>;
  const status = typeof e.status === 'number' ? e.status : 500;
  const code = e.code ?? 'INTERNAL_ERROR';
  const message = e.message ?? 'Internal Server Error';

  res.status(status).json({ error: { code, message } });
}
