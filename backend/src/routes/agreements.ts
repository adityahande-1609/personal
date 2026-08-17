import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const agreementSchema = z.object({
  propertyId: z.string().min(1),
  ownerId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  rent: z.coerce.number().positive(),
  deposit: z.coerce.number().nonnegative().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentDueDate: z.coerce.number().int().min(1).max(31),
  noticePeriod: z.string().trim().max(500).optional(),
  maintenanceResponsibility: z.string().trim().max(1000).optional(),
  utilities: z.string().trim().max(1000).optional(),
  pets: z.string().trim().max(500).optional(),
  subletting: z.string().trim().max(500).optional(),
  additionalTerms: z.string().trim().max(5000).optional()
}).refine(value => value.endDate > value.startDate, { message: 'End date must be after start date', path: ['endDate'] });

const updateSchema = agreementSchema.partial().omit({ propertyId: true, ownerId: true, tenantId: true });

async function accessibleAgreement(id: string, userId: string) {
  return prisma.agreement.findFirst({ where: { id, OR: [{ ownerId: userId }, { tenantId: userId }] }, include: { property: true, owner: { select: { id: true, name: true, email: true, phone: true } }, tenant: { select: { id: true, name: true, email: true, phone: true } }, documents: true } });
}

router.post('/', async (req, res, next) => {
  try {
    const input = agreementSchema.parse(req.body);
    if (!['OWNER', 'TENANT'].includes(req.user!.role)) return res.status(403).json({ error: 'Only owners and tenants can create agreements' });
    const property = await prisma.property.findFirst({ where: { id: input.propertyId, status: 'ACTIVE' } });
    if (!property) return res.status(404).json({ error: 'Active property not found' });

    const ownerId = req.user!.role === 'OWNER' ? req.user!.id : property.ownerId;
    const tenantId = req.user!.role === 'TENANT' ? req.user!.id : input.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant is required when an owner starts an agreement' });
    if (property.ownerId !== ownerId) return res.status(403).json({ error: 'The selected property does not belong to this owner' });

    const tenant = await prisma.user.findUnique({ where: { id: tenantId }, select: { id: true, role: true } });
    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, role: true } });
    if (!owner || owner.role !== 'OWNER' || !tenant || tenant.role !== 'TENANT') return res.status(400).json({ error: 'Invalid agreement participants' });

    const agreement = await prisma.agreement.create({ data: { propertyId: property.id, ownerId, tenantId, rent: input.rent, deposit: input.deposit, startDate: input.startDate, endDate: input.endDate, rentDueDate: input.rentDueDate, noticePeriod: input.noticePeriod, maintenanceResponsibility: input.maintenanceResponsibility, utilities: input.utilities, pets: input.pets, subletting: input.subletting, additionalTerms: input.additionalTerms, status: 'DRAFT' }, include: { property: true } });
    await prisma.notification.create({ data: { userId: req.user!.id === ownerId ? tenantId : ownerId, title: 'Rental agreement started', message: `An agreement has been started for ${property.title}.` } });
    return res.status(201).json({ data: agreement });
  } catch (error) { return next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    if (!['OWNER', 'TENANT'].includes(req.user!.role)) return res.status(403).json({ error: 'Forbidden' });
    const agreements = await prisma.agreement.findMany({ where: { OR: [{ ownerId: req.user!.id }, { tenantId: req.user!.id }] }, include: { property: true }, orderBy: { updatedAt: 'desc' } });
    return res.json({ data: agreements });
  } catch (error) { return next(error); }
});

router.get('/:id', async (req, res, next) => {
  try { const agreement = await accessibleAgreement(String(req.params.id), req.user!.id); if (!agreement) return res.status(404).json({ error: 'Agreement not found' }); return res.json({ data: agreement }); }
  catch (error) { return next(error); }
});

router.put('/:id', async (req, res, next) => {
  try { const existing = await accessibleAgreement(String(req.params.id), req.user!.id); if (!existing) return res.status(404).json({ error: 'Agreement not found' }); if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') return res.status(409).json({ error: 'This agreement can no longer be edited' }); const input = updateSchema.parse(req.body); const agreement = await prisma.agreement.update({ where: { id: existing.id }, data: input }); return res.json({ data: agreement }); }
  catch (error) { return next(error); }
});

router.post('/:id/submit', async (req, res, next) => {
  try { const existing = await accessibleAgreement(String(req.params.id), req.user!.id); if (!existing) return res.status(404).json({ error: 'Agreement not found' }); if (existing.status !== 'DRAFT') return res.status(409).json({ error: 'Only draft agreements can be submitted' }); const agreement = await prisma.agreement.update({ where: { id: existing.id }, data: { status: 'SUBMITTED' } }); const recipient = req.user!.id === existing.ownerId ? existing.tenantId : existing.ownerId; await prisma.notification.create({ data: { userId: recipient, title: 'Agreement ready for review', message: `The rental agreement for ${existing.property.title} was submitted for review.` } }); return res.json({ data: agreement }); }
  catch (error) { return next(error); }
});

export default router;
