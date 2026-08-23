import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

const querySchema = z
  .object({
    city: z.string().trim().max(100).optional(),
    area: z.string().trim().max(100).optional(),
    minRent: z.coerce.number().finite().nonnegative().optional(),
    maxRent: z.coerce.number().finite().nonnegative().optional(),
    bedrooms: z.coerce.number().int().positive().optional(),
    propertyType: z.string().trim().max(40).optional(),
    furnishing: z.string().trim().max(40).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .superRefine((query, ctx) => {
    if (query.minRent !== undefined && query.maxRent !== undefined && query.minRent > query.maxRent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minRent'],
        message: 'minRent cannot be greater than maxRent',
      });
    }
  });

router.get('/', async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);
    const where = {
      status: 'ACTIVE' as const,
      verificationStatus: 'VERIFIED' as const,
      ...(q.city ? { city: { contains: q.city, mode: 'insensitive' as const } } : {}),
      ...(q.area ? { areaName: { contains: q.area, mode: 'insensitive' as const } } : {}),
      ...(q.minRent !== undefined || q.maxRent !== undefined
        ? {
            rent: {
              ...(q.minRent !== undefined ? { gte: q.minRent } : {}),
              ...(q.maxRent !== undefined ? { lte: q.maxRent } : {}),
            },
          }
        : {}),
      ...(q.bedrooms !== undefined ? { bedrooms: q.bedrooms } : {}),
      ...(q.propertyType ? { propertyType: q.propertyType } : {}),
      ...(q.furnishing ? { furnishing: q.furnishing } : {}),
    };

    const [properties, total] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        include: { images: { orderBy: { isPrimary: 'desc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.property.count({ where }),
    ]);

    res.json({
      data: properties,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { images: { orderBy: { isPrimary: 'desc' } } },
    });

    if (!property || property.status !== 'ACTIVE' || property.verificationStatus !== 'VERIFIED') {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({ data: property });
  } catch (error) {
    next(error);
  }
});

export default router;
