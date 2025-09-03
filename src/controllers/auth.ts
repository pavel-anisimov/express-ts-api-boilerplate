import type {Request, Response} from 'express';

import { authService } from '../services/authService';
import { tokenRevocation } from '../services/tokenRevocation';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  const out = await authService.register(email, password, name);

  res.status(201).json({ data: out });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const out = await authService.login(email, password);

  res.json({ data: out });
}

export async function logout(req: Request, res: Response) {
    // requires requireAuth
    const jti = req.tokenJti ?? null;
    const exp = req.tokenExp ?? null;

    if (!jti)  {
        return res.status(400).json({ error: { code: 'NO_JTI', message: 'No token id' } });
    }

    tokenRevocation.revoke(jti, exp ?? undefined);
    res.status(204).send();
}