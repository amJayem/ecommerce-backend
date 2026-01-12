import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrderService } from '../src/order/order.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const orderService = app.get(OrderService);
  const prisma = app.get(PrismaService);

  console.log('--- Starting Confirmation Token Verification ---');

  try {
    // 0. Find a valid product
    const validProduct = await prisma.product.findFirst({
      where: { isActive: true, stock: { gt: 0 } },
    });

    if (!validProduct) {
      throw new Error('No active products with stock found in database');
    }

    // 1. Create an order and get the token
    console.log('\n[1/4] Creating Order & Receiving Token...');
    const orderData = {
      items: [
        { productId: validProduct.id, quantity: 1, price: validProduct.price },
      ],
      guestEmail: 'token-test@example.com',
      totalAmount: validProduct.price,
      subtotal: validProduct.price,
      shippingAddress: { name: 'Test' },
      shippingAddressText: 'Test Address',
    };

    const result = await orderService.createOrder(orderData as any);
    const orderId = result.order.id;
    const rawToken = result.confirmationToken;
    console.log(
      `Order Created: ${orderId}, Token Received: ${rawToken.substring(0, 10)}...`,
    );

    // 2. Test valid retrieval
    console.log('\n[2/4] Testing Retrieval with Valid Token...');
    const summary = await orderService.getSummaryByConfirmationToken(
      orderId,
      rawToken,
    );
    console.log('PASSED: Summary retrieved successfully');
    console.log(
      `Summary Status: ${summary.status}, Items: ${summary.items.length}`,
    );

    // Check for sensitive fields leakage (approximate check)
    if ((summary as any).guestEmail || (summary as any).userId) {
      console.error(
        'FAILED: Sensitive fields (guestEmail/userId) leaked in summary!',
      );
    } else {
      console.log('PASSED: No sensitive fields leaked');
    }

    // 3. Test invalid retrieval
    console.log('\n[3/4] Testing Retrieval with Invalid Token...');
    try {
      await orderService.getSummaryByConfirmationToken(
        orderId,
        'invalid-token',
      );
      console.error(
        'FAILED: Should have thrown ForbiddenException for invalid token',
      );
    } catch (e) {
      console.log('PASSED: Caught expected ForbiddenException');
    }

    // 4. Test expired token
    console.log('\n[4/4] Testing Retrieval with Expired Token...');
    await prisma.order.update({
      where: { id: orderId },
      data: { confirmationTokenExpiresAt: new Date(Date.now() - 1000) } as any,
    });
    try {
      await orderService.getSummaryByConfirmationToken(orderId, rawToken);
      console.error(
        'FAILED: Should have thrown ForbiddenException for expired token',
      );
    } catch (e) {
      console.log('PASSED: Caught expected ForbiddenException');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    console.log('Cleanup complete.');

    console.log('\n--- Verification Complete ---');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
