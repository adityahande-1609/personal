import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { deletePrivateFile, privateFilePath, savePrivateFile } from '../services/storage.js';
import fs from 'node:fs/promises';

const router = Router();
router.use(requireAuth);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowed = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['application/pdf', 'pdf']]);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE, files: 1 }, fileFilter: (_req, file, cb) => cb(null, allowed.has(file.mimetype)) });
const typeSchema = z.enum(['IDENTITY_PROOF', 'ADDRESS_PROOF', 'OWNERSHIP_PROOF', 'PHOTOGRAPH', 'OTHER']);
async function canAccessAgreement(id:string,userId:string){return prisma.agreement.findFirst({where:{id,OR:[{ownerId:userId},{tenantId:userId}]},select:{id:true}})}
router.get('/:agreementId',async(req,res,next)=>{try{const agreement=await canAccessAgreement(String(req.params.agreementId),req.user!.id);if(!agreement)return res.status(404).json({error:'Agreement not found'});const documents=await prisma.document.findMany({where:{agreementId:agreement.id},select:{id:true,documentType:true,status:true,createdAt:true,updatedAt:true},orderBy:{createdAt:'desc'}});return res.json({data:documents})}catch(error){return next(error)}});
router.get('/:agreementId/:documentId/file',async(req,res,next)=>{try{const agreement=await canAccessAgreement(String(req.params.agreementId),req.user!.id);if(!agreement)return res.status(404).json({error:'Agreement not found'});const document=await prisma.document.findFirst({where:{id:String(req.params.documentId),agreementId:agreement.id},select:{storageKey:true,documentType:true}});if(!document?.storageKey)return res.status(404).json({error:'Document not found'});const filePath=privateFilePath(document.storageKey);await fs.access(filePath);return res.sendFile(filePath)}catch(error){if((error as NodeJS.ErrnoException)?.code==='ENOENT')return res.status(404).json({error:'Document file not found'});return next(error)}});
router.post('/:agreementId',upload.single('file'),async(req,res,next)=>{let storageKey:string|undefined;try{const agreement=await canAccessAgreement(String(req.params.agreementId),req.user!.id);if(!agreement)return res.status(404).json({error:'Agreement not found'});if(!req.file)return res.status(400).json({error:'A PDF, JPEG, or PNG file is required'});const documentType=typeSchema.parse(req.body.documentType);const extension=allowed.get(req.file.mimetype)!;storageKey=await savePrivateFile({buffer:req.file.buffer,extension,userId:req.user!.id,agreementId:agreement.id});const document=await prisma.document.create({data:{userId:req.user!.id,agreementId:agreement.id,documentType,storageKey,status:'PENDING'},select:{id:true,documentType:true,status:true,createdAt:true}});return res.status(201).json({data:document})}catch(error){if(storageKey)await deletePrivateFile(storageKey).catch(()=>undefined);if(error instanceof multer.MulterError)return res.status(400).json({error:error.code==='LIMIT_FILE_SIZE'?'File exceeds the 5 MB limit':'Invalid file upload'});return next(error)}});
router.delete('/:agreementId/:documentId',async(req,res,next)=>{try{const agreement=await canAccessAgreement(String(req.params.agreementId),req.user!.id);if(!agreement)return res.status(404).json({error:'Agreement not found'});const document=await prisma.document.findFirst({where:{id:String(req.params.documentId),agreementId:agreement.id,userId:req.user!.id}});if(!document)return res.status(404).json({error:'Document not found'});await prisma.document.delete({where:{id:document.id}});if(document.storageKey)await deletePrivateFile(document.storageKey).catch(()=>undefined);return res.status(204).send()}catch(error){return next(error)}});
export default router;
