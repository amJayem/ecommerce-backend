import { PrismaClient } from '@prisma/client';
import { softDeleteExtension } from './src/prisma/prisma-soft-delete.extension';
import { PrismaService } from './src/prisma/prisma.service';
import { ProductService } from './src/product/product.service';

async function main() {
  console.log('--- Admin Product Visibility Diagnostic (Detailed) ---');

  const prismaService = new PrismaService();
  const productService = new ProductService(prismaService);

  try {
    console.log('Fetching products with includeDeleted: true...');
    const result = await productService.findAll({
      includeDeleted: true,
      limit: 100,
    });

    const deletedItems = result.products.filter(
      (p: any) => p.deletedAt !== null,
    );

    if (deletedItems.length > 0) {
      console.log(`Found ${deletedItems.length} soft-deleted items:`);
      deletedItems.forEach((p: any) => {
        console.log(
          ` - ID: ${p.id}, Name: ${p.name}, Status: ${p.status}, IsActive: ${p.isActive}`,
        );
      });
    } else {
      console.log('No deleted items returned.');
    }
  } catch (error) {
    console.error('Diagnostic failed:', error);
  } finally {
    await prismaService.$disconnect();
  }
}

main();
