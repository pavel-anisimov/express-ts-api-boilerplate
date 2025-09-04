import { userRepo } from '../repositories/inMemory';
import { HttpError } from '../utils/httpError';
import type { Role } from "../types/models";

import { eventBus } from './eventBus';

/**
 * Provides user-related operations, including fetching user details, updating user information,
 * listing all users, and assigning roles to users. This service interacts with the user repository
 * and manages sensitive information securely.
 */
export const userService = {
    /**
     * Retrieves a user by their ID and returns a safe version of the user object without sensitive information.
     *
     * @param {string} id - The ID of the user to be retrieved.
     * @return {Promise<Object>} A promise that resolves to the safe user object excluding sensitive information.
     * @throws {HttpError} Throws an error with status 404 if the user is not found.
     */
    async me(id: string) {
    const user = await userRepo.findById(id);

    if (!user) {
        throw new HttpError(404, 'User not found', 'NOT_FOUND');
    }

    const { passwordHash: _passwordHash, ...safe } = user;

    return safe;
  },

    /**
     * Updates the current user's data based on the provided patch object.
     *
     * @param {string} id - The unique identifier of the user to be updated.
     * @param {{name?: string}} patch - An object containing the fields to be updated. Optional fields include `name`.
     * @return {Promise<Object>} A promise that resolves with the updated user object, excluding password-related fields.
     * @throws {HttpError} Throws an error if the user is not found.
     */
  async updateMe(id: string, patch: { name?: string }) {
    const user = await userRepo.update(id, patch);
    if (!user) {
        throw new HttpError(404, 'User not found', 'NOT_FOUND');
    }
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  },

    /**
     * Retrieves a list of all users with sensitive information removed.
     *
     * Fetches user data from the repository and filters out the `passwordHash`
     * field from the returned objects, ensuring sensitive information is excluded.
     *
     * @return {Promise<Array<Object>>} A promise that resolves to an array of user objects
     *                                  with sensitive fields removed.
     */
  async listAll() {
    return (await userRepo.list()).map(({ passwordHash: _passwordHash, ...safe }) => safe);
  },

    /**
     * Assigns a role to a user if the user exists and does not already have the role.
     *
     * @param {string} userId - The unique identifier of the user to whom the role will be assigned.
     * @param {string} role - The role to be assigned to the user.
     * @return {Promise<Object>} A promise that resolves to an object containing the updated user details excluding sensitive information, or throws an error if the user is not found.
     */
  async assignRole(userId: string, role: string) {
    const user = await userRepo.findById(userId);
    if (!user) {
        throw new HttpError(404, 'User not found', 'NOT_FOUND');
    }
    if (!user.roles.includes(<Role>role)) {
        user.roles.push(role as never);
    }

    const { passwordHash: _passwordHash, ...safe } = user;
    eventBus.publish('rbac.role_assigned', { userId, role });

    return safe;
  },
};

