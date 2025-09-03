import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => logger.info({ port: env.PORT }, 'Gateway started'));

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  logger.info('Shutting down...');
  server.close(() => {
    logger.info('HTTP server closed'); process.exit(0);
  });
}

