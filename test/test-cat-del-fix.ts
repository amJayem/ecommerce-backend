import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './src/prisma/prisma-soft-delete.extension';

const prisma = new PrismaClient().$extends(softDeleteExtension);

async function main() {
  console.log('--- Category Deletion Constraint Verification ---');

  const catId = Math.floor(Math.random() * 900000) + 100000;
  const prodId = Math.floor(Math.random() * 900000) + 100000;
  const rawPrisma = new PrismaClient();

  try {
    // 1. Create Category
    console.log(`Step 1: Creating Category (id: ${catId})...`);
    await prisma.category.create({
      data: {
        id: catId,
        name: 'Constraint Test Cat',
        slug: `cat-const-${catId}`,
        description: 'test description',
        isActive: true,
      },
    });

    // 2. Create Product in Category
    console.log(`Step 2: Creating Product (id: ${prodId}) in Category...`);
    await prisma.product.create({
      data: {
        id: prodId,
        name: 'Constraint Test Prod',
        slug: `prod-const-${prodId}`,
        price: 10,
        description: 'd',
        status: 'active',
        categoryId: catId,
      },
    });

    // 3. Soft delete Product
    console.log('Step 3: Soft deleting Product...');
    await prisma.product.delete({ where: { id: prodId } });

    // 4. Check category product count (should be 0 because product is deleted)
    console.log('Step 4: Checking category product count via findUnique...');
    const cat: any = await (prisma.category as any).findUnique({
      where: { id: catId },
      include: {
        _count: { select: { products: true } },
      },
    });
    console.log('Count of products:', cat._count.products);

    if (cat._count.products === 0) {
      console.log('Product Count Filtering: PASS');
    } else {
      console.log('Product Count Filtering: FAIL (Still see deleted product)');
    }

    // 5. Attempt to delete Category (Simulating CategoryService.remove logic)
    console.log('Step 5: Attempting to delete Category...');
    if (cat._count.products > 0) {
      console.log('Blocked by business logic: FAIL');
    } else {
      await prisma.category.delete({ where: { id: catId } });
      console.log('Category deleted: PASS');
    }

    // 6. Verify Category is soft-deleted
    const deletedCat: any = await (prisma.category as any).findUnique({
      where: { id: catId },
      includeDeleted: true,
    });
    console.log(
      'Category soft-deleted status:',
      deletedCat.deletedAt ? 'YES (PASS)' : 'NO (FAIL)',
    );
  } catch (error) {
    console.error('FAILED with error:', error);
  } finally {
    // Cleanup
    await rawPrisma.product.deleteMany({ where: { id: prodId } });
    await rawPrisma.category.deleteMany({ where: { id: catId } });
    await rawPrisma.$disconnect();
    console.log('--- End Verification ---');
  }
}

main();
