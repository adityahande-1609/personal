import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();
const querySchema = z.object({
  city: z.string().trim().max(100).optional(),
  area: z.string().trim().max(100).optional(),
  minRent: z.coerce.number().nonnegative().optional(),
  maxRent: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().positive().optional(),
  propertyType: z.string().trim().max(40).optional(),
  furnishing: z.string().trim().max(40).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);
    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        ...(q.city ? { city: { contains: q.city, mode: 'insensitive' } } : {}),
        ...(q.area ? { areaName: { contains: q.area, mode: 'insensitive' } } : {}),
        ...(q.minRent !== undefined || q.maxRent !== undefined ? { rent: { ...(q.minRent !== undefined ? { gte: q.minRent } : {}), ...(q.maxRent !== undefined ? { lte: q.maxRent } : {}) } } : {}),
        ...(q.bedrooms !== undefined ? { bedrooms: q.bedrooms } : {}),
        ...(q.propertyType ? { propertyType: q.propertyType } : {}),
        ...(q.furnishing ? { furnishing: q.furnishing } : {}),
      },
      include: { images: { orderBy: { isPrimary: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: properties });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { images: { orderBy: { isPrimary: 'desc' } } },
    });
    if (!property || property.status !== 'ACTIVE') return res.status(404).json({ error: 'Property not found' });
    res.json({ data: property });
  } catch (error) { next(error); }
});

export default router;
