import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';

async function login(email: string, password: string) {
    const r = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    return r.body.data.accessToken as string;
}

describe('RBAC', () => {
    it('admin can list users; normal user cannot', async () => {
        const adminToken = await login('admin1@example.com', 'Secret123!');
        const userToken  = await login('u1@example.com', 'Secret123!');

        // admin — OK
        const r1 = await request(app).get('/api/users').set('authorization', `Bearer ${adminToken}`);
        expect(r1.status).toBe(200);
        expect(Array.isArray(r1.body.data)).toBe(true);

        // user — FORBIDDEN
        const r2 = await request(app).get('/api/users').set('authorization', `Bearer ${userToken}`);
        expect(r2.status).toBe(403);
    });
});
