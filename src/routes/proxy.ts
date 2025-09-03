import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import { proxyTo } from '../utils/proxy';
import { services } from '../config/services';

export const proxyRouter = Router();

// Example: /api/proxy/users/* → USERS_SERVICE_URL/v1/* (we rewrite the prefix)
proxyRouter.use(
    '/users',
    requireAuth,
    requirePermission('proxy.users.read'),
    proxyTo(services.users, {
        pathRewrite: (path) => path.replace(/^\/api\/proxy\/users/, '/v1'),
    }),
);

// Similarly for the catalog
proxyRouter.use(
    '/catalog',
    requireAuth,
    requirePermission('proxy.catalog.read'),
    proxyTo(services.catalog, {
        pathRewrite: (path) => path.replace(/^\/api\/proxy\/catalog/, '/api'),
    }),
);