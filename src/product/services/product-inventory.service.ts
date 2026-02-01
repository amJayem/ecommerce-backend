import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductInventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Update product stock quantity
   */
  async updateStock(id: number, quantity: number) {
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
  }

  /**
   * Get featured products
   */
  async getFeatured() {
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
  }

  /**
   * Get bestseller products
   */
  async getBestsellers() {
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
  }
}
