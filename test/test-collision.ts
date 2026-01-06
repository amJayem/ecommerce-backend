import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from '../src/prisma/prisma-soft-delete.extension';

const prisma = new PrismaClient().$extends(softDeleteExtension);

async function main() {
  console.log('--- Restoration Collision Verification ---');

  const prodIdA = Math.floor(Math.random() * 900000) + 100000;
  const prodIdB = Math.floor(Math.random() * 900000) + 100000;
  const slugBase = `coll-${Math.floor(Math.random() * 10000)}`;

  const rawPrisma = new PrismaClient();

  // 1. Create Product A
  console.log(
    `Step 1: Creating Product A (id: ${prodIdA}, slug: ${slugBase})...`,
  );
  await prisma.product.create({
    data: {
      id: prodIdA,
      name: 'Product A',
      slug: slugBase,
      price: 10,
      description: 'd',
      status: 'active',
    },
  });

  // 2. Soft delete Product A
  console.log('Step 2: Soft deleting Product A...');
  await prisma.product.delete({ where: { id: prodIdA } });

  // 3. Create Product B with same slug
  console.log(
    `Step 3: Creating Product B (id: ${prodIdB}, slug: ${slugBase})...`,
  );
  await prisma.product.create({
    data: {
      id: prodIdB,
      name: 'Product B',
      slug: slugBase,
      price: 20,
      description: 'd',
      status: 'active',
    },
  });

  // 4. Update Product A to restore it (should collide with Product B)
  console.log('Step 4: Restoring Product A (should resolve collision)...');

  const existingA: any = await (prisma.product as any).findUnique({
    where: { id: prodIdA },
    includeDeleted: true,
  });

  const updateData: any = { name: 'Restored Product A' };
  if (existingA.deletedAt) {
    updateData.deletedAt = null;
    updateData.isActive = true;

    const ensureUniqueSlug = async (baseSlug: string) => {
      let candidate = baseSlug;
      let suffix = 0;
      while (true) {
        const existing = await prisma.product.findFirst({
          where: { slug: candidate },
          select: { id: true },
        });
        if (!existing) return candidate;
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
      }
    };

    const restoredSlug = existingA.slug.replace(/-deleted-\d+$/, '');
    updateData.slug = await ensureUniqueSlug(restoredSlug);
  }

  await prisma.product.update({
    where: { id: prodIdA },
    data: updateData,
  });

  // 5. Verify both exist and have unique slugs
  const restoredA = await prisma.product.findUnique({ where: { id: prodIdA } });
  const activeB = await prisma.product.findUnique({ where: { id: prodIdB } });

  console.log('Product A Restored Slug:', restoredA?.slug);
  console.log('Product B Active Slug:', activeB?.slug);

  if (
    restoredA?.slug !== activeB?.slug &&
    restoredA?.slug.startsWith(slugBase)
  ) {
    console.log('Collision Handling: PASS');
  } else {
    console.log('Collision Handling: FAIL');
  }

  // 6. Cleanup
  await rawPrisma.product.deleteMany({
    where: { id: { in: [prodIdA, prodIdB] } },
  });
  await rawPrisma.$disconnect();
  console.log('--- End Verification ---');
}

main().catch(console.error);
