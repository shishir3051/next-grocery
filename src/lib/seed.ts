import mongoose from 'mongoose';
import { Product, Category } from '../models/Product';
import { News } from '../models/News';
import dbConnect from './mongodb';
import { getBase64FromUrl } from './imageUtils';

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
  },
  {
    name: 'Snacks & Sweets',
    slug: 'snacks-sweets',
    icon: '🍪',
    level: 0,
    subcategories: [
      { name: 'Biscuits', slug: 'biscuits', icon: '🍪', level: 1 },
      { name: 'Chips', slug: 'chips', icon: '🥔', level: 1 },
      { name: 'Chocolates', slug: 'chocolates', icon: '🍫', level: 1 },
    ]
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    icon: '🧃',
    level: 0,
    subcategories: [
      { name: 'Tea & Coffee', slug: 'tea-coffee', icon: '☕', level: 1 },
      { name: 'Juices', slug: 'juices', icon: '🍹', level: 1 },
    ]
  }
];

const products = [
  // Vegetables
  {
    name: 'Potato Regular', slug: 'potato-regular', description: 'High-quality regular potatoes.', price: 45, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Potato', categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Red Tomato', slug: 'red-tomato', description: 'Fresh and juicy red tomatoes.', price: 60, unit: '500 gm', image: 'https://placehold.co/400x400/png?text=Tomato', categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Local Onion (Deshi)', slug: 'local-onion-deshi', description: 'Flavorful local red onions.', price: 85, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Onion', categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Green Chili', slug: 'green-chili', description: 'Fresh and spicy green chilies.', price: 40, unit: '250 gm', image: 'https://placehold.co/400x400/png?text=Green+Chili', categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Cucumber', slug: 'cucumber', description: 'Farm fresh crispy cucumber.', price: 30, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Cucumber', categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Carrot', slug: 'carrot', description: 'Fresh orange carrots.', price: 50, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Carrot', categorySlug: 'fresh-vegetables',
  },
  {
    name: 'Lemon', slug: 'lemon', description: 'Fresh sour lemons.', price: 20, unit: '4 pcs', image: 'https://placehold.co/400x400/png?text=Lemon', categorySlug: 'fresh-vegetables',
  },
  
  // Fruits
  {
    name: 'Gala Apples', slug: 'gala-apples', description: 'Sweet and crunchy Gala apples.', price: 320, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Apple', categorySlug: 'fresh-fruits',
  },
  {
    name: 'Sagar Banana', slug: 'sagar-banana', description: 'Sweet local Sagar Bananas.', price: 60, unit: '4 pcs', image: 'https://placehold.co/400x400/png?text=Banana', categorySlug: 'fresh-fruits',
  },
  {
    name: 'Sweet Orange (Malta)', slug: 'sweet-orange', description: 'Imported sweet oranges.', price: 220, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Orange', categorySlug: 'fresh-fruits',
  },
  {
    name: 'Pomegranate', slug: 'pomegranate', description: 'Fresh red pomegranate.', price: 350, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Pomegranate', categorySlug: 'fresh-fruits',
  },
  {
    name: 'Green Grapes', slug: 'green-grapes', description: 'Sweet green grapes.', price: 250, unit: '500 gm', image: 'https://placehold.co/400x400/png?text=Grapes', categorySlug: 'fresh-fruits',
  },

  // Dairy & Eggs
  {
    name: 'Aarong Fresh Pasteurized Milk', slug: 'aarong-milk', description: 'Pure and fresh pasteurized milk.', price: 90, unit: '1 liter', image: 'https://placehold.co/400x400/png?text=Milk', categorySlug: 'milk',
  },
  {
    name: 'Farm Fresh Brown Eggs', slug: 'brown-eggs', description: 'Premium quality brown eggs.', price: 155, unit: '12 pcs', image: 'https://placehold.co/400x400/png?text=Brown+Eggs', categorySlug: 'eggs',
  },
  {
    name: 'Deshi Chicken Eggs', slug: 'deshi-eggs', description: 'Local deshi chicken eggs.', price: 90, unit: '6 pcs', image: 'https://placehold.co/400x400/png?text=Deshi+Eggs', categorySlug: 'eggs',
  },
  {
    name: 'Aarong Salted Butter', slug: 'aarong-butter', description: 'Fresh salted butter.', price: 220, unit: '200 gm', image: 'https://placehold.co/400x400/png?text=Butter', categorySlug: 'butter-cheese',
  },
  {
    name: 'Mozzarella Cheese block', slug: 'mozzarella-cheese', description: 'Imported pizza cheese.', price: 380, unit: '200 gm', image: 'https://placehold.co/400x400/png?text=Cheese', categorySlug: 'butter-cheese',
  },

  // Cooking
  {
    name: 'Miniket Rice (Premium)', slug: 'miniket-rice', description: 'Premium quality Miniket rice.', price: 350, unit: '5 kg', image: 'https://placehold.co/400x400/png?text=Rice', categorySlug: 'rice',
  },
  {
    name: 'Basmati Rice', slug: 'basmati-rice', description: 'Long grain Basmati rice.', price: 320, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Basmati', categorySlug: 'rice',
  },
  {
    name: 'Rupchanda Soybean Oil', slug: 'soybean-oil', description: 'Healthy and fortified soybean oil.', price: 170, unit: '1 liter', image: 'https://placehold.co/400x400/png?text=Soybean+Oil', categorySlug: 'oil',
  },
  {
    name: 'Radhuni Mustard Oil', slug: 'mustard-oil', description: 'Pure mustard oil.', price: 240, unit: '1 liter', image: 'https://placehold.co/400x400/png?text=Mustard+Oil', categorySlug: 'oil',
  },
  {
    name: 'Radhuni Turmeric Powder', slug: 'turmeric-powder', description: 'Quality turmeric powder.', price: 70, unit: '200 gm', image: 'https://placehold.co/400x400/png?text=Turmeric', categorySlug: 'spices',
  },
  {
    name: 'Radhuni Chili Powder', slug: 'chili-powder', description: 'Hot chili powder.', price: 80, unit: '200 gm', image: 'https://placehold.co/400x400/png?text=Chili+Powder', categorySlug: 'spices',
  },
  {
    name: 'Fresh Salt', slug: 'fresh-salt', description: 'Iodized salt.', price: 40, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Salt', categorySlug: 'spices',
  },

  // Meat & Fish
  {
    name: 'Chicken Broiler (Skin Off)', slug: 'chicken-broiler', description: 'Fresh broiler chicken.', price: 210, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Chicken', categorySlug: 'chicken',
  },
  {
    name: 'Deshi Chicken', slug: 'deshi-chicken', description: 'Fresh local chicken.', price: 550, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Deshi+Chicken', categorySlug: 'chicken',
  },
  {
    name: 'Beef Boneless', slug: 'beef-boneless', description: 'Fresh boneless beef.', price: 850, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Beef', categorySlug: 'beef',
  },
  {
    name: 'Ruhi Fish', slug: 'ruhi-fish', description: 'Fresh Ruhi fish whole.', price: 450, unit: '1 kg', image: 'https://placehold.co/400x400/png?text=Ruhi+Fish', categorySlug: 'fish',
  },
  {
    name: 'Hilsha Fish (Ilish)', slug: 'hilsha-fish', description: 'Fresh Hilsha fish.', price: 1200, unit: '1 pc (800g)', image: 'https://placehold.co/400x400/png?text=Hilsha', categorySlug: 'fish',
  },
  
  // Snacks & Sweets
  {
    name: 'Oreo Biscuits', slug: 'oreo-biscuits', description: 'Chocolate sandwich biscuits.', price: 60, unit: '120 gm', image: 'https://placehold.co/400x400/png?text=Oreo', categorySlug: 'biscuits',
  },
  {
    name: 'Energy Plus Biscuit', slug: 'energy-plus', description: 'Healthy wheat biscuits.', price: 40, unit: '150 gm', image: 'https://placehold.co/400x400/png?text=Biscuits', categorySlug: 'biscuits',
  },
  {
    name: 'Lays Classic Potato Chips', slug: 'lays-classic', description: 'Salty classic potato chips.', price: 50, unit: '50 gm', image: 'https://placehold.co/400x400/png?text=Lays', categorySlug: 'chips',
  },
  {
    name: 'Bombay Sweets Potato Crackers', slug: 'potato-crackers', description: 'Spicy potato crackers.', price: 15, unit: '25 gm', image: 'https://placehold.co/400x400/png?text=Crackers', categorySlug: 'chips',
  },
  {
    name: 'Dairy Milk Chocolate', slug: 'dairy-milk', description: 'Cadbury Dairy Milk.', price: 80, unit: '50 gm', image: 'https://placehold.co/400x400/png?text=Chocolate', categorySlug: 'chocolates',
  },
  {
    name: 'KitKat 4 Finger', slug: 'kitkat', description: 'Nestle KitKat chocolate.', price: 65, unit: '1 pc', image: 'https://placehold.co/400x400/png?text=KitKat', categorySlug: 'chocolates',
  },

  // Beverages
  {
    name: 'Ispahani Mirzapore Tea', slug: 'ispahani-tea', description: 'Best quality red tea.', price: 105, unit: '200 gm', image: 'https://placehold.co/400x400/png?text=Tea', categorySlug: 'tea-coffee',
  },
  {
    name: 'Nescafe Classic Coffee', slug: 'nescafe-coffee', description: 'Rich aroma instant coffee.', price: 140, unit: '50 gm', image: 'https://placehold.co/400x400/png?text=Coffee', categorySlug: 'tea-coffee',
  },
  {
    name: 'Pran Mango Juice', slug: 'pran-mango-juice', description: 'Sweet mango fruit juice.', price: 35, unit: '250 ml', image: 'https://placehold.co/400x400/png?text=Mango+Juice', categorySlug: 'juices',
  },
  {
    name: 'Coca Cola', slug: 'coca-cola', description: 'Refreshing cola drink.', price: 40, unit: '500 ml', image: 'https://placehold.co/400x400/png?text=Coca+Cola', categorySlug: 'juices',
  },
  {
    name: 'Sprite', slug: 'sprite', description: 'Refreshing lemon drink.', price: 40, unit: '500 ml', image: 'https://placehold.co/400x400/png?text=Sprite', categorySlug: 'juices',
  },
  {
    name: 'Kinley Drinking Water', slug: 'kinley-water', description: 'Pure drinking water.', price: 20, unit: '1 liter', image: 'https://placehold.co/400x400/png?text=Water', categorySlug: 'juices',
  }
];

