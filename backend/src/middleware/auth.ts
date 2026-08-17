import type { NextFunction, Request, Response } from 'express';
import { authenticateToken } from '../services/auth.js';
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request { user?: { id: string; name: string; email: string; phone: string | null; role: Role; isVerified: boolean } }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authenticateToken(req.cookies?.rental_session);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    return next();
  };
}
