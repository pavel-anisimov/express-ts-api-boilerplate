import fs from 'node:fs';
import path from 'node:path';

import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

import type { Role, User, UserStatus } from '../types/models';

const users: User[] = [];

/**
 * Load mock data from mock-data/users.json
 * The format of each element is:
 * {
 *   email: string; password: string; name: string;
 *   roles: Role[]; status: UserStatus; emailVerified: boolean;
 * }
 * The password in JSON is stored as plaintext ONLY for mocks - we hash it when loading.
 */
function seedFromMock() {
    try {
        const p = path.join(process.cwd(), 'mock-data', 'users.json');
        if (!fs.existsSync(p)) return;

        const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as Array<{
            email: string;
            password: string;
            name: string;
            roles: Role[];
            status: UserStatus;
            emailVerified: boolean;
        }>;

        for (const m of raw) {
            const passwordHash = bcrypt.hashSync(m.password, 10);
            users.push({
                id: uuid(),
                email: m.email,
                passwordHash,
                name: m.name,
                roles: m.roles,
                status: m.status,
                emailVerified: m.emailVerified,
                createdAt: new Date().toISOString(),
            });
        }
    } catch (error) {
        // in mocks you can simply log into the console
        console.error('Mock seed error:', error);
    }
}
seedFromMock();

export const userRepo = {
    async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        const user: User = { id: uuid(), createdAt: new Date().toISOString(), ...data };

        users.push(user);

        return user;
    },

    async findByEmail(email: string): Promise<User | null> {
        return users.find((user) => user.email === email) ?? null;
    },

    async findById(id: string): Promise<User | null> {
        return users.find((user) => user.id === id) ?? null;
    },

    async update(id: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
        const user = await this.findById(id);
        if (!user) {
            return null;
        }

        Object.assign(user, patch);

        return user;
    },

    async list(): Promise<User[]> {
        return users;
    },
};
