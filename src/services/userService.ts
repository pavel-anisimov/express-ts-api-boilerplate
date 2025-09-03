import { userRepo } from '../repositories/inMemory';
import { HttpError } from '../utils/httpError';
import type { Role } from "../types/models";

import { eventBus } from './eventBus';

export const userService = {
  async me(id: string) {
    const user = await userRepo.findById(id);

    if (!user) {
        throw new HttpError(404, 'User not found', 'NOT_FOUND');
    }

    const { passwordHash: _passwordHash, ...safe } = user;

    return safe;
  },

  async updateMe(id: string, patch: { name?: string }) {
    const user = await userRepo.update(id, patch);
    if (!user) {
        throw new HttpError(404, 'User not found', 'NOT_FOUND');
    }
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  },

  async listAll() {
    return (await userRepo.list()).map(({ passwordHash: _passwordHash, ...safe }) => safe);
  },

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

