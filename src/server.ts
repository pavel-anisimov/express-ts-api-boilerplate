import 'dotenv/config';
import { app } from './app';

/**
 * Network binding configuration for the gateway process.
 */
const PORT = Number(process.env.PORT ?? 3100);
const HOST = process.env.HOST ?? '0.0.0.0';

/**
 * Starts the HTTP server for local/dev/runtime execution.
 *
 * Tests import `app` directly and do not execute this file.
 */
const server = app.listen(PORT, HOST, () => {
    console.log('----------------------------------------');
    console.log(`Gateway listening on  http://localhost:${PORT}`);
    console.log(`Auth endpoints       -> /api/auth/*`);
    console.log(`Business API         -> /api/*`);
    console.log(`Health check         -> http://localhost:${PORT}/api/health`);
    console.log(`Login (POST)         -> http://localhost:${PORT}/api/auth/login`);
    console.log('----------------------------------------');
});

/**
 * Fail fast on unhandled promise rejections and close the HTTP server first.
 */
process.on('unhandledRejection', (err: unknown) => {
    console.error('[unhandledRejection]', err);
    server.close(() => process.exit(1));
});

/**
 * Gracefully stop accepting connections during container/process shutdown.
 */
process.on('SIGTERM', () => {
    console.log('[SIGTERM] shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed.');
    });
});
