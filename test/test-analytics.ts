import { PrismaClient, OrderStatus } from '@prisma/client';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function testAnalytics() {
  const prisma = new PrismaService();
  const analyticsService = new AnalyticsService(prisma);

  console.log('--- Starting Analytics Verification ---');

  try {
    // 1. Check Inventory (Non-time dependent mostly)
    console.log('\n[1/3] Testing Inventory Analytics...');
    const inventory = await analyticsService.getInventory();
    console.log(`Active Products: ${inventory.products.activeCount}`);
    console.log(`Archived Products: ${inventory.products.archivedCount}`);
    console.log(`Low Stock Alert Count: ${inventory.products.lowStock.length}`);
    console.log(
      `Revenue per Category Count: ${inventory.categories.revenuePerCategory.length}`,
    );

    // 2. Check Summary (Time filtered)
    console.log('\n[2/3] Testing Summary Aggregations (7d)...');
    const summary7d = await analyticsService.getSummary('7d');
    console.log(`Total Orders (7d): ${summary7d.sales.totalOrders}`);
    console.log(
      `Total Revenue (7d): ${summary7d.sales.totalRevenue.toFixed(2)}`,
    );
    console.log(
      `Average Order Value: ${summary7d.sales.averageOrderValue.toFixed(2)}`,
    );
    console.log(`Status Counts:`, summary7d.sales.statusCounts);

    // 3. Check Charts
    console.log('\n[3/3] Testing Chart Trends (30d)...');
    const charts30d = await analyticsService.getCharts('30d');
    console.log(`Revenue Trend Data Points: ${charts30d.revenueTrend.length}`);
    const totalTrendRevenue = charts30d.revenueTrend.reduce(
      (acc, curr) => acc + curr.revenue,
      0,
    );
    console.log(`Summed Trend Revenue: ${totalTrendRevenue.toFixed(2)}`);
    console.log(
      `Payment Methods Found: ${charts30d.paymentMethodBreakdown.length}`,
    );

    // 4. Check Custom Date Range
    console.log('\n[4/4] Testing Specific Date Range...');
    const customRange = await analyticsService.getSummary(
      'today',
      '2026-01-01',
      '2026-01-31',
    );
    console.log(
      `Summary for January 2026 - Total Revenue: ${customRange.sales.totalRevenue.toFixed(2)}`,
    );

    console.log('\n--- Verification Complete ---');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();
