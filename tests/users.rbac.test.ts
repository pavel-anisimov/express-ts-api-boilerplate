import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';

async function login(email: string, password: string) {
    const r = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    return r.body.accessToken as string;
}

describe('Users', () => {
    it('requires authentication for listing users', async () => {
        await request(app).get('/api/users').expect(401);
    });

    it('lists users for an authenticated requester', async () => {
        const adminToken = await login('admin1@example.com', 'password');

        const response = await request(app)
            .get('/api/users')
            .set('authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.total).toBeGreaterThan(0);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(20);
        expect(response.body.items[0].passwordHash).toBeUndefined();
    });

    it('filters users by display name', async () => {
        const adminToken = await login('admin1@example.com', 'password');

        const response = await request(app)
            .get('/api/users')
            .query({ q: 'alice' })
            .set('authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.total).toBeGreaterThan(0);
        expect(response.body.items.some((user: { email?: string }) => user.email === 'alice@example.com')).toBe(true);
    });

    it('paginates users', async () => {
        const adminToken = await login('admin1@example.com', 'password');

        const response = await request(app)
            .get('/api/users')
            .query({ page: 2, limit: 3 })
            .set('authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.limit).toBe(3);
        expect(response.body.items).toHaveLength(3);
    });
});
