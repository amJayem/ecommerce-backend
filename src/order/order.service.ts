import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';

/**
 * Internal interface for Order objects with metadata fields.
 * Used to resolve type sync issues with guestEmail and confirmation tokens.
 */
interface InternalOrder {
  id: number;
  guestEmail: string | null;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  shippingAddressText: string | null;
  confirmationTokenHash: string | null;
  confirmationTokenExpiresAt: Date | null;
  items: Array<{
    product: {
      name: string;
      coverImage: string | null;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  createdAt: Date;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

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
      // If userId is provided, verify user exists and populate email
      if (data.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: data.userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Automatically set guestEmail from user's email if not already provided
        if (!data.guestEmail) {
          data.guestEmail = user.email;
        }
      } else if (!data.guestEmail) {
        // If no userId and no guestEmail, this is an anonymous order without tracking
        // You may want to require guestEmail for guest orders in the future
      }

      // Verify all products exist and have sufficient stock
      for (const item of data.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      // Handle addresses: either IDs (authenticated users) or objects (guest users)
      let sourceShipping: any;
      let sourceBilling: any;

      // Shipping address
      if (data.shippingAddressId) {
        // Authenticated user with saved address
        sourceShipping = await this.prisma.address.findUnique({
          where: { id: data.shippingAddressId },
        });
        if (!sourceShipping) {
          throw new BadRequestException('Shipping address not found');
        }
      } else if (data.shippingAddress) {
        // Guest user with address object - use it directly for snapshot
        sourceShipping = {
          firstName:
            data.shippingAddress.name.split(' ')[0] ||
            data.shippingAddress.name,
          lastName:
            data.shippingAddress.name.split(' ').slice(1).join(' ') || '',
          street: data.shippingAddress.address1,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state || '',
          zipCode: data.shippingAddress.postalCode,
          country: data.shippingAddress.country || 'Bangladesh',
          phone: data.shippingAddress.phone,
        };
      } else {
        throw new BadRequestException(
          'Either shippingAddressId or shippingAddress object is required',
        );
      }

      // Billing address
      if (data.billingAddressId) {
        // Authenticated user with saved billing address
        const foundBilling = await this.prisma.address.findUnique({
          where: { id: data.billingAddressId },
        });
        if (!foundBilling) {
          throw new BadRequestException('Billing address not found');
        }
        sourceBilling = foundBilling;
      } else if (data.billingAddress) {
        // Guest user with billing address object
        sourceBilling = {
          firstName:
            data.billingAddress.name.split(' ')[0] || data.billingAddress.name,
          lastName:
            data.billingAddress.name.split(' ').slice(1).join(' ') || '',
          street: data.billingAddress.address1,
          city: data.billingAddress.city,
          state: data.billingAddress.state || '',
          zipCode: data.billingAddress.postalCode,
          country: data.billingAddress.country || 'Bangladesh',
          phone: data.billingAddress.phone,
        };
      } else {
        // Default to shipping address
        sourceBilling = sourceShipping;
      }

      // Pre-generate the order id outside the transaction to avoid nesting client calls
      const orderId = await this.generateOrderId();

      // Generate confirmation token
      const rawConfirmationToken = crypto.randomBytes(32).toString('hex');
      const confirmationTokenHash = crypto
        .createHash('sha256')
        .update(rawConfirmationToken)
        .digest('hex');
      const confirmationTokenExpiresAt = new Date(
        Date.now() + 2 * 60 * 60 * 1000,
      ); // 2 hours

      // Use a transaction to ensure atomicity across order creation and stock updates
      return this.prisma.$transaction(async (tx) => {
        // 2. Create address snapshots
        const shippingSnapshot = await tx.address.create({
          data: {
            firstName: sourceShipping.firstName,
            lastName: sourceShipping.lastName,
            street: sourceShipping.street,
            city: sourceShipping.city,
            state: sourceShipping.state,
            zipCode: sourceShipping.zipCode,
            country: sourceShipping.country,
            phone: sourceShipping.phone,
            addressType: 'order_snapshot',
            isDefault: false,
          },
        });

        let billingSnapshotId = shippingSnapshot.id;
        if (data.billingAddressId) {
          const billingSnapshot = await tx.address.create({
            data: {
              firstName: sourceBilling.firstName,
              lastName: sourceBilling.lastName,
              street: sourceBilling.street,
              city: sourceBilling.city,
              state: sourceBilling.state,
              zipCode: sourceBilling.zipCode,
              country: sourceBilling.country,
              phone: sourceBilling.phone,
              addressType: 'order_snapshot',
              isDefault: false,
            },
          });
          billingSnapshotId = billingSnapshot.id;
        }

        // 3. Create the order
        const order = await tx.order.create({
          data: {
            id: orderId,
            userId: data.userId,
            guestEmail: data.guestEmail,
            status: data.status || OrderStatus.PENDING,
            totalAmount: data.totalAmount || 0,
            subtotal: data.subtotal || 0,
            tax: data.tax || 0,
            shippingCost: data.shippingCost || 0,
            discount: data.discount || 0,
            paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
            paymentMethod: data.paymentMethod,
            shippingAddressId: shippingSnapshot.id,
            billingAddressId: billingSnapshotId,
            shippingAddressText: data.shippingAddressText,
            deliveryNote: data.deliveryNote,
            estimatedDelivery: data.estimatedDelivery
              ? new Date(data.estimatedDelivery)
              : null,
            confirmationTokenHash,
            confirmationTokenExpiresAt,
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
                    images: true, // Added images
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

        return {
          order,
          confirmationToken: rawConfirmationToken,
        };
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

  async findAll(query?: OrderQueryDto) {
    try {
      const {
        userId,
        status,
        paymentStatus,
        search,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        paymentMethod,
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

      // Date Range Filter
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Amount Range Filter
      if (minAmount !== undefined || maxAmount !== undefined) {
        where.totalAmount = {};
        if (minAmount !== undefined) {
          where.totalAmount.gte = minAmount;
        }
        if (maxAmount !== undefined) {
          where.totalAmount.lte = maxAmount;
        }
      }

      // Payment Method Filter
      if (paymentMethod) {
        where.paymentMethod = {
          contains: paymentMethod,
          mode: 'insensitive',
        };
      }

      // Search Logic (Order ID or Customer Details)
      if (search) {
        const searchConditions: Prisma.OrderWhereInput[] = [
          // Search in Customer Details (User model)
          {
            user: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          // Search in Shipping Address Text
          { shippingAddressText: { contains: search, mode: 'insensitive' } },
        ];

        // If search is numeric, also search by Order ID
        const searchAsNumber = parseInt(search, 10);
        if (!isNaN(searchAsNumber)) {
          searchConditions.push({ id: searchAsNumber });
        }

        where.OR = searchConditions;
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
          shippingAddress: true,
          billingAddress: true,
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
      // Note: Address updates now handled separately via updateOrderAddress method
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

  async updateOrderAddress(
    orderId: number,
    userId: number,
    addressId: number,
    addressType: 'shipping' | 'billing' = 'shipping',
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Authorization check
    if (order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this order',
      );
    }

    // Status check: only PENDING or CONFIRMED
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new ConflictException(
        'Order address can only be updated for PENDING or CONFIRMED orders',
      );
    }

    // Fetch the new source address
    const source = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!source) {
      throw new BadRequestException('Source address not found');
    }

    // Create a new snapshot
    const snapshot = await this.prisma.address.create({
      data: {
        firstName: source.firstName,
        lastName: source.lastName,
        street: source.street,
        city: source.city,
        state: source.state,
        zipCode: source.zipCode,
        country: source.country,
        phone: source.phone,
        addressType: 'order_snapshot',
        isDefault: false,
      },
    });

    // Update the order with the new snapshot ID
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const updateData: any = {};
    if (addressType === 'shipping') {
      updateData.shippingAddressId = snapshot.id;
    } else {
      updateData.billingAddressId = snapshot.id;
    }

    const result = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        shippingAddress: true,
        billingAddress: true,
      },
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    return result;
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
            shippingAddress: true,
            billingAddress: true,
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

  async lookUpGuestOrder(id: number, email: string) {
    const order = (await this.prisma.order.findUnique({
      where: { id },
    })) as unknown as InternalOrder;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.guestEmail !== email) {
      throw new ForbiddenException('Invalid order number or email');
    }

    // Generate a temporary access token scoped to this order
    const payload = {
      sub: order.id,
      email: order.guestEmail,
      type: 'guest_order_access',
    };

    if (!this.jwtService) {
      throw new Error('JwtService not available in OrderService');
    }

    return {
      guestToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
      orderId: order.id,
    };
  }

  /**
   * Validates a confirmation token and returns a safe summary of the order for the Thank You page.
   * This is public and should NOT expose sensitive user or payment data.
   */
  async getSummaryByConfirmationToken(orderId: number, rawToken: string) {
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                coverImage: true,
              },
            },
          },
        },
      },
    })) as unknown as InternalOrder;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      !order.confirmationTokenHash ||
      !order.confirmationTokenExpiresAt ||
      order.confirmationTokenExpiresAt < new Date()
    ) {
      throw new ForbiddenException('Confirmation token expired or not set');
    }

    // Hash provided token and compare
    const providedHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    if (providedHash !== order.confirmationTokenHash) {
      throw new ForbiddenException('Invalid confirmation token');
    }

    // Return a SAFE subset of the order
    return {
      orderNumber: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      discount: order.discount,
      shippingAddressText: order.shippingAddressText,
      items: order.items.map((item) => ({
        productName: item.product.name,
        coverImage: item.product.coverImage,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      createdAt: order.createdAt,
    };
  }
}
