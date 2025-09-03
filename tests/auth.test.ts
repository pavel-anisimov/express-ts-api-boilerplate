import request from 'supertest';

import { app } from '../src/app';

describe('Auth', () => {
    it('registers and logs in', async () => {
        const r1 = await request(app)
            .post('/api/auth/register')
            .send({ email: 't1@example.com', password: 'Secret123!', name: 'T1' })
            .expect(201);

        expect(r1.body?.data?.user?.email).toBe('t1@example.com');
        expect(r1.body?.data?.accessToken).toBeTruthy();

        const r2 = await request(app)
            .post('/api/auth/login')
            .send({ email: 't1@example.com', password: 'Secret123!' })
            .expect(200);

        expect(r2.body?.data?.accessToken).toBeTruthy();
    });
});
