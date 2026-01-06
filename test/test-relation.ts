import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from '../src/prisma/prisma-soft-delete.extension';

const prisma = new PrismaClient().$extends(softDeleteExtension);

async function main() {
  console.log('--- Soft Delete Relation Verification ---');

  // 1. Create a category and product
  const cat = await prisma.category.create({
    data: {
      id: 999,
      name: 'Deletable Cat',
      slug: 'del-cat',
      description: 'desc',
    },
  });
  const prod = await prisma.product.create({
    data: {
      id: 9999,
      name: 'Related Prod',
      slug: 'rel-prod',
      categoryId: 999,
      price: 10,
      description: 'desc',
      status: 'active',
    },
  });

  console.log('Initial State: Product has Category ID:', prod.categoryId);

  // 2. Soft delete the category
  console.log('Deleting category...');
  await prisma.category.delete({ where: { id: 999 } });

  // 3. Fetch product with include
  console.log('Fetching product with category include...');
  const prodWithCat = await prisma.product.findUnique({
    where: { id: 9999 },
    include: { category: true },
  });

  console.log(
    'API Result - Category is null?',
    prodWithCat?.category === null
      ? 'YES (PASS)'
      : 'NO (FAIL - Category still visible)',
  );

  // 4. Cleanup
  const rawPrisma = new PrismaClient();
  await rawPrisma.product.delete({ where: { id: 9999 } });
  await rawPrisma.category.delete({ where: { id: 999 } });
  await rawPrisma.$disconnect();
  console.log('--- End Verification ---');
}

main().catch(console.error);
