import { PrismaClient, Prisma, Role, PropertyStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Phase3Test123';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const owner = await prisma.user.upsert({
    where: { email: 'phase3.owner@example.com' },
    update: {
      name: 'Phase 3 Owner',
      phone: '9876543210',
      passwordHash,
      role: Role.OWNER,
      isVerified: true,
    },
    create: {
      name: 'Phase 3 Owner',
      email: 'phase3.owner@example.com',
      phone: '9876543210',
      passwordHash,
      role: Role.OWNER,
      isVerified: true,
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: 'phase3.tenant@example.com' },
    update: {
      name: 'Phase 3 Tenant',
      phone: '9876501234',
      passwordHash,
      role: Role.TENANT,
      isVerified: true,
    },
    create: {
      name: 'Phase 3 Tenant',
      email: 'phase3.tenant@example.com',
      phone: '9876501234',
      passwordHash,
      role: Role.TENANT,
      isVerified: true,
    },
  });

  const properties = [
    {
      id: 'seed-property-1',
      title: 'Modern 2 BHK in Baner',
      description: 'Bright, furnished 2 BHK apartment close to offices, cafes, and public transport.',
      propertyType: 'APARTMENT',
      rent: new Prisma.Decimal('28000'),
      deposit: new Prisma.Decimal('84000'),
      maintenance: new Prisma.Decimal('2500'),
      brokerage: new Prisma.Decimal('0'),
      bedrooms: 2,
      bathrooms: 2,
      area: new Prisma.Decimal('1050'),
      furnishing: 'FURNISHED',
      address: 'Baner Road',
      areaName: 'Baner',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      floor: 5,
      totalFloors: 12,
      propertyAge: 4,
      availableFrom: new Date('2026-09-01T00:00:00.000Z'),
    },
    {
      id: 'seed-property-2',
      title: 'Spacious 1 BHK in Kothrud',
      description: 'Well-maintained 1 BHK with excellent connectivity and nearby everyday amenities.',
      propertyType: 'APARTMENT',
      rent: new Prisma.Decimal('18000'),
      deposit: new Prisma.Decimal('54000'),
      maintenance: new Prisma.Decimal('1800'),
      brokerage: new Prisma.Decimal('0'),
      bedrooms: 1,
      bathrooms: 1,
      area: new Prisma.Decimal('650'),
      furnishing: 'SEMI_FURNISHED',
      address: 'Paud Road',
      areaName: 'Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      floor: 3,
      totalFloors: 8,
      propertyAge: 7,
      availableFrom: new Date('2026-09-15T00:00:00.000Z'),
    },
    {
      id: 'seed-property-3',
      title: 'Premium 3 BHK in Wakad',
      description: 'Large family apartment with modern amenities and easy access to Hinjawadi.',
      propertyType: 'APARTMENT',
      rent: new Prisma.Decimal('42000'),
      deposit: new Prisma.Decimal('126000'),
      maintenance: new Prisma.Decimal('3500'),
      brokerage: new Prisma.Decimal('0'),
      bedrooms: 3,
      bathrooms: 3,
      area: new Prisma.Decimal('1550'),
      furnishing: 'FURNISHED',
      address: 'Datta Mandir Road',
      areaName: 'Wakad',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      floor: 7,
      totalFloors: 15,
      propertyAge: 2,
      availableFrom: new Date('2026-10-01T00:00:00.000Z'),
    },
  ];

  for (const property of properties) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: {
        ...property,
        ownerId: owner.id,
        status: PropertyStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      create: {
        ...property,
        ownerId: owner.id,
        status: PropertyStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
  }

  const images = [
    ['seed-image-1', 'seed-property-1', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'],
    ['seed-image-2', 'seed-property-2', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'],
    ['seed-image-3', 'seed-property-3', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d'],
  ];

  for (const [id, propertyId, imageUrl] of images) {
    await prisma.propertyImage.upsert({
      where: { id },
      update: { propertyId, imageUrl, isPrimary: true },
      create: { id, propertyId, imageUrl, isPrimary: true },
    });
  }

  console.log('Phase 3 seed complete.');
  console.log(`Owner: ${owner.email}`);
  console.log(`Tenant: ${tenant.email}`);
  console.log(`Test password: ${PASSWORD}`);
  console.log(`Seeded properties: ${properties.length}`);
}

main()
  .catch((error) => {
    console.error('Phase 3 seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
