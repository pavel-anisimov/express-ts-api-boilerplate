// src/server.ts
import 'dotenv/config';
import { app } from './app';

const PORT = Number(process.env.PORT ?? 3100);
const HOST = process.env.HOST ?? '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log('----------------------------------------');
    console.log(`Gateway listening on  http://localhost:${PORT}`);
    console.log(`Auth endpoints       -> /auth/*`);
    console.log(`Business API         -> /api/*`);
    console.log(`Health check         -> http://localhost:${PORT}/api/health`);
    console.log(`Login (POST)         -> http://localhost:${PORT}/auth/login`);
    console.log('----------------------------------------');
});

// graceful termination on errors/signals
process.on('unhandledRejection', (err: unknown) => {
    console.error('[unhandledRejection]', err);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('[SIGTERM] shutting down gracefully…');
    server.close(() => {
        console.log('HTTP server closed.');
    });
});
