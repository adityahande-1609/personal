import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    return res.json(notifications);
  } catch (error) { return next(error); }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    return res.json(await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } }));
  } catch (error) { return next(error); }
});

router.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export default router;
