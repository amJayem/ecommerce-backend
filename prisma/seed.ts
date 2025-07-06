import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      {
        name: 'Raw Organic Honey',
        description:
          '100% pure and unprocessed honey sourced from local bee farms.',
        price: 650,
        imageUrl:
          'https://images.unsplash.com/photo-1612197590107-bdfd7bcd6c67',
        category: 'Grocery',
        stock: 20,
        brand: 'NaturePure',
        isFeatured: true,
        discount: 10,
        weight: 500,
      },
      {
        name: 'Premium Chia Seeds',
        description:
          'Rich in Omega-3, fiber, and protein — great for smoothies and baking.',
        price: 350,
        imageUrl:
          'https://images.unsplash.com/photo-1604908177739-03ba2fa0c95d',
        category: 'Superfoods',
        stock: 100,
        brand: 'SuperSeed Co.',
        discount: 0,
        weight: 250,
      },
      {
        name: 'Cold Pressed Mustard Oil',
        description:
          'Cold-pressed mustard oil ideal for healthy cooking and hair care.',
        price: 280,
        imageUrl:
          'https://images.unsplash.com/photo-1630409345345-bf02e55eae35',
        category: 'Cooking Oils',
        stock: 50,
        brand: 'Grameen Organic',
        weight: 1000,
      },
      {
        name: 'Flax Seeds',
        description: 'Nutrient-packed seeds for digestion and heart health.',
        price: 180,
        imageUrl:
          'https://images.unsplash.com/photo-1630408468539-5701e3a88f3e',
        category: 'Superfoods',
        stock: 75,
        brand: 'NatureBoost',
        discount: 5,
        weight: 250,
      },
      {
        name: 'Almonds (Raw)',
        description: 'Crunchy, raw almonds perfect for snacking or baking.',
        price: 520,
        imageUrl:
          'https://images.unsplash.com/photo-1606857521015-7fdf10ba21cd',
        category: 'Nuts',
        stock: 60,
        brand: 'NutHouse',
        weight: 500,
      },
      {
        name: 'Cashew Nuts (Whole)',
        description:
          'Creamy and rich whole cashews for your daily energy needs.',
        price: 780,
        imageUrl:
          'https://images.unsplash.com/photo-1617132249213-bdcf9d5483f3',
        category: 'Nuts',
        stock: 40,
        brand: 'RoyalNuts',
        isFeatured: true,
        discount: 15,
        weight: 500,
      },
      {
        name: 'Pistachios (Salted)',
        description:
          'Roasted and lightly salted pistachios — a delicious snack.',
        price: 820,
        imageUrl:
          'https://images.unsplash.com/photo-1570784041063-e1c03279b57b',
        category: 'Nuts',
        stock: 35,
        brand: 'GreenCrack',
        weight: 300,
      },
      {
        name: 'Date Molasses',
        description: 'Thick, natural molasses made from ripe dates.',
        price: 400,
        imageUrl:
          'https://images.unsplash.com/photo-1611771341722-37c7cceaa799',
        category: 'Natural Sweeteners',
        stock: 45,
        brand: 'Molako',
        discount: 10,
        weight: 500,
      },
      {
        name: 'Sugarcane Molasses',
        description:
          'Pure sugarcane molasses great for baking and traditional recipes.',
        price: 360,
        imageUrl:
          'https://images.unsplash.com/photo-1602872031216-b72b64ec1d61',
        category: 'Natural Sweeteners',
        stock: 60,
        brand: 'Molako',
        weight: 500,
      },
      {
        name: 'Organic Ghee',
        description:
          'A2 desi cow ghee — aromatic and perfect for cooking or puja.',
        price: 1200,
        imageUrl:
          'https://images.unsplash.com/photo-1669539824876-24513a34a8a6',
        category: 'Dairy',
        stock: 25,
        brand: 'Grameen Dairy',
        isFeatured: true,
        discount: 20,
        weight: 500,
      },
    ],
  });
}

main()
  .then(() => {
    console.log('🌱 Seed complete');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
  });

// npx tsc
// node dist/prisma/seed.js
