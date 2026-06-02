import type {Request, Response} from 'express';

import { eventBus } from '../services/eventBus';

/**
 * POST /api/events/test
 *
 * Publishes a diagnostic event into the in-process event bus. This endpoint is
 * useful for smoke-testing gateway event wiring before a real broker is added.
 */
export async function publishTest(request: Request, response: Response): Promise<void> {
    const event = eventBus.publish(
        'gateway.test', {
            from: request.body?.user?.email ?? 'anon',
            payload: request.body ?? {}
        }
    );

    response.status(202).json({ data: event });
}

/**
 * GET /api/events/recent
 *
 * Returns the recent in-memory events captured by the local event bus.
 */
export async function recent(_req: Request, res: Response): Promise<void> {
    res.json({ data: eventBus.recent() });
}
