import type { Request, RequestHandler } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { logger } from './logger';

/**
 * Type definition for ProxyOpts.
 *
 * Represents options for configuring a proxy.
 *
 * @property {function} [pathRewrite] - Optional function used to rewrite the request path.
 *     The function takes the original path and the request object as arguments and
 *     should return the rewritten path as a string.
 */
type ProxyOpts = {
    pathRewrite?: (path: string, req: Request) => string;
};

/**
 * Sets up a proxy middleware handler that forwards requests to a specified target.
 * The proxy middleware supports custom logging, authorization header forwarding,
 * and optional path rewriting.
 *
 * @param {string} target - The target URL to which the requests will be proxied.
 * @param {ProxyOpts} [opts={}] - Optional configuration for the proxy middleware, including path rewrite options.
 * @return {RequestHandler} A middleware function configured for request proxying.
 */
export function proxyTo(target: string, opts: ProxyOpts = {}): RequestHandler {
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
