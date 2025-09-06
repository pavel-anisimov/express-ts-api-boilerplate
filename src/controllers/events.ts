import type {Request, Response} from 'express';

import { eventBus } from '../services/eventBus';

/**
 * Publishes a test event through the event bus and returns a response.
 *
 * @param {Request} request - The HTTP request object containing user email and body payload.
 * @param {Response} response - The HTTP response object used to return the status and event data.
 * @return {Promise<void>} A promise that resolves when the response is sent.
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
 * Fetches and returns the most recent events from the eventBus.
 *
 * @param {Request} _req - The incoming HTTP request object, not used in this method.
 * @param {Response} res - The outgoing HTTP response object.
 * @return {Promise<void>} A promise that resolves when the response is sent with the recent events data.
 */
export async function recent(_req: Request, res: Response): Promise<void> {
    res.json({ data: eventBus.recent() });
}

