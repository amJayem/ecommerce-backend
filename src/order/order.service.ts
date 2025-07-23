import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new order (public)
  async createOrder(data: CreateOrderDto): Promise<any> {
    // Use a transaction to ensure atomicity
    return this.prisma.$transaction(async (tx: PrismaClient) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          total: data.total,
          status: data.status ?? 'pending',
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });
      return order;
    });
  }

  // Get all orders (admin only)
  async getOrders(): Promise<any[]> {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get order by ID (admin only)
  async getOrderById(id: number): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
