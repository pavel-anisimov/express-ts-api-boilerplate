import { Router } from 'express';

import { validate } from '../middlewares/validate';
import * as ctrl from '../controllers/auth';
import { requireAuth } from '../middlewares/auth';

import { LoginDto, RegisterDto } from './schemas';

export const authRouter = Router();
authRouter.post('/register', validate(RegisterDto), ctrl.register);
authRouter.post('/login',    validate(LoginDto),    ctrl.login);

// 🔒 Logout - requires a valid access token
authRouter.post('/logout', requireAuth, ctrl.logout);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: OK
 */