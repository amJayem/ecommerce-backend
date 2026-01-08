export class AnalyticsSummaryDto {
  kpis: {
    todayRevenue: number;
    ordersToday: number;
    newCustomersToday: number;
    pendingOrdersCount: number;
  };
  sales: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    statusCounts: {
      pending: number;
      confirmed: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    guest: number;
    registered: number;
  };
}

export class AnalyticsChartsDto {
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
  orderStatusDistribution: Array<{ status: string; count: number }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
}

export class AnalyticsInventoryDto {
  products: {
    activeCount: number;
    archivedCount: number;
    lowStock: Array<{
      id: number;
      name: string;
      stock: number;
      threshold: number;
    }>;
    outOfStock: number;
    topSelling: Array<{
      id: number;
      name: string;
      quantity: number;
      revenue: number;
    }>;
  };
  categories: {
    activeCount: number;
    archivedCount: number;
    revenuePerCategory: Array<{ id: number; name: string; revenue: number }>;
  };
}
