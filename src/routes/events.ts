import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import * as ctrl from '../controllers/events';

/**
 * Event diagnostics route group.
 *
 * These routes exercise the in-process event bus and are protected by both
 * authentication and event permissions.
 */
export const eventsRouter = Router();

/**
 * POST /api/events/publish
 */
eventsRouter.post(
    '/publish',
    requireAuth,
    requirePermission('events.publish'),
    ctrl.publishTest,
);

/**
 * GET /api/events/recent
 */
eventsRouter.get(
    '/recent',
    requireAuth,
    requirePermission('events.read'),
    ctrl.recent,
);
