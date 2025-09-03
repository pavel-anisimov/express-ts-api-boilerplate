import type {Request, Response} from 'express';

import { userService } from '../services/userService';

export async function me(req: Request, res: Response) {
  const id = req.user!.sub;
  const out = await userService.me(id);

  res.json({ data: out });
}

export async function updateMe(req: Request, res: Response) {
  const id = req.user!.sub;
  const out = await userService.updateMe(id, { name: req.body.name });

  res.json({ data: out });
}

export async function listUsers(_req: Request, res: Response) {
  const out = await userService.listAll();

  res.json({ data: out });
}

export async function assignRole(req: Request, res: Response) {
  const { userId, role } = req.body;
  const out = await userService.assignRole(userId, role);

  res.json({ data: out });
}

