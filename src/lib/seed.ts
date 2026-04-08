import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Product, Category } from '../models/Product';
import { News } from '../models/News';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Settings } from '../models/Settings';
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
  { name: 'Potato Regular', slug: 'potato-regular', description: 'High-quality regular potatoes sourced from local farms.', price: 45, discountPrice: 40, unit: '1 kg', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Red Tomato', slug: 'red-tomato', description: 'Fresh and juicy red tomatoes, perfect for salads and curries.', price: 60, unit: '500 gm', image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Local Onion (Deshi)', slug: 'local-onion-deshi', description: 'Flavorful local deshi red onions for everyday cooking.', price: 85, unit: '1 kg', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Green Chili', slug: 'green-chili', description: 'Fresh and spicy green chilies, hand-picked daily.', price: 40, unit: '250 gm', image: 'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Cucumber', slug: 'cucumber', description: 'Farm fresh crispy cucumber, great for salads.', price: 30, unit: '1 kg', image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Carrot', slug: 'carrot', description: 'Fresh orange carrots, rich in beta-carotene.', price: 50, unit: '1 kg', image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Lemon', slug: 'lemon', description: 'Fresh sour lemons, perfect for drinks and cooking.', price: 20, unit: '4 pcs', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80', categorySlug: 'fresh-vegetables' },
  { name: 'Broccoli', slug: 'broccoli', description: 'Farm fresh green broccoli, packed with nutrients and vitamins.', price: 120, unit: '500 gm', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80', categorySlug: 'fresh-vegetables' },

  // Fruits
  { name: 'Gala Apples', slug: 'gala-apples', description: 'Sweet and crunchy imported Gala apples.', price: 320, discountPrice: 280, unit: '1 kg', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80', categorySlug: 'fresh-fruits' },
  { name: 'Sagar Banana', slug: 'sagar-banana', description: 'Sweet local Sagar Bananas, naturally ripened.', price: 60, unit: '4 pcs', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', categorySlug: 'fresh-fruits' },
  { name: 'Sweet Orange (Malta)', slug: 'sweet-orange', description: 'Juicy imported oranges, bursting with Vitamin C.', price: 220, unit: '1 kg', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80', categorySlug: 'fresh-fruits' },
  { name: 'Pomegranate', slug: 'pomegranate', description: 'Fresh ruby red pomegranate, antioxidant-rich superfood.', price: 350, unit: '1 kg', image: 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400&q=80', categorySlug: 'fresh-fruits' },
  { name: 'Green Grapes', slug: 'green-grapes', description: 'Sweet seedless green grapes, freshly imported.', price: 250, discountPrice: 220, unit: '500 gm', image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80', categorySlug: 'fresh-fruits' },
  { name: 'Watermelon', slug: 'watermelon', description: 'Fresh summer watermelon, sweet and very hydrating.', price: 80, unit: '1 pc (approx 2kg)', image: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400&q=80', categorySlug: 'fresh-fruits' },

  // Dairy & Eggs
  { name: 'Aarong Fresh Pasteurized Milk', slug: 'aarong-milk', description: 'Pure and fresh pasteurized milk from Aarong Dairy.', price: 90, unit: '1 liter', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', categorySlug: 'milk' },
  { name: 'Farm Fresh Brown Eggs', slug: 'brown-eggs', description: 'Premium quality cage-free brown eggs, freshly sourced.', price: 155, unit: '12 pcs', image: 'https://images.unsplash.com/photo-1612257416648-f1de5b80bfb6?w=400&q=80', categorySlug: 'eggs' },
  { name: 'Deshi Chicken Eggs', slug: 'deshi-eggs', description: 'Local free-range deshi chicken eggs with richer yolk.', price: 90, unit: '6 pcs', image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80', categorySlug: 'eggs' },
  { name: 'Aarong Salted Butter', slug: 'aarong-butter', description: 'Rich and creamy salted butter from Aarong Dairy.', price: 220, unit: '200 gm', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', categorySlug: 'butter-cheese' },
  { name: 'Mozzarella Cheese Block', slug: 'mozzarella-cheese', description: 'High-quality imported mozzarella, perfect for pizza.', price: 380, unit: '200 gm', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80', categorySlug: 'butter-cheese' },

  // Cooking
  { name: 'Miniket Rice (Premium)', slug: 'miniket-rice', description: 'Premium quality aromatic Miniket rice, polished grain.', price: 350, unit: '5 kg', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80', categorySlug: 'rice' },
  { name: 'Basmati Rice', slug: 'basmati-rice', description: 'Long grain fragrant Basmati rice, imported quality.', price: 320, discountPrice: 295, unit: '1 kg', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', categorySlug: 'rice' },
  { name: 'Rupchanda Soybean Oil', slug: 'soybean-oil', description: 'Healthy vitamin-fortified soybean cooking oil.', price: 170, unit: '1 liter', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', categorySlug: 'oil' },
  { name: 'Radhuni Mustard Oil', slug: 'mustard-oil', description: '100% pure cold-pressed mustard oil.', price: 240, unit: '1 liter', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80', categorySlug: 'oil' },
  { name: 'Radhuni Turmeric Powder', slug: 'turmeric-powder', description: 'Fresh ground turmeric with vibrant yellow color.', price: 70, unit: '200 gm', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80', categorySlug: 'spices' },
  { name: 'Radhuni Chili Powder', slug: 'chili-powder', description: 'Hot and flavorful red chili powder for curries.', price: 80, unit: '200 gm', image: 'https://images.unsplash.com/photo-1598456668200-00c2af4d89b7?w=400&q=80', categorySlug: 'spices' },
  { name: 'Fresh Salt', slug: 'fresh-salt', description: 'Pure iodized table salt.', price: 40, unit: '1 kg', image: 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=400&q=80', categorySlug: 'spices' },

  // Meat & Fish
  { name: 'Chicken Broiler (Skin Off)', slug: 'chicken-broiler', description: 'Fresh cleaned broiler chicken, skinless and halal.', price: 210, unit: '1 kg', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80', categorySlug: 'chicken' },
  { name: 'Deshi Chicken', slug: 'deshi-chicken', description: 'Fresh free-range local deshi chicken, more flavorful.', price: 550, unit: '1 kg', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c1?w=400&q=80', categorySlug: 'chicken' },
  { name: 'Beef Boneless', slug: 'beef-boneless', description: 'Fresh premium boneless beef, freshly cut and cleaned.', price: 850, unit: '1 kg', image: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80', categorySlug: 'beef' },
  { name: 'Ruhi Fish', slug: 'ruhi-fish', description: 'Fresh river Ruhi fish, cleaned and cut to order.', price: 450, unit: '1 kg', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80', categorySlug: 'fish' },
  { name: 'Hilsha Fish (Ilish)', slug: 'hilsha-fish', description: 'The national fish of Bangladesh. Premium fresh Hilsha.', price: 1200, unit: '1 pc (800g)', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80', categorySlug: 'fish' },

  // Snacks & Sweets
  { name: 'Oreo Biscuits', slug: 'oreo-biscuits', description: "America's favorite chocolate sandwich cookie, classic flavor.", price: 60, unit: '120 gm', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', categorySlug: 'biscuits' },
  { name: 'Energy Plus Biscuit', slug: 'energy-plus', description: 'Healthy wheat-based energy biscuits for all ages.', price: 40, unit: '150 gm', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80', categorySlug: 'biscuits' },
  { name: 'Lays Classic Potato Chips', slug: 'lays-classic', description: 'Light and crispy perfectly salted potato chips.', price: 50, unit: '50 gm', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', categorySlug: 'chips' },
  { name: 'Bombay Sweets Crackers', slug: 'potato-crackers', description: 'Spicy desi-style potato crackers, crispy and tasty.', price: 15, unit: '25 gm', image: 'https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?w=400&q=80', categorySlug: 'chips' },
  { name: 'Dairy Milk Chocolate', slug: 'dairy-milk', description: 'Cadbury Dairy Milk creamy milk chocolate bar.', price: 80, unit: '50 gm', image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80', categorySlug: 'chocolates' },
  { name: 'KitKat 4 Finger', slug: 'kitkat', description: 'Nestle KitKat crispy wafer chocolate bar.', price: 65, unit: '1 pc', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80', categorySlug: 'chocolates' },

  // Beverages
  { name: 'Ispahani Mirzapore Tea', slug: 'ispahani-tea', description: "Bangladesh's No. 1 premium red tea blend.", price: 105, unit: '200 gm', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80', categorySlug: 'tea-coffee' },
  { name: 'Nescafe Classic Coffee', slug: 'nescafe-coffee', description: 'Rich full-bodied instant coffee with bold aroma.', price: 140, unit: '50 gm', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', categorySlug: 'tea-coffee' },
  { name: 'Pran Mango Juice', slug: 'pran-mango-juice', description: 'Refreshing sweet mango fruit drink, made from real mangoes.', price: 35, unit: '250 ml', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', categorySlug: 'juices' },
  { name: 'Coca Cola', slug: 'coca-cola', description: 'The classic original refreshing cola drink.', price: 40, unit: '500 ml', image: 'https://images.unsplash.com/photo-1554475900-0a0350e3fc7b?w=400&q=80', categorySlug: 'juices' },
  { name: 'Sprite', slug: 'sprite', description: 'Crisp and refreshing lemon-lime carbonated drink.', price: 40, unit: '500 ml', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80', categorySlug: 'juices' },
  { name: 'Kinley Drinking Water', slug: 'kinley-water', description: 'Pure purified drinking water, safe and clean.', price: 20, unit: '1 liter', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80', categorySlug: 'juices' },
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
    await User.deleteMany({});
    await Order.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared existing data.');

    // Seed Settings
    await Settings.create({
      storeName: 'Fresh Basket',
      supportEmail: 'support@freshbasket.com',
      supportPhone: '01700000000',
      deliveryFee: 50,
      minFreeDelivery: 500,
      maintenanceMode: false
    });
    console.log('Settings seeded.');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@freshbasket.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      walletBalance: 1000
    });
    
    const customer1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      walletBalance: 50,
      address: {
        street: 'House 12, Road 4',
        city: 'Dhaka',
        zipCode: '1212',
        phone: '01711111111'
      }
    });
    
    const customer2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      walletBalance: 0,
      address: {
        street: 'Apt 4B, Dhanmondi',
        city: 'Dhaka',
        zipCode: '1205',
        phone: '01822222222'
      }
    });
    console.log('Users seeded.');

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

    // Seed Orders
    const allProducts = await Product.find({}).limit(5).lean();
    if (allProducts.length > 0) {
      const order1 = await Order.create({
        user: customer1._id,
        items: [
          {
            productId: allProducts[0]._id,
            name: allProducts[0].name,
            price: allProducts[0].price,
            quantity: 2,
            image: allProducts[0].image
          },
          {
            productId: allProducts[1]._id,
            name: allProducts[1].name,
            price: allProducts[1].price,
            quantity: 1,
            image: allProducts[1].image
          }
        ],
        totalAmount: (allProducts[0].price * 2) + allProducts[1].price + 50,
        shippingAddress: customer1.address,
        status: 'delivered',
        paymentProvider: 'cod',
        paymentStatus: 'paid'
      });

      const order2 = await Order.create({
        user: customer2._id,
        items: [
          {
            productId: allProducts[2]._id,
            name: allProducts[2].name,
            price: allProducts[2].price,
            quantity: 3,
            image: allProducts[2].image
          }
        ],
        totalAmount: (allProducts[2].price * 3) + 50,
        shippingAddress: customer2.address,
        status: 'pending',
        paymentProvider: 'sslcommerz',
        paymentStatus: 'unpaid'
      });
      console.log('Orders seeded.');
    }

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
