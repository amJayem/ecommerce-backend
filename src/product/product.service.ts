import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INCLUDE_DELETED } from '../prisma/prisma-soft-delete.extension';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductUtilityService } from './services/product-utility.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private utilityService: ProductUtilityService,
  ) {}

  /**
   * Create a new product
   */
  async create(data: CreateProductDto) {
    try {
      // Check if slug already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug: data.slug },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }

      // Ensure arrays are properly formatted
      const images = Array.isArray(data.images) ? data.images : [];
      const tags = Array.isArray(data.tags) ? data.tags : [];

      // Generate unique slug
      const baseSlug =
        data.slug && data.slug.trim().length > 0
          ? this.utilityService.generateSlugFromName(data.slug)
          : this.utilityService.generateSlugFromName(data.name);
      const uniqueSlug = await this.utilityService.ensureUniqueSlug(baseSlug);

      // Generate custom product ID
      const productId = await this.utilityService.generateProductId();

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
          stock: data.stock || 0,
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

      // Handle Prisma Known Request Errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          throw new ConflictException(
            `Product with this ${target.join(', ')} already exists`,
          );
        }
      }

      // Handle Prisma Validation Errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException(
          'Invalid product data. Please ensure all required fields are provided correctly.',
        );
      }

      throw new Error(
        `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find all products with optional filters
   */
  async findAll(query?: {
    categoryId?: number | string;
    categorySlug?: string;
    status?: string;
    featured?: boolean | string;
    inStock?: boolean | string;
    search?: string;
    page?: number | string;
    limit?: number | string;
    includeDeleted?: boolean | string;
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
        includeDeleted: rawIncludeDeleted,
      } = query || {};

      // Convert query parameters to proper types
      const categoryId = rawCategoryId ? Number(rawCategoryId) : undefined;
      const parsedPage = rawPage ? Number(rawPage) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
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
      const includeDeleted =
        rawIncludeDeleted !== undefined
          ? rawIncludeDeleted === true || rawIncludeDeleted === 'true'
          : false;

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
        isActive: boolean;
        categoryId?: number;
        status?: string;
        featured?: boolean;
        stock?: { gt: number };
        OR?: Array<{
          name?: { contains: string; mode: 'insensitive' };
          description?: { contains: string; mode: 'insensitive' };
          tags?: { hasSome: string[] };
        }>;
      } = {
        isActive: true,
      };

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
        (this.prisma.product as any).findMany({
          where,
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
          [INCLUDE_DELETED]: includeDeleted,
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
        (this.prisma.product as any).count({
          where,
          [INCLUDE_DELETED]: includeDeleted,
        }),
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
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch products: ${errorMessage}`);
    }
  }

  /**
   * Find a single product by ID
   */
  async findOne(id: number, includeDeleted = false) {
    try {
      const product = await (this.prisma.product as any).findUnique({
        where: { id },
        [INCLUDE_DELETED]: includeDeleted,
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
      throw new Error('Failed to fetch product');
    }
  }

  /**
   * Find products by category slug
   */
  async getProductsByCategorySlug(slug: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },
        select: { id: true, name: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

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

  /**
   * Find a product by slug
   */
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
      throw new Error('Failed to fetch product');
    }
  }

  /**
   * Update a product
   */
  async update(id: number, data: UpdateProductDto) {
    try {
      // Check if product exists (including deleted for restoration)
      const existingProduct = await (this.prisma.product as any).findUnique({
        where: { id },
        [INCLUDE_DELETED]: true,
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

      // Restore logic
      if (existingProduct.deletedAt) {
        updateData.deletedAt = null;
        updateData.isActive = true;

        // If slug wasn't explicitly changed, restore the original
        if (!data.slug) {
          const restoredSlug = existingProduct.slug.replace(
            /-deleted-\d+$/,
            '',
          );
          updateData.slug =
            await this.utilityService.ensureUniqueSlug(restoredSlug);
        }
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
      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete a product (with order validation)
   */
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

      // Check if product has any orders
      if (existingProduct._count.orderItems > 0) {
        throw new ConflictException(
          `Cannot delete product with existing orders. This product has ${existingProduct._count.orderItems} order(s). Consider setting isActive to false instead.`,
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
      throw new Error('Failed to delete product');
    }
  }
}
