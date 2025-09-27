import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

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

      const product = await this.prisma.product.create({
        data: {
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
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  async findAll(query?: {
    categoryId?: number;
    categorySlug?: string;
    status?: string;
    featured?: boolean;
    inStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        categoryId: rawCategoryId,
        categorySlug,
        status,
        featured,
        inStock,
        search,
        page = 1,
        limit = 20,
      } = query || {};

      // Convert categoryId to number if it exists
      const categoryId = rawCategoryId ? Number(rawCategoryId) : undefined;

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
      throw new Error('Failed to fetch products');
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

      // Map featured to isFeatured for now
      if (updateData.featured !== undefined) {
        updateData.isFeatured = updateData.featured;
        delete updateData.featured;
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
}
