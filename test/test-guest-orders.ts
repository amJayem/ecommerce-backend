import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrderService } from '../src/order/order.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const orderService = app.get(OrderService);
  const prisma = app.get(PrismaService);

  console.log('--- Starting Guest Order Verification ---');

  try {
    // 0. Find a valid product
    const validProduct = await prisma.product.findFirst({
      where: { isActive: true, stock: { gt: 0 } },
    });

    if (!validProduct) {
      throw new Error('No active products with stock found in database');
    }

    // 1. Create a guest order
    console.log(
      `\n[1/4] Creating Guest Order with Product: ${validProduct.name} (${validProduct.id})...`,
    );
    const guestEmail = `guest_${Date.now()}@example.com`;
    const orderData = {
      items: [
        { productId: validProduct.id, quantity: 1, price: validProduct.price },
      ],
      guestEmail,
      totalAmount: validProduct.price,
      subtotal: validProduct.price,
      paymentMethod: 'COD',
      shippingAddressText: '123 Guest St, Dhaka',
    };

    const order = (await orderService.createOrder(orderData as any)) as any;
    console.log(`Guest Order Created: ${order.id} for ${order.guestEmail}`);

    // 2. Test lookup with wrong email
    console.log('\n[2/4] Testing Lookup with Wrong Email...');
    try {
      await orderService.lookUpGuestOrder(order.id, 'wrong@email.com');
      console.error('FAILED: Lookup should have thrown ForbiddenException');
    } catch (error) {
      console.log('PASSED: Caught expected error:', error.message);
    }

    // 3. Test lookup with right email
    console.log('\n[3/4] Testing Lookup with Correct Email...');
    const lookupResult = await orderService.lookUpGuestOrder(
      order.id,
      guestEmail,
    );
    console.log(
      'PASSED: Received guest token:',
      lookupResult.guestToken.substring(0, 20) + '...',
    );

    // 4. Test findOne for the order
    console.log('\n[4/4] Verifying Order Details Access...');
    const orderDetails = (await orderService.findOne(order.id)) as any;
    if (orderDetails.guestEmail === guestEmail) {
      console.log('PASSED: Order details accessed successfully');
    } else {
      console.error('FAILED: Guest email mismatch in retrieved details');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    console.log('Cleanup complete.');

    console.log('\n--- Verification Complete ---');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
