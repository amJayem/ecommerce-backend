import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchProductDto, SortOption } from '../dto/search-product.dto';

@Injectable()
export class ProductSearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Advanced product search with filters
   */
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
  }
}
