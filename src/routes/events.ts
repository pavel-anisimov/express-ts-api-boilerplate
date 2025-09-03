import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import * as ctrl from '../controllers/events';

export const eventsRouter = Router();


eventsRouter.post('/publish', requireAuth, requirePermission('events.publish'), ctrl.publishTest);
eventsRouter.get('/recent',   requireAuth, requirePermission('events.read'),    ctrl.recent);

