import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from '../src/prisma/prisma-soft-delete.extension';

const prisma = new PrismaClient().$extends(softDeleteExtension);

async function main() {
  console.log('--- Soft Delete Verification ---');

  // 1. Create a test product
  const product = await prisma.product.create({
    data: {
      id: 999999,
      name: 'Test Soft Delete Product',
      slug: 'test-soft-delete-slug',
      price: 10,
      description: 'Testing soft delete',
      status: 'active',
      isActive: true,
    },
  });
  console.log('Created product:', product.slug);

  // 2. Soft delete the product
  console.log('Deleting product...');
  const deleted = await prisma.product.delete({
    where: { id: 999999 },
  });
  console.log('Deleted product result:', deleted.slug);

  // 3. Try to find the product
  const found = await prisma.product.findUnique({
    where: { id: 999999 },
  });
  console.log(
    'Find after delete:',
    found ? 'FOUND (FAIL)' : 'NOT FOUND (PASS)',
  );

  // 4. Check DB directly (without extension) for the hidden record
  const rawPrisma = new PrismaClient();
  const hidden = await rawPrisma.product.findUnique({
    where: { id: 999999 },
  });
  console.log(
    'Raw DB check:',
    hidden
      ? `HIDDEN RECORD EXISTS (PASS), Slug: ${hidden.slug}, DeletedAt: ${hidden.deletedAt}`
      : 'NOT IN DB (FAIL)',
  );

  // 5. Test deleteMany
  console.log('Testing deleteMany...');
  await prisma.product.create({
    data: {
      id: 888888,
      name: 'Multi 1',
      slug: 'multi-1',
      price: 10,
      description: 'd',
      status: 'active',
    },
  });
  await prisma.product.create({
    data: {
      id: 777777,
      name: 'Multi 2',
      slug: 'multi-2',
      price: 10,
      description: 'd',
      status: 'active',
    },
  });

  await prisma.product.deleteMany({
    where: { id: { in: [888888, 777777] } },
  });

  const count = await prisma.product.count({
    where: { id: { in: [888888, 777777] } },
  });
  console.log(
    'Count after deleteMany:',
    count === 0 ? '0 (PASS)' : `${count} (FAIL)`,
  );

  const rawCount = await rawPrisma.product.count({
    where: { id: { in: [888888, 777777] } },
  });
  console.log(
    'Raw Count after deleteMany:',
    rawCount === 2 ? '2 (PASS)' : `${rawCount} (FAIL)`,
  );

  // 6. Cleanup
  await rawPrisma.product.deleteMany({
    where: { id: { in: [888888, 777777] } },
  });
  await rawPrisma.$disconnect();
  console.log('--- End Verification ---');
}

main().catch(console.error);
