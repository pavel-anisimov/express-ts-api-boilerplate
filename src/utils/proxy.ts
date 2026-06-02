import type { Request, RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { logger } from './logger';

/**
 * Gateway proxy options supported by route-level proxy mounts.
 */
type ProxyOpts = {
    pathRewrite?: (path: string, req: Request) => string;
};

/**
 * Creates a configured downstream proxy middleware.
 *
 * The gateway keeps auth and tracing headers when forwarding requests, maps
 * proxy logs into the shared logger, and lets route files own path rewriting
 * because each downstream service has its own public prefix.
 */
export function proxyTo(target: string, opts: ProxyOpts = {}): RequestHandler {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        // cSpell:disable-next-line
        xfwd: true,

        logger: {
            info: (...args: unknown[]) => logger.info(args.map(String).join(' ')),
            warn: (...args: unknown[]) => logger.warn(args.map(String).join(' ')),
            error: (...args: unknown[]) => logger.error(args.map(String).join(' ')),
        },

        pathRewrite: opts.pathRewrite ?? ((path) => path),

        // http-proxy-middleware v3 registers hooks through the `on` field.
        on: {
            proxyReq(proxyReq, req) {
                const auth = (req as Request).header('authorization');
                if (auth) {
                    proxyReq.setHeader('authorization', auth);
                }

                const reqId = (req as Request).header('x-request-id');
                if (reqId) {
                    proxyReq.setHeader('x-request-id', reqId);
                }
            },
        },
    });
}
