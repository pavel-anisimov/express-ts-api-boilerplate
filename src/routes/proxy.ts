import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import { proxyTo } from '../utils/proxy';
import { services } from '../config/services';

/**
 * Downstream proxy route group.
 *
 * Proxy routes are protected at the gateway boundary, then forwarded to the
 * configured logical downstream service with a route-specific path rewrite.
 */
export const proxyRouter = Router();

/**
 * /api/proxy/users/* -> USERS_SERVICE_URL/v1/*
 */
proxyRouter.use(
    '/users',
    requireAuth,
    requirePermission('proxy.users.read'),
    proxyTo(services.users, {
        pathRewrite: (path) => path.replace(/^\/api\/proxy\/users/, '/v1'),
    }),
);

/**
 * /api/proxy/catalog/* -> CATALOG_SERVICE_URL/api/*
 */
proxyRouter.use(
    '/catalog',
    requireAuth,
    requirePermission('proxy.catalog.read'),
    proxyTo(services.catalog, {
        pathRewrite: (path) => path.replace(/^\/api\/proxy\/catalog/, '/api'),
    }),
);
