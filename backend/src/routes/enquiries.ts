import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const createSchema = z.object({ propertyId: z.string().min(1), message: z.string().trim().min(1).max(2000) });
const updateSchema = z.object({ status: z.enum(['OPEN', 'RESPONDED', 'RESOLVED']) });

router.use(requireAuth);

router.post('/', requireRole('TENANT'), async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const property = await prisma.property.findFirst({ where: { id: input.propertyId, status: 'ACTIVE', verificationStatus: 'VERIFIED' } });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (property.ownerId === req.user!.id) return res.status(400).json({ error: 'You cannot enquire about your own property' });
    const enquiry = await prisma.enquiry.create({
      data: { propertyId: property.id, tenantId: req.user!.id, ownerId: property.ownerId, message: input.message },
      include: { property: true },
    });
    await prisma.notification.create({ data: { userId: property.ownerId, title: 'New property enquiry', message: `You received a new enquiry for ${property.title}.` } });
    res.status(201).json({ data: enquiry });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const where = req.user!.role === 'OWNER' ? { ownerId: req.user!.id } : { tenantId: req.user!.id };
    const enquiries = await prisma.enquiry.findMany({ where, include: { property: true, tenant: { select: { id: true, name: true, email: true, phone: true } }, owner: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ data: enquiries });
  } catch (error) { next(error); }
});

router.put('/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { status } = updateSchema.parse(req.body);
    const existing = await prisma.enquiry.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: 'Enquiry not found' });
    const enquiry = await prisma.enquiry.update({ where: { id: existing.id }, data: { status } });
    await prisma.notification.create({ data: { userId: existing.tenantId, title: 'Enquiry updated', message: `Your enquiry for the property has been marked ${status.toLowerCase()}.` } });
    res.json({ data: enquiry });
  } catch (error) { next(error); }
});

export default router;
