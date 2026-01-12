import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function checkToken() {
  const orderId = 202601121;
  const rawToken =
    '4d1667eff081fc6863bd7bd58ade01faa228206bc62656f616f395ae1a2b31c5';

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      confirmationTokenHash: true,
      confirmationTokenExpiresAt: true,
    },
  });

  if (!order) {
    console.log('Order not found');
    await prisma.$disconnect();
    return;
  }

  console.log('Order found:', order);
  console.log('Token expires at:', order.confirmationTokenExpiresAt);
  console.log('Current time:', new Date());
  console.log(
    'Is expired?',
    order.confirmationTokenExpiresAt
      ? order.confirmationTokenExpiresAt < new Date()
      : 'No expiry set',
  );

  const providedHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  console.log('Provided hash:', providedHash);
  console.log('Stored hash:', order.confirmationTokenHash);
  console.log('Hashes match?', providedHash === order.confirmationTokenHash);

  await prisma.$disconnect();
}

checkToken();
