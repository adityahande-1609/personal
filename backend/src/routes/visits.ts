import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  propertyId: z.string().min(1),
  requestedDate: z.coerce.date(),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  message: z.string().trim().max(1000).optional(),
});

const updateSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'RESCHEDULE_REQUESTED', 'COMPLETED', 'CANCELLED']),
  requestedDate: z.coerce.date().optional(),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
}).refine((data) => data.status !== 'RESCHEDULE_REQUESTED' || (data.requestedDate && data.requestedTime), {
  message: 'A new date and time are required when requesting a reschedule',
});

router.use(requireAuth);

router.post('/', requireRole('TENANT'), async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, status: 'ACTIVE', verificationStatus: 'VERIFIED' },
      select: { id: true, ownerId: true },
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (input.requestedDate.getTime() < Date.now()) return res.status(400).json({ error: 'Visit date must be in the future' });

    const visit = await prisma.$transaction(async (tx) => {
      const created = await tx.visit.create({
        data: {
          propertyId: property.id,
          tenantId: req.user!.id,
          ownerId: property.ownerId,
          requestedDate: input.requestedDate,
          requestedTime: input.requestedTime,
          message: input.message,
        },
      });
      await tx.notification.create({
        data: {
          userId: property.ownerId,
          title: 'New visit request',
          message: `A tenant requested a property visit for ${input.requestedDate.toISOString().slice(0, 10)} at ${input.requestedTime}.`,
        },
      });
      return created;
    });
    return res.status(201).json(visit);
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const where = req.user!.role === 'OWNER' ? { ownerId: req.user!.id } : { tenantId: req.user!.id };
    const visits = await prisma.visit.findMany({
      where,
      include: { property: { select: { id: true, title: true, city: true, areaName: true } } },
      orderBy: [{ requestedDate: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json(visits);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body);
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    const ownerAction = req.user!.role === 'OWNER' && visit.ownerId === req.user!.id;
    const tenantAction = req.user!.role === 'TENANT' && visit.tenantId === req.user!.id;
    if (!ownerAction && !tenantAction) return res.status(403).json({ error: 'You cannot modify this visit' });

    if (tenantAction && !['CANCELLED'].includes(input.status)) {
      return res.status(403).json({ error: 'Tenants can only cancel their visit requests' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.visit.update({
        where: { id: visit.id },
        data: {
          status: input.status,
          requestedDate: input.requestedDate,
          requestedTime: input.requestedTime,
        },
      });
      const recipientId = req.user!.id === visit.ownerId ? visit.tenantId : visit.ownerId;
      await tx.notification.create({
        data: {
          userId: recipientId,
          title: 'Visit request updated',
          message: `Your visit request status is now ${input.status.replaceAll('_', ' ').toLowerCase()}.`,
        },
      });
      return result;
    });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;
