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
import { authRouter } from "./routes/auth";
import { apiRouter } from "./routes/api";
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 })); // 120 req/min/ip

app.get("/", (_req, res) => res.send("API Gateway running"));

app.use("/auth", authRouter); // login/refresh/logout/profile
app.use("/api", apiRouter);   // health, users, events, proxy, ...

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use(errorHandler);
