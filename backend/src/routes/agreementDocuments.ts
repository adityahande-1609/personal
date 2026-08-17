import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const schema = z.object({
  documentType: z.enum(['IDENTITY_PROOF', 'ADDRESS_PROOF', 'OWNERSHIP_PROOF', 'PHOTOGRAPH', 'OTHER']),
  storageKey: z.string().trim().min(1).max(500),
  fileUrl: z.string().trim().url().max(2000).optional()
});

async function canAccessAgreement(id: string, userId: string) {
  return prisma.agreement.findFirst({ where: { id, OR: [{ ownerId: userId }, { tenantId: userId }] }, select: { id: true, ownerId: true, tenantId: true } });
}

router.get('/:agreementId', async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(String(req.params.agreementId), req.user!.id);
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });
    const documents = await prisma.document.findMany({ where: { agreementId: agreement.id }, select: { id: true, documentType: true, status: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: 'desc' } });
    return res.json({ data: documents });
  } catch (error) { return next(error); }
});

router.post('/:agreementId', async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(String(req.params.agreementId), req.user!.id);
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });
    const input = schema.parse(req.body);
    const document = await prisma.document.create({ data: { userId: req.user!.id, agreementId: agreement.id, documentType: input.documentType, storageKey: input.storageKey, fileUrl: input.fileUrl, status: 'PENDING' }, select: { id: true, documentType: true, status: true, createdAt: true } });
    return res.status(201).json({ data: document });
  } catch (error) { return next(error); }
});

router.delete('/:agreementId/:documentId', async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(String(req.params.agreementId), req.user!.id);
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });
    const document = await prisma.document.findFirst({ where: { id: String(req.params.documentId), agreementId: agreement.id, userId: req.user!.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    await prisma.document.delete({ where: { id: document.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export default router;
