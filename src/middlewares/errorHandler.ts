import type {Request, Response, NextFunction} from 'express';

import type { HttpError } from '../utils/httpError';

 
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = err as Partial<HttpError>;
  const status = typeof e.status === 'number' ? e.status : 500;
  const code = e.code ?? 'INTERNAL_ERROR';
  const message = e.message ?? 'Internal Server Error';

  res.status(status).json({ error: { code, message } });
}
