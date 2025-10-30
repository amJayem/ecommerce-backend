import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateOrderDto,
  OrderStatus,
  PaymentStatus,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Generates an order identifier in the form yyyyMMdd{N}
  // Example: 202510291 for the first order on 2025-10-29
  // Strategy: read today's orders by ID prefix and append next sequence.
  private async generateOrderId(): Promise<number> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `${yyyy}${mm}${dd}`; // yyyyMMdd
    const prefixInt = parseInt(prefix, 10);

    // Find existing orders today and compute next sequence
    const minTodayId = prefixInt * 10; // e.g., 202510290
    const existing = await this.prisma.order.findMany({
      where: { id: { gte: minTodayId } },
      select: { id: true },
    });

    let maxSeq = 0;
    for (const o of existing) {
      const idStr = String(o.id);
      if (idStr.startsWith(prefix)) {
        const seqStr = idStr.slice(prefix.length);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    }

    const nextSeq = maxSeq + 1;
    return parseInt(`${prefix}${nextSeq}`, 10);
  }

  // Runtime type-narrowing for OrderStatus to keep update payloads type-safe
  private isValidOrderStatus(value: unknown): value is OrderStatus {
    return Object.values(OrderStatus).includes(value as OrderStatus);
  }

  // Runtime type-narrowing for PaymentStatus to keep update payloads type-safe
  private isValidPaymentStatus(value: unknown): value is PaymentStatus {
    return Object.values(PaymentStatus).includes(value as PaymentStatus);
  }

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

      // Pre-generate the order id outside the transaction to avoid nesting client calls
      const orderId = await this.generateOrderId();

      // Use a transaction to ensure atomicity across order creation and stock updates
      return this.prisma.$transaction(async (tx) => {
        // Create the order
        const order = await tx.order.create({
          data: {
            id: orderId,
            userId: data.userId || null,
            status: data.status || OrderStatus.PENDING,
            totalAmount: data.totalAmount || 0,
            subtotal: data.subtotal || 0,
            tax: data.tax || 0,
            shippingCost: data.shippingCost || 0,
            discount: data.discount || 0,
            paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
            paymentMethod: data.paymentMethod,
            shippingAddress:
              data.shippingAddress !== undefined
                ? (data.shippingAddress as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            billingAddress:
              data.billingAddress !== undefined
                ? (data.billingAddress as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            shippingAddressText: data.shippingAddressText,
            deliveryNote: data.deliveryNote,
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

        // Update product stock for each item in the order
        // This is a simple decrement; consider reservation/compensation if adding async payment capture
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

      // Typed where clause to avoid unsafe any usage in filters
      const where: Prisma.OrderWhereInput = {};

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

      // If status is being updated to DELIVERED, set actualDelivery once
      if (
        updateOrderDto.status === OrderStatus.DELIVERED &&
        !existingOrder.actualDelivery
      ) {
        updateOrderDto.actualDelivery = new Date();
      }

      // Build update data explicitly (avoid unsafe any); only copy defined fields
      const updatedData: Prisma.OrderUpdateInput = {};
      if (this.isValidOrderStatus(updateOrderDto.status)) {
        updatedData.status = updateOrderDto.status;
      }
      if (updateOrderDto.totalAmount !== undefined) {
        updatedData.totalAmount = updateOrderDto.totalAmount;
      }
      if (updateOrderDto.subtotal !== undefined) {
        updatedData.subtotal = updateOrderDto.subtotal;
      }
      if (updateOrderDto.tax !== undefined) {
        updatedData.tax = updateOrderDto.tax;
      }
      if (updateOrderDto.shippingCost !== undefined) {
        updatedData.shippingCost = updateOrderDto.shippingCost;
      }
      if (updateOrderDto.discount !== undefined) {
        updatedData.discount = updateOrderDto.discount;
      }
      if (this.isValidPaymentStatus(updateOrderDto.paymentStatus)) {
        updatedData.paymentStatus = updateOrderDto.paymentStatus;
      }
      if (updateOrderDto.paymentMethod !== undefined) {
        updatedData.paymentMethod = updateOrderDto.paymentMethod;
      }
      if (updateOrderDto.shippingAddress !== undefined) {
        updatedData.shippingAddress =
          updateOrderDto.shippingAddress !== undefined
            ? (updateOrderDto.shippingAddress as Prisma.InputJsonValue)
            : Prisma.JsonNull;
      }
      if (updateOrderDto.billingAddress !== undefined) {
        updatedData.billingAddress =
          updateOrderDto.billingAddress !== undefined
            ? (updateOrderDto.billingAddress as Prisma.InputJsonValue)
            : Prisma.JsonNull;
      }
      if (updateOrderDto.shippingAddressText !== undefined) {
        updatedData.shippingAddressText = updateOrderDto.shippingAddressText;
      }
      if (updateOrderDto.deliveryNote !== undefined) {
        updatedData.deliveryNote = updateOrderDto.deliveryNote;
      }
      if (updateOrderDto.estimatedDelivery !== undefined) {
        updatedData.estimatedDelivery = updateOrderDto.estimatedDelivery
          ? new Date(updateOrderDto.estimatedDelivery)
          : null;
      }
      if (updateOrderDto.actualDelivery !== undefined) {
        updatedData.actualDelivery = updateOrderDto.actualDelivery;
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: updatedData,
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

      // Business rule: only pending orders can be cancelled
      if (existingOrder.status !== OrderStatus.PENDING) {
        throw new ConflictException('Only pending orders can be cancelled');
      }

      // Restore stock and delete the order atomically
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

      // Scope to the current user and apply optional status filter
      const where: Prisma.OrderWhereInput = { userId };

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

      // Set status and, if delivered, stamp delivery timestamp
      const updateData: Prisma.OrderUpdateInput = { status };
      if (status === OrderStatus.DELIVERED) {
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
