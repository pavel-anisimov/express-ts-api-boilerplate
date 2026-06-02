import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { logger } from './utils/logger';
import { apiRouter } from "./routes/api";
import { errorHandler } from './middlewares/errorHandler';

/**
 * Express application instance used by both the HTTP server and tests.
 *
 * Keep network binding in `server.ts`; exporting the app directly lets
 * Supertest exercise routes without opening a real port.
 */
export const app = express();

/**
 * Global HTTP middleware stack.
 */
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

/**
 * Minimal root response for quick browser/manual checks.
 */
app.get("/", (_req, res) => res.send("API Gateway running"));

/**
 * Public API namespace.
 */
app.use("/api", apiRouter);

/**
 * Swagger UI for the generated OpenAPI spec.
 */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * JSON 404 fallback for unmatched routes.
 */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

/**
 * Final error formatter.
 */
app.use(errorHandler);
