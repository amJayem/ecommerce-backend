import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      // ——————————— MASOOR DAL (uses Red_Lentils image) ———————————
      {
        name: 'Red Lentils (Masoor Dal) – 1kg',
        price: 3.99,
        originalPrice: 3.99,
        discount: 12.5,
        description:
          'Premium-grade red lentils (Masoor Dal) that are double-cleaned for purity and even cooking. Naturally rich in plant protein, iron, and dietary fiber, they cook fast into a creamy, mildly sweet dal—perfect for curries, soups, khichuri, and healthy meal prep. Ideal for vegetarian and high-protein diets, with a smooth texture that pairs well with aromatic spices.',
        brand: 'FreshHarvest',
        categoryId: 1, // staples category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Red_Lentils_Masoor_Dal_1kg.png?v=1755707998',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Red_Lentils_Masoor_Dal_1kg.png?v=1755707998',
        ],
        featured: true,
        stock: 120,
        weight: 1.0,
        sku: 'DAL-001',
        slug: 'red-lentils-masoor-dal-1kg',
        status: 'active',
        tags: ['lentils', 'masoor', 'protein', 'staples', 'vegan'],
      },
      {
        name: 'Split Red Lentils (Masoor Dal) – 500g',
        price: 2.39,
        originalPrice: null,
        discount: 0,
        description:
          'Finely split red lentils that soften rapidly for quick weekday cooking. Naturally low in fat and a great source of fiber, they deliver a comforting, earthy flavor and silky texture. Perfect for light dals, soups, and porridge-style dishes—ready in minutes without compromising nutrition.',
        brand: 'FreshHarvest',
        categoryId: 1, // staples category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Red_Lentils_Masoor_Dal_1kg.png?v=1755707998',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Red_Lentils_Masoor_Dal_1kg.png?v=1755707998',
        ],
        featured: false,
        stock: 140,
        weight: 0.5,
        sku: 'DAL-002',
        slug: 'split-red-lentils-masoor-500g',
        status: 'active',
        tags: ['lentils', 'quick-cook', 'fiber', 'staples'],
      },

      // ——————————— BASMATI RICE (uses Premium_Aromatic_Basmati_Rice image) ———————————
      {
        name: 'Premium Aromatic Basmati Rice – 5kg',
        price: 15.99,
        originalPrice: 15.99,
        discount: 9.4,
        description:
          'Naturally aged basmati rice with long, slender grains that cook fluffy and separate, releasing a delicate floral aroma. Ideal for biryani, pulao, and special-occasion meals where texture and fragrance matter. Low in stickiness and consistent in quality, this rice elevates everyday plates and festive recipes alike.',
        brand: 'GoldenGrain',
        categoryId: 1, // staples category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Premium_Aromatic_Basmati_Rice.jpg?v=1755707997',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Premium_Aromatic_Basmati_Rice.jpg?v=1755707997',
        ],
        featured: true,
        stock: 80,
        weight: 5.0,
        sku: 'RICE-001',
        slug: 'premium-aromatic-basmati-rice-5kg',
        status: 'active',
        tags: ['rice', 'basmati', 'long-grain', 'staples'],
      },
      {
        name: 'Aged Basmati Rice – 2kg',
        price: 7.25,
        originalPrice: null,
        discount: 0,
        description:
          'Carefully aged basmati rice for an enhanced aroma and firmer bite. The grains expand beautifully while remaining non-sticky, making it a dependable choice for pulao, fried rice, and everyday family meals. A premium pantry essential that consistently delivers restaurant-quality results.',
        brand: 'GoldenGrain',
        categoryId: 1, // staples category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Premium_Aromatic_Basmati_Rice.jpg?v=1755707997',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Premium_Aromatic_Basmati_Rice.jpg?v=1755707997',
        ],
        featured: false,
        stock: 95,
        weight: 2.0,
        sku: 'RICE-002',
        slug: 'aged-basmati-rice-2kg',
        status: 'active',
        tags: ['rice', 'basmati', 'aged', 'staples'],
      },

      // ——————————— TURMERIC (uses Turmeric_Powder image) ———————————
      {
        name: 'Turmeric Powder – 200g Pouch',
        price: 2.99,
        originalPrice: null,
        discount: 0,
        description:
          'Vibrant, finely milled turmeric powder made from sun-cured roots. Adds deep golden color and warm, earthy flavor to curries, marinades, and soups. Celebrated for its natural curcumin content—commonly used in wellness beverages like golden milk and ginger-turmeric tea.',
        brand: 'SpiceWorld',
        categoryId: 3, // spices category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Turmeric_Powder_200g_Pouch.jpg?v=1755707996',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Turmeric_Powder_200g_Pouch.jpg?v=1755707996',
        ],
        featured: false,
        stock: 150,
        weight: 0.2,
        sku: 'SPICE-001',
        slug: 'turmeric-powder-200g',
        status: 'active',
        tags: ['turmeric', 'spices', 'curcumin', 'wellness'],
      },
      {
        name: 'Organic Turmeric Powder – 100g',
        price: 3.49,
        originalPrice: null,
        discount: 0,
        description:
          "Certified organic turmeric powder with naturally bold color and aroma. Packed with antioxidants and a gentle peppery bite, it's perfect for health-forward recipes—from detox shots and herbal teas to curries and stir-fries. Small pack, big freshness, easy to finish while flavors are at their peak.",
        brand: 'SpiceWorld',
        categoryId: 3, // spices category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Turmeric_Powder_200g_Pouch.jpg?v=1755707996',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Turmeric_Powder_200g_Pouch.jpg?v=1755707996',
        ],
        featured: true,
        stock: 110,
        weight: 0.1,
        sku: 'SPICE-002',
        slug: 'organic-turmeric-powder-100g',
        status: 'active',
        tags: ['turmeric', 'organic', 'spices', 'wellness'],
      },

      // ——————————— MUSTARD OIL (uses Organic_Mustard_Oil image) ———————————
      {
        name: 'Organic Mustard Oil – 1 Liter',
        price: 6.99,
        originalPrice: null,
        discount: 0,
        description:
          'Traditional cold-pressed mustard oil with a bold, authentic aroma and natural pungency. Retains essential fatty acids and antioxidants thanks to low-heat extraction. A kitchen staple for frying, sautéing, pickling, and marinades—and a time-honored choice for massage and hair care.',
        brand: 'PureNature',
        categoryId: 4, // oils category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Organic_Mustard_Oil_1_Liter_Cold-Pressed.webp?v=1755707996',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Organic_Mustard_Oil_1_Liter_Cold-Pressed.webp?v=1755707996',
        ],
        featured: false,
        stock: 90,
        weight: 1.0,
        sku: 'OIL-001',
        slug: 'organic-mustard-oil-1l',
        status: 'active',
        tags: ['mustard-oil', 'cold-pressed', 'cooking-oil', 'organic'],
      },
      {
        name: 'Cold-Pressed Mustard Oil – 500ml',
        price: 3.99,
        originalPrice: null,
        discount: 0,
        description:
          'Half-liter bottle of robust, cold-pressed mustard oil—great for smaller households or trial use. Distinct flavor suits traditional recipes, from fish fry to achar (pickles). Minimal processing preserves its characteristic kick and wholesome goodness.',
        brand: 'PureNature',
        categoryId: 4, // oils category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Organic_Mustard_Oil_1_Liter_Cold-Pressed.webp?v=1755707996',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Organic_Mustard_Oil_1_Liter_Cold-Pressed.webp?v=1755707996',
        ],
        featured: false,
        stock: 120,
        weight: 0.5,
        sku: 'OIL-002',
        slug: 'cold-pressed-mustard-oil-500ml',
        status: 'active',
        tags: ['mustard-oil', 'cold-pressed', 'cooking', 'pickling'],
      },

      // ——————————— POTATOES (uses Fresh_Potatoes image) ———————————
      {
        name: 'Fresh Potatoes – 2kg Family Pack',
        price: 2.99,
        originalPrice: null,
        discount: 0,
        description:
          'Farm-fresh, firm potatoes selected for consistent size and quality. Versatile for boiling, roasting, frying, and mashing, they hold shape well and deliver a mild, buttery taste. A true everyday essential for homestyle curries, fries, and comfort food classics.',
        brand: 'GreenField Farms',
        categoryId: 2, // vegetables category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Fresh_Potatoes.png?v=1755791869',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Fresh_Potatoes.png?v=1755791869',
        ],
        featured: false,
        stock: 200,
        weight: 2.0,
        sku: 'VEG-001',
        slug: 'fresh-potatoes-2kg',
        status: 'active',
        tags: ['potatoes', 'vegetables', 'staples', 'fresh'],
      },
      {
        name: 'Baby Potatoes – 1kg',
        price: 2.19,
        originalPrice: 2.19,
        discount: 9.1,
        description:
          'Tender, thin-skinned baby potatoes with a naturally sweet, buttery profile. Excellent for roasting whole, pan-frying with herbs, or adding to creamy gravies. Their delicate texture and quick cooking time make them a favorite for weeknight meals and festive sides.',
        brand: 'GreenField Farms',
        categoryId: 2, // vegetables category ID
        coverImage:
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Fresh_Potatoes.png?v=1755791869',
        images: [
          'https://cdn.shopify.com/s/files/1/0850/9797/2012/files/Fresh_Potatoes.png?v=1755791869',
        ],
        featured: true,
        stock: 130,
        weight: 1.0,
        sku: 'VEG-002',
        slug: 'baby-potatoes-1kg',
        status: 'active',
        tags: ['potatoes', 'baby-potatoes', 'fresh', 'roasting'],
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
