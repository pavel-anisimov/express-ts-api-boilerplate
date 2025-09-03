import type {Request, Response} from 'express';

import { eventBus } from '../services/eventBus';

export async function publishTest(req: Request, res: Response) {
  const event = eventBus.publish('gateway.test', { from: req.user?.email ?? 'anon', payload: req.body ?? {} });
  res.status(202).json({ data: event });
}

export async function recent(_req: Request, res: Response) {
  res.json({ data: eventBus.recent() });
}

