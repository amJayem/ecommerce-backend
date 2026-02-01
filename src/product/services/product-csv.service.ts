import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductUtilityService } from './product-utility.service';

interface ProductCsvRecord {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  brand?: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  stock: string;
  unit?: string;
  weight?: string;
  categoryId?: string;
  status?: string;
  isActive?: string;
  images?: string;
  tags?: string;
  shortDescription?: string;
  description?: string;
  detailedDescription?: string;
  coverImage?: string;
  featured?: string;
  bestseller?: string;
}

@Injectable()
export class ProductCsvService {
  constructor(
    private prisma: PrismaService,
    private utilityService: ProductUtilityService,
  ) {}

  /**
   * Export all products to CSV format
   */
  async exportProductsToCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || '',
      brand: p.brand || '',
      price: p.price,
      originalPrice: p.originalPrice || '',
      discount: p.discount,
      stock: p.stock,
      unit: p.unit,
      weight: p.weight || '',
      categoryId: p.categoryId || '',
      categoryName: p.category?.name || '',
      status: p.status,
      isActive: p.isActive,
      images: (p.images || []).join(','),
      tags: (p.tags || []).join(','),
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      detailedDescription: p.detailedDescription || '',
      coverImage: p.coverImage || '',
      featured: p.featured,
      bestseller: p.bestseller,
    }));

    return new Promise((resolve, reject) => {
      stringify(
        data,
        {
          header: true,
          columns: [
            'id',
            'name',
            'slug',
            'sku',
            'brand',
            'price',
            'originalPrice',
            'discount',
            'stock',
            'unit',
            'weight',
            'categoryId',
            'categoryName',
            'status',
            'isActive',
            'images',
            'tags',
            'shortDescription',
            'description',
            'detailedDescription',
            'coverImage',
            'featured',
            'bestseller',
          ],
        },
        (err, output) => {
          if (err) reject(err);
          resolve(output);
        },
      );
    });
  }

  /**
   * Import products from CSV buffer
   */
  async importProductsFromCsv(buffer: Buffer) {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      bom: true,
    }) as ProductCsvRecord[];

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const record of records) {
      try {
        const productId = parseInt(record.id, 10);
        const data = {
          name: record.name,
          slug:
            record.slug ||
            this.utilityService.generateSlugFromName(record.name),
          sku: record.sku || null,
          brand: record.brand || null,
          price: parseFloat(record.price) || 0,
          originalPrice: record.originalPrice
            ? parseFloat(record.originalPrice)
            : null,
          discount: parseFloat(record.discount || '0') || 0,
          stock: parseInt(record.stock, 10) || 0,
          unit: record.unit || 'piece',
          weight: record.weight ? parseFloat(record.weight) : null,
          categoryId: record.categoryId
            ? parseInt(record.categoryId, 10)
            : null,
          status: record.status || 'draft',
          isActive: String(record.isActive).toLowerCase() === 'true',
          images: record.images ? record.images.split(',') : [],
          tags: record.tags ? record.tags.split(',') : [],
          shortDescription: record.shortDescription || null,
          description: record.description || '',
          detailedDescription: record.detailedDescription || null,
          coverImage: record.coverImage || null,
          featured: String(record.featured).toLowerCase() === 'true',
          bestseller: String(record.bestseller).toLowerCase() === 'true',
          deletedAt: null,
        };

        // Upsert logic
        if (!isNaN(productId)) {
          await this.prisma.product.upsert({
            where: { id: productId },
            update: data,
            create: { ...data, id: productId },
          });
          results.updated++;
        } else {
          // If no ID provided, try to find by slug first to avoid duplicates
          const existing = await this.prisma.product.findUnique({
            where: { slug: data.slug },
          });

          if (existing) {
            await this.prisma.product.update({
              where: { id: existing.id },
              data,
            });
            results.updated++;
          } else {
            const newId = await this.utilityService.generateProductId();
            await this.prisma.product.create({
              data: { ...data, id: newId },
            });
            results.created++;
          }
        }
      } catch (error: any) {
        results.errors.push(
          `Error at row ${record.name || 'unknown'}: ${error.message}`,
        );
      }
    }

    return results;
  }

  /**
   * Generate a sample CSV template
   */
  async getSampleProductsCsv(): Promise<string> {
    const data = [
      {
        id: 202601051,
        name: 'Red Lentils (Masoor Dal) – 1kg',
        slug: 'red-lentils-masoor-dal-1kg',
        sku: 'DAL-001',
        brand: 'FreshHarvest',
        price: 3.99,
        originalPrice: 3.99,
        discount: 12.5,
        stock: 120,
        unit: 'piece',
        weight: 1,
        categoryId: 1,
        categoryName: 'Staples',
        status: 'active',
        isActive: true,
        images:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Red_Lentils_Masoor_Dal_1kg.png?v=1755707998',
        tags: 'lentils,masoor,protein,staples,vegan',
        shortDescription: '',
        description:
          'Premium-grade red lentils (Masoor Dal) that are double-cleaned for purity and even cooking.',
        detailedDescription: '',
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Red_Lentils_Masoor_Dal_1kg.png?v=1755707998',
        featured: true,
        bestseller: false,
      },
    ];

    return new Promise((resolve, reject) => {
      stringify(
        data,
        {
          header: true,
          columns: [
            'id',
            'name',
            'slug',
            'sku',
            'brand',
            'price',
            'originalPrice',
            'discount',
            'stock',
            'unit',
            'weight',
            'categoryId',
            'categoryName',
            'status',
            'isActive',
            'images',
            'tags',
            'shortDescription',
            'description',
            'detailedDescription',
            'coverImage',
            'featured',
            'bestseller',
          ],
        },
        (err, output) => {
          if (err) reject(err);
          resolve(output);
        },
      );
    });
  }
}