export const newsArticles = [
  {
    title: "FreshBasket Expands Delivery to 10 New Areas in Dhaka",
    slug: "delivery-expansion-dhaka",
    category: "Company News",
    readTime: "3 min read",
    image: null,
    excerpt: "We are thrilled to announce that our express grocery delivery service is now available in Uttara, Mirpur, and Bashundhara R/A. This expansion is part of our commitment to bringing farm-fresh quality to every doorstep in the city.",
    content: "We are thrilled to announce that our express grocery delivery service is now available in Uttara, Mirpur, and Bashundhara R/A. This expansion is part of our commitment to bringing farm-fresh quality to every doorstep in the city.\n\nOur operations team has been working tirelessly to establish new hubs in these key residential areas. With more delivery riders on the road and localized distribution centers, we can now guarantee 60-minute delivery to thousands of new customers.\n\nWhy did we choose these areas? Uttara and Mirpur have seen a massive surge in demand for quality groceries. We heard your requests on social media and made it our top priority for Q2 2026. Stay tuned for more expansion news as we look towards Chittagong and Sylhet later this year!"
  },
  {
    title: "The Health Benefits of Sourcing Organic Vegetables",
    slug: "organic-health-benefits",
    category: "Healthy Living",
    readTime: "5 min read",
    image: null,
    excerpt: "Eating organic isn't just a trend; it's a lifestyle. Discover why farm-fresh, pesticide-free vegetables are crucial for your long-term health and the environment.",
    content: "Eating organic isn't just a trend; it's a lifestyle. Discover why farm-fresh, pesticide-free vegetables are crucial for your long-term health and the environment.\n\nOrganic farming avoids the use of synthetic pesticides and fertilizers, which means the vegetables you eat are as close to nature as possible. Studies show that organic produce can have higher levels of antioxidants and certain nutrients compared to conventionally grown crops.\n\nBeyond personal health, choosing organic supports sustainable farming practices that protect soil quality and biodiversity. At FreshBasket, we partner directly with certified organic farmers across Bangladesh to ensure you get the best quality without the chemical residue. Transitioning to an organic diet can improve your digestion, energy levels, and overall well-being."
  },
  {
    title: "5 Tips for Keeping Your Groceries Fresh Longer",
    slug: "groceries-fresh-tips",
    category: "Tips & Tricks",
    readTime: "4 min read",
    image: null,
    excerpt: "Learn the professional secrets of food storage. From humidity settings to proper container usage, keep your greens crisp for days with our expert guide.",
    content: "Learn the professional secrets of food storage. From humidity settings to proper container usage, keep your greens crisp for days with our expert guide.\n\n1. Use the Crisper Drawer Correctly: Did you know that different vegetables need different humidity levels? Greens like lettuce and spinach love high humidity, while fruits like apples should be kept in a lower-humidity environment.\n\n2. Don't Wash Before Storing: Moisture is the enemy of shelf-life. Only wash your produce right before you're ready to eat it.\n\n3. Breathable Containers: For berries and soft fruits, use containers that allow for some airflow to prevent mold growth.\n\n4. Keep Ethylene Producers Apart: Some fruits like bananas release ethylene gas, which can cause other vegetables to ripen and rot faster. Keep them in separate bowls!\n\n5. Refrigerate Onions and Potatoes Carefully: Potatoes should be kept in a cool, dark place but not necessarily the fridge, as it can turn their starches to sugar."
  }
];

export async function seed() {
  try {
    const conn = await dbConnect();
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await News.deleteMany({});
    console.log('Cleared existing data.');

    // Seed News Articles
    for (const article of newsArticles) {
      await News.create(article);
    }
    console.log('News articles seeded.');

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
    let count = 0;
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
        count++;
        // console.log(`Seeded: ${prod.name}`);
      }
    }
    console.log(`Products seeded successfully: ${count} items.`);

  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

// Allow independent execution
if (require.main === module) {
  seed().then(() => {
    console.log('Seeding done.');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
