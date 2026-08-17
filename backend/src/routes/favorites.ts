import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const propertySchema = z.object({ propertyId: z.string().min(1) });

router.use(requireAuth, requireRole('TENANT'));

router.get('/', async (req, res, next) => {
  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId: req.user!.id },
      include: { property: { include: { images: { orderBy: { isPrimary: 'desc' } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: favourites });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { propertyId } = propertySchema.parse(req.body);
    const property = await prisma.property.findFirst({ where: { id: propertyId, status: 'ACTIVE', verificationStatus: 'VERIFIED' } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    const favourite = await prisma.favourite.upsert({
      where: { userId_propertyId: { userId: req.user!.id, propertyId } },
      update: {},
      create: { userId: req.user!.id, propertyId },
    });
    res.status(201).json({ data: favourite });
  } catch (error) { next(error); }
});

router.delete('/:propertyId', async (req, res, next) => {
  try {
    const result = await prisma.favourite.deleteMany({ where: { userId: req.user!.id, propertyId: req.params.propertyId } });
    if (!result.count) return res.status(404).json({ error: 'Favourite not found' });
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
