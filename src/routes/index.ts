import { Router } from 'express';

import { authRouter } from './auth';
import { usersRouter } from './users';
import { eventsRouter } from './events';
import { proxyRouter } from './proxy';

export const router = Router();

router.get('/healthz', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/events', eventsRouter);

// Proxy to external microservices
router.use('/proxy', proxyRouter);

// Stubs for future microservices:
// router.use('/payments', proxyTo(...));
// router.use('/catalog', proxyTo(...));

