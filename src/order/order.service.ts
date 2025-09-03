import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrderDto,
  OrderStatus,
  PaymentStatus,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // // Create a new order (public)
  // async createOrder(data: CreateOrderDto): Promise<any> {
  //   // Use a transaction to ensure atomicity
  //   return this.prisma.$transaction(async (tx: PrismaClient) => {
  //     // Create the order
  //     const order = await tx.order.create({
  //       data: {
  //         total: data.total,
  //         status: data.status ?? 'pending',
  //         items: {
  //           create: data.items.map((item) => ({
  //             productId: item.productId,
  //             quantity: item.quantity,
  //             price: item.price,
  //           })),
  //         },
  //       },
  //       include: { items: true },
  //     });
  //     return order;
  //   });
  // }

  async createOrder(data: CreateOrderDto) {
    try {
      // USER ID IS OPTIONAL - Handle both authenticated and anonymous users
      // If userId is provided, verify user exists
      if (data.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }
      }

      // Verify all products exist and have sufficient stock
      for (const item of data.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      // Use a transaction to ensure atomicity
      return this.prisma.$transaction(async (tx) => {
        // Create the order - userId can be null for anonymous users
        const order = await tx.order.create({
          data: {
            userId: data.userId || null, // Allow null for anonymous users
            status: data.status || OrderStatus.PENDING,
            totalAmount: data.totalAmount || 0,
            subtotal: data.subtotal || 0,
            tax: data.tax || 0,
            shipping: data.shipping || 0,
            discount: data.discount || 0,
            paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
            paymentMethod: data.paymentMethod,
            shippingAddress: data.shippingAddress || 'Not specified',
            billingAddress: data.billingAddress || 'Not specified',
            deliveryInstructions: data.deliveryInstructions,
            estimatedDelivery: data.estimatedDelivery
              ? new Date(data.estimatedDelivery)
              : null,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
              })),
            },
          },
          include: {
            user: data.userId
              ? {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                }
              : false,
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    coverImage: true,
                  },
                },
              },
            },
          },
        });

        // Update product stock
        for (const item of data.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        return order;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  async findAll(query?: {
    userId?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        userId,
        status,
        paymentStatus,
        page = 1,
        limit = 20,
      } = query || {};

      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    coverImage: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  async findOne(id: number) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  coverImage: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error fetching order with id ${id}:`, error);
      throw new Error('Failed to fetch order');
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    try {
      // Check if order exists
      const existingOrder = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // If status is being updated to DELIVERED, set actualDelivery
      if (
        updateOrderDto.status === OrderStatus.DELIVERED &&
        !existingOrder.actualDelivery
      ) {
        updateOrderDto.actualDelivery = new Date();
      }

      // Create update data object excluding fields that shouldn't be directly updated
      const { userId, items, ...updateData } = updateOrderDto;

      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  coverImage: true,
                },
              },
            },
          },
        },
      });

      return updatedOrder;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating order with id ${id}:`, error);
      throw new Error('Failed to update order');
    }
  }

  async remove(id: number) {
    try {
      // Check if order exists
      const existingOrder = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Check if order can be cancelled (only pending orders)
      if (existingOrder.status !== OrderStatus.PENDING) {
        throw new ConflictException('Only pending orders can be cancelled');
      }

      // Use transaction to restore product stock and delete order
      return this.prisma.$transaction(async (tx) => {
        // Restore product stock
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // Delete the order (cascade will delete order items)
        await tx.order.delete({
          where: { id },
        });

        return { message: 'Order cancelled successfully' };
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error(`Error cancelling order with id ${id}:`, error);
      throw new Error('Failed to cancel order');
    }
  }

  async getUserOrders(
    userId: number,
    query?: {
      status?: OrderStatus;
      page?: number;
      limit?: number;
    },
  ) {
    try {
      const { status, page = 1, limit = 20 } = query || {};

      const where: any = { userId };

      if (status) {
        where.status = status;
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    coverImage: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(`Error fetching orders for user ${userId}:`, error);
      throw new Error('Failed to fetch user orders');
    }
  }

  async updateOrderStatus(id: number, status: OrderStatus) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const updateData: any = { status };

      // If status is being updated to DELIVERED, set actualDelivery
      if (status === OrderStatus.DELIVERED && !order.actualDelivery) {
        updateData.actualDelivery = new Date();
      }

      return this.prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  coverImage: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating order status for order ${id}:`, error);
      throw new Error('Failed to update order status');
    }
  }

  async updatePaymentStatus(id: number, paymentStatus: PaymentStatus) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      return this.prisma.order.update({
        where: { id },
        data: { paymentStatus },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  coverImage: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error updating payment status for order ${id}:`, error);
      throw new Error('Failed to update payment status');
    }
  }
}
