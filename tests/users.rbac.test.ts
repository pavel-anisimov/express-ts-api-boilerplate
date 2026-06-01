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

    it('rejects invalid tokens when listing users', async () => {
        await request(app)
            .get('/api/users')
            .set('authorization', 'Bearer invalid-token')
            .expect(401);
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

    it('returns an empty page when search has no matches', async () => {
        const adminToken = await login('admin1@example.com', 'password');

        const response = await request(app)
            .get('/api/users')
            .query({ q: 'not-existing-user' })
            .set('authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.items).toEqual([]);
        expect(response.body.total).toBe(0);
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

    it('normalizes invalid pagination values', async () => {
        const adminToken = await login('admin1@example.com', 'password');

        const response = await request(app)
            .get('/api/users')
            .query({ page: 0, limit: 0 })
            .set('authorization', `Bearer ${adminToken}`)
            .expect(200);

        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(20);
        expect(response.body.items).toHaveLength(20);
    });

    it('rejects normal users reading another user profile', async () => {
        const userToken = await login('alice@example.com', 'password');

        await request(app)
            .get('/api/users/a1/profile')
            .set('authorization', `Bearer ${userToken}`)
            .expect(403);
    });

    it('rejects suspending deleted users', async () => {
        const adminToken = await login('admin1@example.com', 'password');

        await request(app)
            .patch('/api/users/u4/suspended')
            .set('authorization', `Bearer ${adminToken}`)
            .send({ suspended: true })
            .expect(400);
    });
});
