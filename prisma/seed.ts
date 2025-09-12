import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // First, create categories
  console.log('Creating categories...');
  await prisma.category.createMany({
    data: [
      {
        name: 'Staples',
        slug: 'staples',
        description:
          'Essential food items including rice, lentils, grains, and basic cooking ingredients',
        icon: '🌾',
        image:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        isActive: true,
        sortOrder: 1,
        metaTitle: 'Staples - Essential Food Items',
        metaDescription:
          'Shop for rice, lentils, grains and essential cooking ingredients',
      },
      {
        name: 'Vegetables',
        slug: 'vegetables',
        description: 'Fresh vegetables and produce for healthy cooking',
        icon: '🥬',
        image:
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        isActive: true,
        sortOrder: 2,
        metaTitle: 'Fresh Vegetables',
        metaDescription: 'Fresh vegetables and produce for healthy meals',
      },
      {
        name: 'Spices & Seasonings',
        slug: 'spices-seasonings',
        description:
          'Aromatic spices, herbs, and seasonings to enhance your cooking',
        icon: '🌶️',
        image:
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        isActive: true,
        sortOrder: 3,
        metaTitle: 'Spices & Seasonings',
        metaDescription: 'Premium spices and seasonings for authentic flavors',
      },
      {
        name: 'Cooking Oils',
        slug: 'cooking-oils',
        description: 'High-quality cooking oils for various culinary needs',
        icon: '🫒',
        image:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        isActive: true,
        sortOrder: 4,
        metaTitle: 'Cooking Oils',
        metaDescription: 'Premium cooking oils for healthy and delicious meals',
      },
      {
        name: 'Dairy & Eggs',
        slug: 'dairy-eggs',
        description: 'Fresh dairy products and eggs',
        icon: '🥛',
        image:
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        isActive: true,
        sortOrder: 5,
        metaTitle: 'Dairy & Eggs',
        metaDescription: 'Fresh dairy products and farm-fresh eggs',
      },
      {
        name: 'Fruits',
        slug: 'fruits',
        description: 'Fresh seasonal fruits and tropical produce',
        icon: '🍎',
        image:
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
        isActive: true,
        sortOrder: 6,
        metaTitle: 'Fresh Fruits',
        metaDescription: 'Fresh seasonal fruits and tropical produce',
      },
    ],
  });

  console.log('Creating products...');
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

      // ——————————— ADDITIONAL VEGETABLES ———————————
      {
        name: 'Fresh Onions – 1kg',
        price: 1.99,
        originalPrice: null,
        discount: 0,
        description:
          'Fresh, firm onions perfect for cooking. Essential ingredient for curries, soups, and everyday cooking. Long shelf life and versatile use.',
        brand: 'GreenField Farms',
        categoryId: 2,
        coverImage:
          'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400',
        images: [
          'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400',
        ],
        featured: false,
        stock: 150,
        weight: 1.0,
        sku: 'VEG-003',
        slug: 'fresh-onions-1kg',
        status: 'active',
        tags: ['onions', 'vegetables', 'fresh', 'cooking'],
      },
      {
        name: 'Fresh Tomatoes – 1kg',
        price: 2.49,
        originalPrice: 2.99,
        discount: 16.7,
        description:
          'Juicy, ripe tomatoes perfect for salads, cooking, and sauces. Rich in vitamins and antioxidants.',
        brand: 'GreenField Farms',
        categoryId: 2,
        coverImage:
          'https://images.unsplash.com/photo-1546470427-227ae4b8b7a0?w=400',
        images: [
          'https://images.unsplash.com/photo-1546470427-227ae4b8b7a0?w=400',
        ],
        featured: true,
        stock: 100,
        weight: 1.0,
        sku: 'VEG-004',
        slug: 'fresh-tomatoes-1kg',
        status: 'active',
        tags: ['tomatoes', 'vegetables', 'fresh', 'vitamins'],
      },

      // ——————————— ADDITIONAL SPICES ———————————
      {
        name: 'Cumin Seeds – 100g',
        price: 1.99,
        originalPrice: null,
        discount: 0,
        description:
          'Aromatic cumin seeds with earthy, warm flavor. Essential for Indian, Middle Eastern, and Mexican cuisines.',
        brand: 'SpiceWorld',
        categoryId: 3,
        coverImage:
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        images: [
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        ],
        featured: false,
        stock: 80,
        weight: 0.1,
        sku: 'SPICE-003',
        slug: 'cumin-seeds-100g',
        status: 'active',
        tags: ['cumin', 'spices', 'seeds', 'aromatic'],
      },
      {
        name: 'Coriander Powder – 200g',
        price: 2.49,
        originalPrice: null,
        discount: 0,
        description:
          'Finely ground coriander powder with citrusy, slightly sweet flavor. Perfect for curries, marinades, and spice blends.',
        brand: 'SpiceWorld',
        categoryId: 3,
        coverImage:
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        images: [
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        ],
        featured: false,
        stock: 90,
        weight: 0.2,
        sku: 'SPICE-004',
        slug: 'coriander-powder-200g',
        status: 'active',
        tags: ['coriander', 'spices', 'powder', 'citrusy'],
      },

      // ——————————— ADDITIONAL OILS ———————————
      {
        name: 'Coconut Oil – 500ml',
        price: 4.99,
        originalPrice: null,
        discount: 0,
        description:
          'Pure virgin coconut oil with natural aroma. Great for cooking, baking, and skincare.',
        brand: 'PureNature',
        categoryId: 4,
        coverImage:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        images: [
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        ],
        featured: false,
        stock: 70,
        weight: 0.5,
        sku: 'OIL-003',
        slug: 'coconut-oil-500ml',
        status: 'active',
        tags: ['coconut-oil', 'virgin', 'cooking', 'skincare'],
      },
      {
        name: 'Sunflower Oil – 1L',
        price: 3.99,
        originalPrice: 4.49,
        discount: 11.1,
        description:
          'Light, neutral-tasting sunflower oil perfect for frying and baking. High in vitamin E.',
        brand: 'PureNature',
        categoryId: 4,
        coverImage:
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        images: [
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        ],
        featured: true,
        stock: 85,
        weight: 1.0,
        sku: 'OIL-004',
        slug: 'sunflower-oil-1l',
        status: 'active',
        tags: ['sunflower-oil', 'light', 'vitamin-e', 'frying'],
      },

      // ——————————— DAIRY & EGGS ———————————
      {
        name: 'Fresh Milk – 1L',
        price: 1.99,
        originalPrice: null,
        discount: 0,
        description:
          'Fresh, whole milk from local farms. Rich in calcium and protein.',
        brand: 'FarmFresh',
        categoryId: 5,
        coverImage:
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        images: [
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        ],
        featured: false,
        stock: 60,
        weight: 1.0,
        sku: 'DAIRY-001',
        slug: 'fresh-milk-1l',
        status: 'active',
        tags: ['milk', 'dairy', 'fresh', 'calcium'],
      },
      {
        name: 'Free Range Eggs – 12 pieces',
        price: 3.49,
        originalPrice: null,
        discount: 0,
        description:
          'Farm-fresh free range eggs with rich, golden yolks. Perfect for breakfast and baking.',
        brand: 'FarmFresh',
        categoryId: 5,
        coverImage:
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        images: [
          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        ],
        featured: true,
        stock: 45,
        weight: 0.6,
        sku: 'DAIRY-002',
        slug: 'free-range-eggs-12',
        status: 'active',
        tags: ['eggs', 'free-range', 'fresh', 'protein'],
      },

      // ——————————— FRUITS ———————————
      {
        name: 'Fresh Bananas – 1kg',
        price: 1.99,
        originalPrice: null,
        discount: 0,
        description:
          'Sweet, ripe bananas perfect for snacking or baking. Rich in potassium and fiber.',
        brand: 'TropicalFruits',
        categoryId: 6,
        coverImage:
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
        images: [
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
        ],
        featured: false,
        stock: 75,
        weight: 1.0,
        sku: 'FRUIT-001',
        slug: 'fresh-bananas-1kg',
        status: 'active',
        tags: ['bananas', 'fruits', 'potassium', 'fiber'],
      },
      {
        name: 'Fresh Apples – 1kg',
        price: 2.99,
        originalPrice: 3.49,
        discount: 14.3,
        description:
          'Crisp, sweet apples perfect for snacking or cooking. Rich in antioxidants.',
        brand: 'TropicalFruits',
        categoryId: 6,
        coverImage:
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
        images: [
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
        ],
        featured: true,
        stock: 65,
        weight: 1.0,
        sku: 'FRUIT-002',
        slug: 'fresh-apples-1kg',
        status: 'active',
        tags: ['apples', 'fruits', 'antioxidants', 'crisp'],
      },

      // ——————————— ADDITIONAL STAPLES ———————————
      {
        name: 'Whole Wheat Flour – 2kg',
        price: 4.99,
        originalPrice: null,
        discount: 0,
        description:
          'Premium whole wheat flour perfect for baking bread, rotis, and healthy baked goods.',
        brand: 'GoldenGrain',
        categoryId: 1,
        coverImage:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        images: [
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        ],
        featured: false,
        stock: 50,
        weight: 2.0,
        sku: 'STAPLE-001',
        slug: 'whole-wheat-flour-2kg',
        status: 'active',
        tags: ['flour', 'wheat', 'baking', 'healthy'],
      },
      {
        name: 'Chickpeas (Chana) – 500g',
        price: 2.99,
        originalPrice: null,
        discount: 0,
        description:
          'High-protein chickpeas perfect for curries, salads, and hummus. Rich in fiber and plant protein.',
        brand: 'FreshHarvest',
        categoryId: 1,
        coverImage:
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        images: [
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        ],
        featured: true,
        stock: 85,
        weight: 0.5,
        sku: 'STAPLE-002',
        slug: 'chickpeas-chana-500g',
        status: 'active',
        tags: ['chickpeas', 'protein', 'fiber', 'vegan'],
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
