import mongoose from 'mongoose';
import { Product, Category } from '@/models/Product';
import dbConnect from '@/lib/mongodb';
import { getBase64FromUrl } from '@/lib/imageUtils';

const categories = [
  {
    name: 'Fruits & Vegetables',
    slug: 'fruits-vegetables',
    icon: '🥗',
    level: 0,
    subcategories: [
      { name: 'Fresh Vegetables', slug: 'fresh-vegetables', icon: '🥦', level: 1 },
      { name: 'Fresh Fruits', slug: 'fresh-fruits', icon: '🍎', level: 1 },
    ]
  },
  {
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    icon: '🥚',
    level: 0,
    subcategories: [
      { name: 'Milk', slug: 'milk', icon: '🥛', level: 1 },
      { name: 'Eggs', slug: 'eggs', icon: '🍳', level: 1 },
      { name: 'Butter & Cheese', slug: 'butter-cheese', icon: '🧀', level: 1 },
    ]
  },
  {
    name: 'Cooking',
    slug: 'cooking',
    icon: '🍳',
    level: 0,
    subcategories: [
      { name: 'Rice', slug: 'rice', icon: '🍚', level: 1 },
      { name: 'Oil', slug: 'oil', icon: '🛢️', level: 1 },
      { name: 'Spices', slug: 'spices', icon: '🌶️', level: 1 },
    ]
  },
  {
    name: 'Meat & Fish',
    slug: 'meat-fish',
    icon: '🥩',
    level: 0,
    subcategories: [
      { name: 'Chicken', slug: 'chicken', icon: '🍗', level: 1 },
      { name: 'Fish', slug: 'fish', icon: '🐟', level: 1 },
      { name: 'Beef', slug: 'beef', icon: '🥩', level: 1 },
    ]
  }
];

const products = [
  {
    name: 'Potato Regular',
    slug: 'potato-regular',
    description: 'High-quality regular potatoes, a staple for every kitchen.',
    price: 45,
    unit: '1 kg',
    image: 'https://chaldn.com/_mpimg/potato-regular-50-gm-1-kg/990c8850-9f5e-4c7b-9f8d-7a0e3f8a6a1c',
    categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Red Tomato',
    slug: 'red-tomato',
    description: 'Fresh and juicy red tomatoes, perfect for salads and cooking.',
    price: 60,
    unit: '500 gm',
    image: 'https://chaldn.com/_mpimg/red-tomato-25-gm-500-gm/5d6e7f8a-9b0c-4d1e-8f2a-3c4d5e6f7a8b',
    categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Local Onion (Deshi)',
    slug: 'local-onion-deshi',
    description: 'Flavorful local red onions, essential for Bangladeshi cuisine.',
    price: 85,
    unit: '1 kg',
    image: 'https://chaldn.com/_mpimg/onion-local-50-gm-1-kg/1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Gala Apples',
    slug: 'gala-apples',
    description: 'Sweet and crunchy Gala apples imported from premium orchards.',
    price: 320,
    unit: '1 kg',
    image: 'https://chaldn.com/_mpimg/gala-apple-1-kg/a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
    categorySlug: 'fresh-fruits',
  },
  {
    name: 'Aarong Fresh Pasteurized Milk',
    slug: 'aarong-fresh-pasteurized-milk',
    description: 'Pure and fresh pasteurized milk from Aarong Dairy.',
    price: 90,
    unit: '1 liter',
    image: 'https://chaldn.com/_mpimg/aarong-fresh-pasteurized-milk-1-ltr/f1e2d3c4-b5a6-9876-5432-10fedcba9876',
    categorySlug: 'milk',
  },
  {
    name: 'Farm Fresh Brown Eggs',
    slug: 'farm-fresh-brown-eggs',
    description: 'Premium quality farm fresh brown eggs, rich in nutrients.',
    price: 155,
    unit: '12 pcs',
    image: 'https://chaldn.com/_mpimg/farm-fresh-brown-eggs-12-pcs/e1d2c3b4-a5a6-b7c8-d9e0-f1a2b3c4d5e6',
    categorySlug: 'eggs',
  },
  {
    name: 'Chicken Broiler (Skin Off)',
    slug: 'chicken-broiler-skin-off',
    description: 'Fresh broiler chicken, skin removed and cleaned.',
    price: 210,
    unit: '1 kg',
    image: 'https://chaldn.com/_mpimg/chicken-broiler-skin-off-1-kg/c1b2a3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
    categorySlug: 'chicken',
  },
  {
    name: 'Beef Boneless',
    slug: 'beef-boneless',
    description: 'Fresh and tender boneless beef from local markets.',
    price: 850,
    unit: '1 kg',
    image: 'https://chaldn.com/_mpimg/beef-boneless-1-kg/b1a2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
    categorySlug: 'beef',
  }
];

export async function seed() {
  try {
    const conn = await dbConnect();
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data.');

    // Seed Categories
    const categoryMap = new Map();
    for (const cat of categories) {
      const parent = await Category.create({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        level: cat.level,
        parentId: null
      });
      categoryMap.set(cat.slug, parent._id);

      for (const sub of cat.subcategories) {
        const subCat = await Category.create({
          name: sub.name,
          slug: sub.slug,
          icon: sub.icon,
          level: sub.level,
          parentId: parent._id
        });
        categoryMap.set(sub.slug, subCat._id);
      }
    }
    console.log('Categories seeded.');

    // Seed Products
    console.log('Fetching images and seeding products...');
    for (const prod of products) {
      const categoryId = categoryMap.get(prod.categorySlug);
      if (categoryId) {
        // Download and convert image to Base64
        const imageData = await getBase64FromUrl(prod.image);
        
        await Product.create({
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          unit: prod.unit,
          image: prod.image, // Still keep the URL as fallback
          imageData: imageData || undefined, // Store base64 data
          category: categoryId,
          stock: 50,
          isHalal: true
        });
        console.log(`Seeded: ${prod.name}`);
      }
    }
    console.log('Products seeded successfully with internal image data.');

  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}
