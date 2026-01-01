import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { stringify } from 'csv-stringify';
import { parse } from 'csv-parse/sync';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto, SortOption } from './dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private async generateProductId(): Promise<number> {
    // Get current date in YYYYMMDD format (8 digits)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`; // "20251029"
    const datePrefixInt = parseInt(datePrefix, 10);

    // Find all products created today (IDs starting with today's date)
    // Query products with ID >= today's minimum possible ID
    const todayMinId = datePrefixInt * 10; // 202510290
    const allProducts = await this.prisma.product.findMany({
      where: {
        id: {
          gte: todayMinId,
        },
      },
      select: {
        id: true,
      },
    });

    // Filter products that start with today's date prefix and find max sequence
    let maxSequence = 0;
    for (const product of allProducts) {
      const idStr = String(product.id);
      if (idStr.startsWith(datePrefix)) {
        // Extract sequence part (everything after the 8-digit date prefix)
        const sequenceStr = idStr.slice(datePrefix.length);
        const sequence = parseInt(sequenceStr, 10);
        if (!isNaN(sequence) && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }

    // Generate next ID: datePrefix + (maxSequence + 1)
    // Example: "20251029" + "1" = "202510291"
    const nextSequence = maxSequence + 1;
    const newId = parseInt(`${datePrefix}${nextSequence}`, 10);

    return newId;
  }

  private generateSlugFromName(name: string): string {
    return name
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let candidate = baseSlug || 'product';
    let suffix = 0;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  async create(data: CreateProductDto) {
    try {
      // Check if slug already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug: data.slug },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }

      // If categoryId is provided, verify it exists (will work after schema update)
      // if (data.categoryId) {
      //   const category = await this.prisma.category.findUnique({
      //     where: { id: data.categoryId },
      //   });

      //   if (!category) {
      //     throw new NotFoundException('Category not found');
      //   }
      // }

      // Ensure arrays are properly formatted
      const images = Array.isArray(data.images) ? data.images : [];
      const tags = Array.isArray(data.tags) ? data.tags : [];

      const baseSlug =
        data.slug && data.slug.trim().length > 0
          ? this.generateSlugFromName(data.slug)
          : this.generateSlugFromName(data.name);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      // Generate custom product ID based on date + sequence
      const productId = await this.generateProductId();

      const product = await this.prisma.product.create({
        data: {
          id: productId,
          name: data.name,
          slug: uniqueSlug,
          description: data.description,
          shortDescription: data.shortDescription,
          detailedDescription: data.detailedDescription,
          price: data.price,
          originalPrice: data.originalPrice,
          discount: data.discount || 0,
          inStock: data.inStock ?? true,
          stock: data.stock || 0, // Use stock field directly
          lowStockThreshold: data.lowStockThreshold || 5,
          categoryId: data.categoryId || null,
          unit: data.unit || 'piece',
          weight: data.weight,
          images: images,
          isActive: data.isActive ?? true,
          tags: tags,
          featured: data.featured ?? false,
          bestseller: data.bestseller ?? false,
          status: data.status || 'draft',
          sku: data.sku,
          brand: data.brand,
          coverImage: data.coverImage,
        },
      });

      return product;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Handle Prisma Known Request Errors (e.g., unique constraints)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          throw new ConflictException(
            `Product with this ${target.join(', ')} already exists`,
          );
        }
      }

      // Handle Prisma Validation Errors (e.g., missing required fields)
      if (error instanceof Prisma.PrismaClientValidationError) {
        console.error(
          'Validation Error during product creation:',
          error.message,
        );
        throw new BadRequestException(
          'Invalid product data. Please ensure all required fields are provided correctly.',
        );
      }

      console.error('Unexpected error creating product:', error);
      throw new Error(
        `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findAll(query?: {
    categoryId?: number | string;
    categorySlug?: string;
    status?: string;
    featured?: boolean | string;
    inStock?: boolean | string;
    search?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    try {
      const {
        categoryId: rawCategoryId,
        categorySlug,
        status,
        featured: rawFeatured,
        inStock: rawInStock,
        search,
        page: rawPage,
        limit: rawLimit,
      } = query || {};

      // Convert query parameters to proper types
      const categoryId = rawCategoryId ? Number(rawCategoryId) : undefined;

      // Validate and convert page (must be >= 1)
      const parsedPage = rawPage ? Number(rawPage) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

      // Validate and convert limit (must be >= 1, max 100)
      const parsedLimit = rawLimit ? Number(rawLimit) : 20;
      const limit =
        isNaN(parsedLimit) || parsedLimit < 1
          ? 20
          : parsedLimit > 100
            ? 100
            : parsedLimit;

      const featured =
        rawFeatured !== undefined
          ? rawFeatured === true || rawFeatured === 'true'
          : undefined;
      const inStock =
        rawInStock !== undefined
          ? rawInStock === true || rawInStock === 'true'
          : undefined;

      // If categorySlug is provided, find the category ID
      let finalCategoryId = categoryId;
      if (categorySlug && !categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { slug: categorySlug },
          select: { id: true },
        });
        if (category) {
          finalCategoryId = category.id;
        } else {
          // If category slug not found, return empty results
          return {
            products: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
            },
          };
        }
      }

      const where: {
        categoryId?: number;
        status?: string;
        featured?: boolean;
        stock?: { gt: number };
        OR?: Array<{
          name?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
          tags?: { hasSome: string[] };
        }>;
      } = {};

      if (finalCategoryId) {
        where.categoryId = finalCategoryId;
      }

      if (status) {
        where.status = status;
      }

      if (featured !== undefined) {
        where.featured = featured;
      }

      if (inStock !== undefined) {
        where.stock = { gt: 0 };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ];
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      // Re-throw NestJS exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      // For other errors, provide more context
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        query,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to fetch products: ${errorMessage}`);
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching product with id ${id}:`, error);
      throw new Error('Failed to fetch product');
    }
  }

  async getProductsByCategorySlug(slug: string) {
    try {
      // First, find the category by slug
      const category = await this.prisma.category.findUnique({
        where: { slug },
        select: { id: true, name: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Get products for this category
      const products = await this.prisma.product.findMany({
        where: {
          categoryId: category.id,
          isActive: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { bestseller: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return {
        category: {
          id: category.id,
          name: category.name,
          slug: slug,
        },
        products,
        total: products.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch products by category slug');
    }
  }

  async findBySlug(slug: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { slug },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching product with slug ${slug}:`, error);
      throw new Error('Failed to fetch product');
    }
  }

  async update(id: number, data: UpdateProductDto) {
    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException('Product not found');
      }

      // If slug is being updated, check for conflicts
      if (data.slug && data.slug !== existingProduct.slug) {
        const slugConflict = await this.prisma.product.findUnique({
          where: { slug: data.slug },
        });

        if (slugConflict) {
          throw new ConflictException('Product with this slug already exists');
        }
      }

      // Filter out undefined values
      const updateData: Record<string, unknown> = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      );

      // Ensure arrays are properly formatted
      if (updateData.images && !Array.isArray(updateData.images)) {
        updateData.images = [];
      }

      if (updateData.tags && !Array.isArray(updateData.tags)) {
        updateData.tags = [];
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
      });

      return product;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error(`Error updating product with id ${id}:`, error);
      throw new Error('Failed to update product');
    }
  }

  async remove(id: number) {
    try {
      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        include: {
          _count: {
            select: { orderItems: true },
          },
        },
      });

      if (!existingProduct) {
        throw new NotFoundException('Product not found');
      }

      // Check if product has orders
      if (existingProduct._count.orderItems > 0) {
        throw new ConflictException(
          'Cannot delete product with existing orders',
        );
      }

      await this.prisma.product.delete({ where: { id } });

      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error(`Error deleting product with id ${id}:`, error);
      throw new Error('Failed to delete product');
    }
  }

  async getFeatured() {
    try {
      return this.prisma.product.findMany({
        where: {
          featured: true,
          status: 'published',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error('Failed to fetch featured products');
    }
  }

  async getBestsellers() {
    try {
      return this.prisma.product.findMany({
        where: {
          status: 'published',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching bestseller products:', error);
      throw new Error('Failed to fetch bestseller products');
    }
  }

  async updateStock(id: number, quantity: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const newStockQuantity = product.stock + quantity;

      return this.prisma.product.update({
        where: { id },
        data: {
          stock: newStockQuantity,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating stock for product ${id}:`, error);
      throw new Error('Failed to update product stock');
    }
  }

  async search(searchDto: SearchProductDto) {
    const where: {
      isActive: boolean;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        shortDescription?: { contains: string; mode: 'insensitive' };
        detailedDescription?: { contains: string; mode: 'insensitive' };
        tags?: { hasSome: string[] };
        brand?: { contains: string; mode: 'insensitive' };
        sku?: { contains: string; mode: 'insensitive' };
      }>;
      categoryId?: number;
      price?: {
        gte?: number;
        lte?: number;
      };
    } = {
      isActive: true,
    };

    try {
      const {
        q,
        category,
        minPrice,
        maxPrice,
        sort = SortOption.NEWEST,
        page = 1,
        limit = 12,
      } = searchDto;

      // Search term filter (case-insensitive)
      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
          { detailedDescription: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } },
          { brand: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ];
      }

      // Category filter
      if (category !== undefined) {
        // First verify the category exists
        const categoryExists = await this.prisma.category.findUnique({
          where: { id: category },
          select: { id: true },
        });

        if (!categoryExists) {
          // Return empty results if category doesn't exist
          return {
            data: [],
            meta: {
              total: 0,
              page,
              limit,
              totalPages: 0,
            },
          };
        }

        where.categoryId = category;
      }

      // Price range filter
      const priceFilter: { gte?: number; lte?: number } = {};
      if (minPrice !== undefined) {
        priceFilter.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceFilter.lte = maxPrice;
      }
      if (Object.keys(priceFilter).length > 0) {
        where.price = priceFilter;
      }

      // Build orderBy clause based on sort option
      let orderBy: Array<Record<string, 'asc' | 'desc'>> = [];
      switch (sort) {
        case SortOption.PRICE_ASC:
          orderBy = [{ price: 'asc' }];
          break;
        case SortOption.PRICE_DESC:
          orderBy = [{ price: 'desc' }];
          break;
        case SortOption.NEWEST:
          orderBy = [{ createdAt: 'desc' }];
          break;
        case SortOption.OLDEST:
          orderBy = [{ createdAt: 'asc' }];
          break;
        default:
          orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries in parallel for better performance
      // Only select essential fields for search results
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            discount: true,
            stock: true,
            inStock: true,
            isActive: true,
            status: true,
            coverImage: true,
            images: true,
            unit: true,
            brand: true,
            sku: true,
            featured: true,
            bestseller: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      return {
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error searching products:', error);
      console.error('Search parameters:', searchDto);
      if (where) {
        console.error('Where clause:', where);
      }
      throw new Error(
        `Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

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

  async importProductsFromCsv(buffer: Buffer) {
    console.log('CSV Import started. Buffer size:', buffer.length);
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      bom: true, // Handle Byte Order Mark
    }) as any[];

    console.log('Parsed records count:', records.length);
    if (records.length > 0) {
      console.log('First record keys:', Object.keys(records[0]));
    }

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
          slug: record.slug || this.generateSlugFromName(record.name),
          sku: record.sku || null,
          brand: record.brand || null,
          price: parseFloat(record.price) || 0,
          originalPrice: record.originalPrice
            ? parseFloat(record.originalPrice)
            : null,
          discount: parseFloat(record.discount) || 0,
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
            const newId = await this.generateProductId();
            await this.prisma.product.create({
              data: { ...data, id: newId },
            });
            results.created++;
          }
        }
      } catch (error) {
        results.errors.push(
          `Error at row ${record.name || 'unknown'}: ${error.message}`,
        );
      }
    }

    return results;
  }
}
