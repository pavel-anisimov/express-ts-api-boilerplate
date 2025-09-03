// src/utils/proxy.ts
import type { Request } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { logger } from './logger';

type ProxyOpts = {
    pathRewrite?: (path: string, req: Request) => string;
};

export function proxyTo(target: string, opts: ProxyOpts = {}) {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        // cSpell:disable-next-line
        xfwd: true,

        logger: {
            log: (...args: unknown[]) => logger.info(args.map(String).join(' ')),
            debug: (...args: unknown[]) => logger.debug(args.map(String).join(' ')),
            info: (...args: unknown[]) => logger.info(args.map(String).join(' ')),
            warn: (...args: unknown[]) => logger.warn(args.map(String).join(' ')),
            error: (...args: unknown[]) => logger.error(args.map(String).join(' ')),
        },

        pathRewrite: opts.pathRewrite ?? ((path) => path),

        // ✅ v3: events via the `on` field
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
            // optionally you can add:
            // error(err, req, res) { ... },
            // proxyRes(proxyRes, req, res) { ... },
        },
    });
}
