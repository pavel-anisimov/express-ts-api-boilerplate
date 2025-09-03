import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { userRepo } from '../repositories/inMemory';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';
import type { Role } from '../types/models';

import { eventBus } from './eventBus';

export const authService = {
    /**
     * Registration.
     * The first user in the system becomes admin, the rest — user.
     * By default — active and verified (logic can be changed).
     */
    async register(email: string, password: string, name: string) {
        const exist = await userRepo.findByEmail(email);
        if (exist) {
            throw new HttpError(409, 'Email already registered', 'EMAIL_EXISTS');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // roles strictly as Role[], without string[]
        const isFirstUser = (await userRepo.list()).length === 0;
        const roles: Role[] = isFirstUser ? (['admin'] as Role[]) : (['user'] as Role[]);

        const user = await userRepo.create({
            email,
            passwordHash,
            name,
            roles,
            status: 'active',
            emailVerified: true,
        });

        eventBus.publish('user.registered', { id: user.id, email: user.email });

        const token = this.issueToken(user.id, user.email, user.roles, user.name);

        return { user: sanitize(user), accessToken: token };
    },

    /**
     * Login with status check.
     * - blocked → 403
     * - pending_verification / !emailVerified → 403
     */
    async login(email: string, password: string) {
        const user = await userRepo.findByEmail(email);
        if (!user) {
            throw new HttpError(401, 'Invalid credentials', 'BAD_CREDENTIALS');
        }

        if (user.status === 'blocked') {
            throw new HttpError(403, 'User is blocked', 'USER_BLOCKED');
        }

        if (!user.emailVerified || user.status === 'pending_verification') {
            throw new HttpError(403, 'Email not verified', 'EMAIL_NOT_VERIFIED');
        }

        const ok = await bcrypt.compare(password, user.passwordHash);

        if (!ok) {
            throw new HttpError(401, 'Invalid credentials', 'BAD_CREDENTIALS');
        }

        eventBus.publish('user.logged_in', { id: user.id, email: user.email });

        const token = this.issueToken(user.id, user.email, user.roles, user.name);

        return { user: sanitize(user), accessToken: token };
    },

    issueToken(sub: string, email: string, roles: Role[], name?: string) {
        // payload as an object - to avoid overloading with callback/none
        const payload = { sub, email, roles, name };
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN, jwtid: uuid() };

        return jwt.sign(payload, env.JWT_SECRET, options);
    },
};

function sanitize<T extends { passwordHash?: string }>(user: T) {
    // remove passwordHash from the response
    const {  passwordHash: _passwordHash, ...rest } = user;

    return rest;
}
