import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import { requirePermission } from '../middlewares/permissions';
import { validate } from '../middlewares/validate';
import * as ctrl from '../controllers/users';

import { UpdateProfileDto, AssignRoleDto } from './schemas';

export const usersRouter = Router();

usersRouter.get('/me', requireAuth, ctrl.me);
usersRouter.patch('/me', requireAuth, validate(UpdateProfileDto), ctrl.updateMe);

usersRouter.get('/', requireAuth, requirePermission('users.read'), ctrl.listUsers);
usersRouter.post('/assign-role', requireAuth, requirePermission('users.assignRole'), validate(AssignRoleDto), ctrl.assignRole);

