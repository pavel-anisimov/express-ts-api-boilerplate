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
        if (!fs.existsSync(p)) {
            return;
        }

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

/**
 * Repository for managing user data.
 *
 * Provides methods to create, retrieve, update, and list user entities.
 */
export const userRepo = {
    /**
     * Creates a new user by generating a unique identifier and adding a creation timestamp.
     *
     * @param {Omit<User, 'id' | 'createdAt'>} data - The user's data excluding the 'id' and 'createdAt' properties.
     * @return {Promise<User>} A promise that resolves to the newly created user object.
     */
    async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        const user: User = { id: uuid(), createdAt: new Date().toISOString(), ...data };
        users.push(user);

        return user;
    },

    /**
     * Finds a user by their email address.
     *
     * @param {string} email - The email address of the user to find.
     * @return {Promise<User|null>} A promise that resolves to the user object if found, otherwise null.
     */
    async findByEmail(email: string): Promise<User | null> {
        return users.find((user) => user.email === email) ?? null;
    },

    /**
     * Retrieves a user by their unique identifier.
     *
     * @param {string} id - The unique identifier of the user to be retrieved.
     * @return {Promise<User | null>} A promise that resolves to the user object if found, or null if no user matches the provided identifier.
     */
    async findById(id: string): Promise<User | null> {
        return users.find((user) => user.id === id) ?? null;
    },

    /**
     * Updates a user's information based on the provided id and patch object.
     *
     * @param {string} id - The unique identifier of the user to be updated.
     * @param {Partial<Omit<User, 'id' | 'createdAt'>>} patch - An object containing the updated fields of the user, excluding 'id' and 'createdAt'.
     * @return {Promise<User | null>} - A promise that resolves to the updated user object if the user is found, otherwise null.
     */
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
