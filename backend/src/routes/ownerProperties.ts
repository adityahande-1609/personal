import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const optionalNumber = z.preprocess(
  value => value === '' || value === null || value === undefined ? undefined : value,
  z.coerce.number().nonnegative().optional()
);

const optionalPositiveNumber = z.preprocess(
  value => value === '' || value === null || value === undefined ? undefined : value,
  z.coerce.number().positive().optional()
);

const optionalInteger = z.preprocess(
  value => value === '' || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().nonnegative().optional()
);

const propertySchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(5000),
  propertyType: z.string().trim().min(2).max(40),
  rent: z.coerce.number().positive(),
  deposit: optionalNumber,
  maintenance: optionalNumber,
  brokerage: optionalNumber,
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().positive(),
  area: optionalPositiveNumber,
  furnishing: z.preprocess(value => value === '' ? undefined : value, z.string().trim().max(40).optional()),
  address: z.string().trim().min(5).max(500),
  areaName: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/),
  floor: optionalInteger,
  totalFloors: z.preprocess(
    value => value === '' || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().positive().optional()
  ),
  propertyAge: optionalInteger,
  availableFrom: z.coerce.date(),
});

router.use(requireAuth, requireRole('OWNER'));

router.get('/', async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user!.id },
      include: { images: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ data: properties });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id },
      include: { images: { orderBy: { isPrimary: 'desc' } } },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ data: property });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = propertySchema.parse(req.body);
    const property = await prisma.property.create({
      data: {
        ...data,
        ownerId: req.user!.id,
        status: 'DRAFT',
        verificationStatus: 'PENDING'
      },
      include: { images: true }
    });
    res.status(201).json({ data: property });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = propertySchema.partial().parse(req.body);
    const existing = await prisma.property.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Property not found' });
    const property = await prisma.property.update({
      where: { id: existing.id },
      data: { ...data, verificationStatus: 'PENDING' },
      include: { images: true }
    });
    res.json({ data: property });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.property.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Property not found' });
    await prisma.property.update({ where: { id: existing.id }, data: { status: 'INACTIVE' } });
    res.status(204).send();
  } catch (error) { next(error); }
});

export default router;
