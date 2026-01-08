import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsSummaryDto,
  AnalyticsChartsDto,
  AnalyticsInventoryDto,
} from './dto/analytics-response.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(
    period: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsSummaryDto> {
    const { start, end } = this.getDateRange(period, startDate, endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      revenueToday,
      ordersToday,
      newCustomersToday,
      pendingOrdersCount,
      salesData,
      customerData,
    ] = await Promise.all([
      // KPI Today
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          role: 'customer',
        },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),

      // Sales Summary for Period
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: start, lt: end },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),

      // Customer Segmentation
      this.getCustomerSegments(start, end),
    ]);

    // Status Counts for Period
    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lt: end } },
      _count: { id: true },
    });

    const statusMap = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach((s) => {
      const statusKey = s.status.toLowerCase() as keyof typeof statusMap;
      if (statusMap[statusKey] !== undefined) {
        statusMap[statusKey] = s._count.id;
      }
    });

    return {
      kpis: {
        todayRevenue: revenueToday._sum.totalAmount || 0,
        ordersToday,
        newCustomersToday,
        pendingOrdersCount,
      },
      sales: {
        totalOrders: salesData._count.id,
        totalRevenue: salesData._sum.totalAmount || 0,
        averageOrderValue: salesData._avg.totalAmount || 0,
        statusCounts: statusMap,
      },
      customers: customerData,
    };
  }

  async getCharts(
    period: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsChartsDto> {
    const { start, end } = this.getDateRange(period, startDate, endDate);

    // Revenue Trend (Daily)
    // For simplicity, we aggregate in memory or use raw query if period is long.
    // For 7d/30d, simple aggregation is fine.
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { createdAt: true, totalAmount: true },
    });

    const dailyTrends: Record<string, { revenue: number; orders: number }> = {};
    const curr = new Date(start);
    while (curr < end) {
      const dateStr = curr.toISOString().split('T')[0];
      dailyTrends[dateStr] = { revenue: 0, orders: 0 };
      curr.setDate(curr.getDate() + 1);
    }

    orders.forEach((o) => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (dailyTrends[dateStr]) {
        dailyTrends[dateStr].revenue += o.totalAmount;
        dailyTrends[dateStr].orders += 1;
      }
    });

    const revenueTrend = Object.entries(dailyTrends).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Status Distribution
    const statusDist = await this.prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lt: end } },
      _count: { id: true },
    });

    // Payment Method Breakdown
    const paymentBreakdown = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { createdAt: { gte: start, lt: end } },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return {
      revenueTrend,
      orderStatusDistribution: statusDist.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      paymentMethodBreakdown: paymentBreakdown.map((p) => ({
        method: p.paymentMethod || 'Unknown',
        count: p._count.id,
        revenue: p._sum.totalAmount || 0,
      })),
    };
  }

  async getInventory(): Promise<AnalyticsInventoryDto> {
    const [
      activeProducts,
      archivedProducts,
      lowStockProducts,
      outOfStockCount,
      activeCategories,
      archivedCategories,
    ] = await Promise.all([
      (this.prisma.product as any).count({
        where: { isActive: true, deletedAt: null },
      }),
      (this.prisma.product as any).count({
        where: { OR: [{ isActive: false }, { NOT: { deletedAt: null } }] },
        includeDeleted: true,
      }),
      (this.prisma.product as any).findMany({
        where: {
          isActive: true,
          deletedAt: null,
          stock: { lt: (this.prisma.product as any).fields.lowStockThreshold },
        },
        select: { id: true, name: true, stock: true, lowStockThreshold: true },
        take: 20,
      }),
      (this.prisma.product as any).count({
        where: { isActive: true, deletedAt: null, stock: 0 },
      }),
      (this.prisma.category as any).count({
        where: { isActive: true, deletedAt: null },
      }),
      (this.prisma.category as any).count({
        where: { OR: [{ isActive: false }, { NOT: { deletedAt: null } }] },
        includeDeleted: true,
      }),
    ]);

    // Top Selling Products (Lifetime or can be filtered, user asked for "Top selling products")
    // Let's do last 30 days for relevance.
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const topSelling = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: monthAgo } } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Populate names for top selling
    const productNames = await (this.prisma.product as any).findMany({
      where: { id: { in: topSelling.map((t) => t.productId) } },
      select: { id: true, name: true },
      includeDeleted: true,
    });

    const populatedTopSelling = topSelling.map((t) => ({
      id: t.productId,
      name: productNames.find((p) => p.id === t.productId)?.name || 'Unknown',
      quantity: t._sum.quantity || 0,
      revenue: t._sum.total || 0,
    }));

    // Revenue per category
    const categoryRevenue = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { createdAt: { gte: monthAgo } } },
      _sum: { total: true },
    });

    // This is tricky because we need to group by Category, but OrderItem only has productId.
    // We'll aggregate in memory for now.
    const productsWithCategory = await (this.prisma.product as any).findMany({
      where: { id: { in: categoryRevenue.map((cr) => cr.productId) } },
      select: { id: true, category: { select: { id: true, name: true } } },
      includeDeleted: true,
    });

    const catRevMap: Record<number, { name: string; revenue: number }> = {};
    categoryRevenue.forEach((cr) => {
      const prod = productsWithCategory.find((p) => p.id === cr.productId);
      if (prod?.category) {
        const catId = prod.category.id;
        if (!catRevMap[catId]) {
          catRevMap[catId] = { name: prod.category.name, revenue: 0 };
        }
        catRevMap[catId].revenue += cr._sum.total || 0;
      }
    });

    return {
      products: {
        activeCount: activeProducts,
        archivedCount: archivedProducts,
        lowStock: lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          threshold: p.lowStockThreshold,
        })),
        outOfStock: outOfStockCount,
        topSelling: populatedTopSelling,
      },
      categories: {
        activeCount: activeCategories,
        archivedCount: archivedCategories,
        revenuePerCategory: Object.entries(catRevMap).map(([id, data]) => ({
          id: Number(id),
          ...data,
        })),
      },
    };
  }

  private async getCustomerSegments(start: Date, end: Date) {
    const [total, newCustomers, registered] = await Promise.all([
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.user.count({
        where: { createdAt: { gte: start, lt: end }, role: 'customer' },
      }),
      this.prisma.user.count({ where: { role: 'customer' } }), // For now same as total, unless we have guest orders
    ]);

    // Guest vs Registered based on Orders
    const guestOrders = await this.prisma.order.count({
      where: { userId: null, createdAt: { gte: start, lt: end } },
    });
    const registeredOrdersCount = await this.prisma.order.count({
      where: { userId: { not: null }, createdAt: { gte: start, lt: end } },
    });

    // Returning Customers: Checked multiple orders across all time?
    // User requirement: "Returning customers"
    const returningCount = await this.prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) as count FROM (
        SELECT "userId" FROM "Order" 
        WHERE "userId" IS NOT NULL 
        GROUP BY "userId" 
        HAVING COUNT("id") > 1
      ) as sub
    `;

    return {
      total,
      new: newCustomers,
      returning: Number(returningCount[0].count),
      guest: guestOrders, // Actually user asked for "guest vs registered customers"
      registered: total,
    };
  }

  private getDateRange(
    period: string,
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } {
    // If specific dates are provided, use them
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      if (!endDate) end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (period === '7d') {
      start.setDate(start.getDate() - 6);
    } else if (period === '30d') {
      start.setDate(start.getDate() - 29);
    }
    // 'today' is default

    return { start, end };
  }
}
