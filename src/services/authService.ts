import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { userRepo } from '../repositories/inMemory';
import { env } from '../config/env';
import { HttpError } from '../utils/httpError';
import type { Role } from '../types/models';

import { eventBus } from './eventBus';

/**
 * Authentication service object providing user management functionalities,
 * including registration, login, and JWT token issuance.
 */
export const authService = {
    /**
     * Registers a new user with the provided email, password, and name.
     * If the user already exists, an error is thrown. The first registered user
     * is assigned the 'admin' role, while subsequent users are assigned the 'user' role.
     *
     * @param {string} email - The email address of the user to register.
     * @param {string} password - The password for the new user account.
     * @param {string} name - The name of the user to register.
     * @return {Promise<Object>} A promise that resolves to an object containing the newly created user and an access token.
     * @throws {HttpError} If the email is already registered.
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
     * Authenticates a user using their email and password.
     *
     * @param {string} email The email of the user attempting to log in.
     * @param {string} password The password of the user attempting to log in.
     * @return {Promise<{user: Object, accessToken: string}>} A promise that resolves with the authenticated user's information and an access token.
     * @throws {HttpError} If the email does not match a registered user.
     * @throws {HttpError} If the user account is blocked.
     * @throws {HttpError} If the user's email is not verified.
     * @throws {HttpError} If the password is invalid.
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

    /**
     * Issues a JWT (JSON Web Token) using the provided user details and options.
     *
     * @param {string} sub - The unique identifier for the subject (user).
     * @param {string} email - The email address of the subject.
     * @param {Role[]} roles - An array of roles assigned to the subject.
     * @param {string} [name] - The optional name of the subject.
     * @return {string} A signed JWT containing the provided payload and options.
     */
    issueToken(sub: string, email: string, roles: Role[], name?: string) {
        // payload as an object - to avoid overloading with callback/none
        const payload = { sub, email, roles, name };
        const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN, jwtid: uuid() };

        return jwt.sign(payload, env.JWT_SECRET, options);
    },
};

/**
 * Removes the `passwordHash` property from the given user object, returning a sanitized version of the object.
 *
 * @param {T} user - The user objects to be sanitized. This object may contain a `passwordHash` property.
 * @return {Omit<T, 'passwordHash'>} A new user object without the `passwordHash` property.
 */
function sanitize<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
    // remove passwordHash from the response
    const {  passwordHash: _passwordHash, ...rest } = user;

    return rest;
}
