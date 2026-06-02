import request from 'supertest';

import { app } from '../src/app';

/**
 * Auth route integration tests.
 *
 * These exercise the gateway in mock mode through the real Express app and
 * verify public response contracts rather than repository internals.
 */
describe('Auth', () => {
    it('logs in with mock auth credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin1@example.com', password: 'password' })
            .expect(200);

        expect(response.body.accessToken).toBeTruthy();
        expect(response.body.refreshToken).toBeTruthy();
        expect(response.body.user?.email).toBe('admin1@example.com');
        expect(response.body.user?.passwordHash).toBeUndefined();
    });

    it('rejects bad login credentials', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin1@example.com', password: 'wrong-password' })
            .expect(401);
    });

    it('rejects missing login credentials', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin1@example.com' })
            .expect(400);
    });

    it('rejects refresh without refresh token', async () => {
        await request(app)
            .post('/api/auth/refresh')
            .send({})
            .expect(400);
    });

    it('returns current profile for a valid token', async () => {
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin1@example.com', password: 'password' })
            .expect(200);

        const response = await request(app)
            .get('/api/auth/me')
            .set('authorization', `Bearer ${loginResponse.body.accessToken}`)
            .expect(200);

        expect(response.body.email).toBe('admin1@example.com');
        expect(response.body.passwordHash).toBeUndefined();
    });

    it('rejects inactive mock users', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: 'blocked@example.com', password: 'password' })
            .expect(403);
    });
});
