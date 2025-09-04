import type { Request } from 'express';
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

/**s
 * Creates proxy middleware based on the provided target URL and options.
 * The proxy forwards requests to the specified target, optionally rewriting paths
 * and setting additional proxy request headers.
 *
 * @param {string} target - The target URL to which requests will be proxied.
 * @param {ProxyOpts} [opts={}] - Optional configuration options for the proxy, including path rewriting.
 * @return {Function} A middleware function for handling proxying of HTTP requests.
 */
export function proxyTo(target: string, opts: ProxyOpts = {}): Function {
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
