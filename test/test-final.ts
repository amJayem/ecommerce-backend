import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from '../src/prisma/prisma-soft-delete.extension';

const prisma = new PrismaClient().$extends(softDeleteExtension);

async function main() {
  console.log('--- Final Admin Visibility & Restore Verification ---');

  const prodId = 999222;
  const rawPrisma = new PrismaClient();

  // 1. Create a product
  console.log('Step 1: Creating product...');
  await prisma.product.create({
    data: {
      id: prodId,
      name: 'Admin Test',
      slug: 'admin-test',
      price: 10,
      description: 'd',
      status: 'active',
    },
  });

  // 2. Soft delete it
  console.log('Step 2: Soft deleting product...');
  await prisma.product.delete({ where: { id: prodId } });

  // 3. Verify it is visible with includeDeleted: true
  console.log('Step 3: Checking visibility for admins...');
  const visibleToAdmin = await (prisma.product as any).findUnique({
    where: { id: prodId },
    includeDeleted: true,
  });
  console.log(
    'Visible to Admin (includeDeleted: true):',
    visibleToAdmin ? 'YES (PASS)' : 'NO (FAIL)',
  );

  const hiddenFromShopper = await prisma.product.findUnique({
    where: { id: prodId },
  });
  console.log(
    'Hidden from Shopper (default):',
    hiddenFromShopper === null ? 'YES (PASS)' : 'NO (FAIL)',
  );

  // 4. Update the deleted product to restore it
  console.log('Step 4: Updating the deleted product to Restore it...');
  // We simulate what the service.update(id, data) does
  const existing = await (prisma.product as any).findUnique({
    where: { id: prodId },
    includeDeleted: true,
  });
  const updateData: any = { name: 'Restored Admin Test' };

  if (existing.deletedAt) {
    updateData.deletedAt = null;
    updateData.isActive = true;
    updateData.slug = existing.slug.replace(/-deleted-\d+$/, '');
  }

  await prisma.product.update({
    where: { id: prodId },
    data: updateData,
  });

  // 5. Verify it is fully restored
  const restored = await prisma.product.findUnique({ where: { id: prodId } });
  console.log(
    'Restored and Visible to all:',
    restored ? 'YES (PASS)' : 'NO (FAIL)',
  );
  console.log('Restored Name:', restored?.name);
  console.log('Restored Slug:', restored?.slug);

  // 6. Cleanup
  await rawPrisma.product.delete({ where: { id: prodId } });
  await rawPrisma.$disconnect();
  console.log('--- End Verification ---');
}

main().catch(console.error);
