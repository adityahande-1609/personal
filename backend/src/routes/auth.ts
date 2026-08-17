import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { clearSession, createSession, hashPassword, verifyPassword } from '../services/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  role: z.enum(['TENANT', 'OWNER']).default('TENANT'),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) });

const publicUser = (user: { id: string; name: string; email: string; phone: string | null; role: string; isVerified: boolean }) => ({
  id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, isVerified: user.isVerified,
});

router.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({ data: { name: input.name, email: input.email, phone: input.phone, passwordHash, role: input.role } });
    await createSession(user.id, res);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid registration details', details: error.flatten().fieldErrors });
    if (error instanceof Error && error.message.includes('Unique constraint')) return res.status(409).json({ error: 'An account with that email already exists' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
    await createSession(user.id, res);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid login details' });
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try { await clearSession(req.cookies?.rental_session, res); return res.status(204).send(); } catch (error) { return next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user!) }));

export default router;
