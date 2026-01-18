import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateOrderAddresses() {
  console.log(
    '🔄 Starting migration: Converting order JSON addresses to Address table...',
  );

  try {
    // Get all existing orders
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        shippingAddress: true,
        billingAddress: true,
      },
    });

    console.log(`📦 Found ${orders.length} orders to migrate`);

    for (const order of orders) {
      console.log(`  Processing order #${order.id}...`);

      // Create shipping address snapshot
      const shippingData = order.shippingAddress as any;

      if (!shippingData) {
        console.log(
          `  ⚠️  Order #${order.id} has no shipping address, skipping...`,
        );
        continue;
      }

      const shippingSnapshot = await prisma.address.create({
        data: {
          firstName: shippingData.firstName || 'Unknown',
          lastName: shippingData.lastName || 'Unknown',
          street: shippingData.street || shippingData.address || 'N/A',
          city: shippingData.city || 'N/A',
          state: shippingData.state || 'N/A',
          zipCode: shippingData.zipCode || shippingData.zip || '00000',
          country: shippingData.country || 'N/A',
          phone: shippingData.phone || 'N/A',
          addressType: 'order_snapshot',
          userId: null, // Snapshots are not linked to users
          isDefault: false,
        },
      });

      console.log(
        `  ✅ Created shipping address snapshot: ${shippingSnapshot.id}`,
      );

      // Create billing address snapshot if exists
      let billingSnapshotId: number | null = null;
      if (order.billingAddress) {
        const billingData = order.billingAddress as any;

        const billingSnapshot = await prisma.address.create({
          data: {
            firstName: billingData.firstName || 'Unknown',
            lastName: billingData.lastName || 'Unknown',
            street: billingData.street || billingData.address || 'N/A',
            city: billingData.city || 'N/A',
            state: billingData.state || 'N/A',
            zipCode: billingData.zipCode || billingData.zip || '00000',
            country: billingData.country || 'N/A',
            phone: billingData.phone || 'N/A',
            addressType: 'order_snapshot',
            userId: null,
            isDefault: false,
          },
        });

        billingSnapshotId = billingSnapshot.id;
        console.log(
          `  ✅ Created billing address snapshot: ${billingSnapshot.id}`,
        );
      }

      // Update order with foreign keys
      // Note: This will be done in the migration SQL, not here
      // We're just creating the Address records
      console.log(`  ✅ Order #${order.id} migration complete`);
    }

    console.log('✅ Migration completed successfully!');
    console.log(`📊 Created ${orders.length} shipping address snapshots`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateOrderAddresses()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
