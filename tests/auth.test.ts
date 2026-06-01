import request from 'supertest';

import { app } from '../src/app';

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

    it('rejects inactive mock users', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: 'blocked@example.com', password: 'password' })
            .expect(403);
    });
});
