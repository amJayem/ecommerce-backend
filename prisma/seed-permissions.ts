import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  // Order permissions
  {
    name: 'order.read',
    description: 'View orders',
    category: 'order',
  },
  {
    name: 'order.create',
    description: 'Create orders',
    category: 'order',
  },
  {
    name: 'order.update',
    description: 'Update order status and details',
    category: 'order',
  },
  {
    name: 'order.delete',
    description: 'Delete orders',
    category: 'order',
  },

  // Product permissions
  {
    name: 'product.read',
    description: 'View products',
    category: 'product',
  },
  {
    name: 'product.create',
    description: 'Create new products',
    category: 'product',
  },
  {
    name: 'product.update',
    description: 'Update product details',
    category: 'product',
  },
  {
    name: 'product.delete',
    description: 'Delete products',
    category: 'product',
  },

  // Category permissions
  {
    name: 'category.read',
    description: 'View categories',
    category: 'category',
  },
  {
    name: 'category.create',
    description: 'Create new categories',
    category: 'category',
  },
  {
    name: 'category.update',
    description: 'Update category details',
    category: 'category',
  },
  {
    name: 'category.delete',
    description: 'Delete categories',
    category: 'category',
  },

  // User permissions
  {
    name: 'user.read',
    description: 'View users and user lists',
    category: 'user',
  },
  {
    name: 'user.approve',
    description: 'Approve or reject pending users',
    category: 'user',
  },
  {
    name: 'user.manage',
    description: 'Manage users (suspend, update roles, etc.)',
    category: 'user',
  },

  // Admin permissions
  {
    name: 'admin.action',
    description: 'Perform general administrative actions',
    category: 'admin',
  },
];

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        description: permission.description,
        category: permission.category,
      },
      create: permission,
    });
  }

  console.log(`✅ Seeded ${DEFAULT_PERMISSIONS.length} permissions`);

  // Display all permissions grouped by category
  const categories = [...new Set(DEFAULT_PERMISSIONS.map((p) => p.category))];

  for (const category of categories) {
    const perms = DEFAULT_PERMISSIONS.filter((p) => p.category === category);
    console.log(`\n📁 ${category.toUpperCase()}:`);
    perms.forEach((p) => console.log(`   - ${p.name}`));
  }
}

seedPermissions()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
