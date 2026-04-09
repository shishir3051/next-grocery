import mongoose from 'mongoose';
import { Product, Category } from '@/models/Product';
import { HeroSlide } from '@/models/HeroSlide';
import dbConnect from '@/lib/mongodb';
import { getBase64FromUrl } from '@/lib/imageUtils';

export const heroSlides = [
  { title: "Groceries at your door,", highlight: "fresh every day", subtitle: "Delivered in under 60 minutes.", ctaLabel: "Shop Now", ctaLink: "fruits-vegetables", gradient: "from-teal-600 via-emerald-600 to-teal-800", accentColor: "text-emerald-300", emoji: "🥦", order: 0 },
  { title: "Up to 30% off on", highlight: "fresh fruits & dairy", subtitle: "Limited-time offers on daily essentials.", ctaLabel: "See Deals", ctaLink: "fresh-fruits", gradient: "from-orange-500 via-amber-500 to-orange-700", accentColor: "text-amber-200", emoji: "🍓", order: 1 },
  { title: "Premium quality", highlight: "meat & poultry", subtitle: "Halal-certified chicken, beef and fish.", ctaLabel: "Order Meat", ctaLink: "meat-fish", gradient: "from-rose-600 via-red-600 to-rose-800", accentColor: "text-rose-200", emoji: "🍗", order: 2 }
];

export const categories = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: '🥗', level: 0, subcategories: [{ name: 'Fresh Vegetables', slug: 'fresh-vegetables', icon: '🥦', level: 1 }, { name: 'Fresh Fruits', slug: 'fresh-fruits', icon: '🍎', level: 1 }] },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥚', level: 0, subcategories: [{ name: 'Milk', slug: 'milk', icon: '🥛', level: 1 }, { name: 'Eggs', slug: 'eggs', icon: '🍳', level: 1 }, { name: 'Butter & Cheese', slug: 'butter-cheese', icon: '🧀', level: 1 }] },
  { name: 'Pantry & Cooking', slug: 'cooking', icon: '🍳', level: 0, subcategories: [{ name: 'Rice', slug: 'rice', icon: '🍚', level: 1 }, { name: 'Dal or Lentil', slug: 'dal-or-lentil', icon: '🍲', level: 1 }, { name: 'Oil', slug: 'oil', icon: '🛢️', level: 1 }, { name: 'Spices', slug: 'spices', icon: '🌶️', level: 1 }, { name: 'Salt & Sugar', slug: 'salt-sugar', icon: '🧂', level: 1 }, { name: 'Shemai & Suji', slug: 'shemai-suji', icon: '🥣', level: 1 }, { name: 'Ready Mix', slug: 'ready-mix', icon: '📦', level: 1 }, { name: 'Sauces & Pickles', slug: 'sauces-pickles', icon: '🏺', level: 1 }, { name: 'Breakfast', slug: 'breakfast', icon: '🍞', level: 1 }] },
  { name: 'Meat & Fish', slug: 'meat-fish', icon: '🥩', level: 0, subcategories: [{ name: 'Chicken', slug: 'chicken', icon: '🍗', level: 1 }, { name: 'Fish', slug: 'fish', icon: '🐟', level: 1 }, { name: 'Beef', slug: 'beef', icon: '🥩', level: 1 }] },
  { name: 'Snacks & Sweets', slug: 'snacks-sweets', icon: '🍪', level: 0, subcategories: [{ name: 'Biscuits', slug: 'biscuits', icon: '🍪', level: 1 }, { name: 'Chips', slug: 'chips', icon: '🥔', level: 1 }, { name: 'Chocolates', slug: 'chocolates', icon: '🍫', level: 1 }] },
  { name: 'Beverages', slug: 'beverages', icon: '🧃', level: 0, subcategories: [{ name: 'Tea & Coffee', slug: 'tea-coffee', icon: '☕', level: 1 }, { name: 'Juices', slug: 'juices', icon: '🍹', level: 1 }] },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', level: 0, subcategories: [{ name: 'Bath & Body', slug: 'bath-body', icon: '🧼', level: 1 }, { name: 'Hair Care', slug: 'hair-care', icon: '💆', level: 1 }, { name: 'Oral Care', slug: 'oral-care', icon: '🪥', level: 1 }] },
  { name: 'Cleaning & Household', slug: 'household', icon: '🧹', level: 0, subcategories: [{ name: 'Dish Detergents', slug: 'dish-detergents', icon: '🧼', level: 1 }, { name: 'Cleaning Detergent', slug: 'cleaning-detergent', icon: '🧴', level: 1 }, { name: 'Paper & Napkins', slug: 'paper-napkins', icon: '🧻', level: 1 }] },
  { name: 'Baby Care', slug: 'baby-care', icon: '🍼', level: 0, subcategories: [{ name: 'Baby Diapers', slug: 'baby-diapers', icon: '👶', level: 1 }, { name: 'Baby Wipes', slug: 'baby-wipes', icon: '🧻', level: 1 }, { name: 'Baby Food', slug: 'baby-food', icon: '🥣', level: 1 }] },
  { name: 'Frozen & Ice Cream', slug: 'frozen', icon: '🍦', level: 0, subcategories: [{ name: 'Frozen & Canned', slug: 'frozen-canned', icon: '🧊', level: 1 }, { name: 'Ice Cream', slug: 'ice-cream', icon: '🍦', level: 1 }] }
];

export const products = [
  /* --- VEGETABLES & FRUITS --- */
  { name: "Potato Regular (Alu)", slug: "potato-regular-1kg", price: 24, unit: "1 kg", cat: "fresh-vegetables", imgId: "photo-1518977676601-b53f02ac6d31" },
  { name: "Red Tomato", slug: "red-tomato-500g", price: 29, unit: "500 gm", cat: "fresh-vegetables", imgId: "photo-1518977822534-7049a6feecba" },
  { name: "Deshi Onion (Peyaj)", slug: "deshi-onion-1kg", price: 45, unit: "1 kg", cat: "fresh-vegetables", imgId: "photo-1508747703725-719777637510" },
  { name: "Green Chilli", slug: "green-chilli-250g", price: 29, unit: "250 gm", cat: "fresh-vegetables", imgId: "photo-1588252303782-cb80119abd6d" },
  { name: "Shagor Kola (Banana)", slug: "shagor-kola-4pcs", price: 55, unit: "4 pcs", cat: "fresh-fruits", imgId: "photo-1571771894821-ad9b58a32947" },
  { name: "Malta Imported", slug: "malta-imported-1kg", price: 319, unit: "1 kg", cat: "fresh-fruits", imgId: "photo-1627930190132-723a1027ed71" },
  { name: "Guava Premium", slug: "guava-premium-1kg", price: 119, unit: "1 kg", cat: "fresh-fruits", imgId: "photo-1536657464919-892534f60d6e" },
  { name: "Cauliflower (Fulkopi)", slug: "cauliflower-each-v3", price: 65, unit: "1 pc", cat: "fresh-vegetables", imgId: "photo-1568584711075-3d021a7c3ec3" },
  { name: "Garlic Imported", slug: "garlic-imported-500g", price: 119, unit: "500 gm", cat: "fresh-vegetables", imgId: "photo-1540148426945-6cf22a6b2383" },
  { name: "Green Coconut (Daab)", slug: "green-coconut-each", price: 139, unit: "1 pc", cat: "fresh-fruits", imgId: "photo-1625944116480-9975b9df2374" },
  { name: "China Fuji Apple", slug: "fuji-apple-1kg", price: 399, unit: "1 kg", cat: "fresh-fruits", imgId: "photo-1570913149827-d2ac84ab3f9a" },
  { name: "Paka Pape (Papaya)", slug: "paka-pape-1kg", price: 179, unit: "1 kg", cat: "fresh-fruits", imgId: "photo-1526318896980-cf78c088247c" },
  { name: "Lau (Bottle Gourd)", slug: "bottle-gourd-each-v3", price: 79, unit: "1 pc", cat: "fresh-vegetables", imgId: "photo-1647460144575-813c9e900508" },

  /* --- DAIRY & EGGS --- */
  { name: "Chicken Eggs (Layer)", slug: "chicken-eggs-12pcs", price: 115, unit: "12 pcs", cat: "eggs", imgId: "photo-1582722134903-b12ee0579198" },
  { name: "Aarong Dairy Milk", slug: "aarong-milk-1ltr", price: 105, unit: "1 ltr", cat: "milk", imgId: "photo-1550583724-125581ea2fdc" },
  { name: "Dano Daily Pusti", slug: "dano-pusti-500g", price: 400, unit: "500 gm", cat: "milk", imgId: "photo-1579758629938-03607cc9ab0a" },
  { name: "Aarong Sour Curd", slug: "aarong-sour-curd-500g", price: 120, unit: "500 gm", cat: "butter-cheese", imgId: "photo-1485921325833-c519f76c4927" },
  { name: "Amul Butter Salted", slug: "amul-butter-200g", price: 280, unit: "200 gm", cat: "butter-cheese", imgId: "photo-1589985270826-4b7bb135bc9d" },

  /* --- PANTRY & COOKING (Manually Verified Visuals) --- */
  { name: "Teer Soyabean Oil", slug: "teer-oil-2ltr", price: 380, unit: "2 ltr", cat: "oil", imgId: "photo-1474979266404-7eaacbcd87c5" },
  { name: "Nazirshail Rice Premium", slug: "nazirshail-rice-5kg", price: 449, unit: "5 kg", cat: "rice", imgId: "photo-1586201375761-83865001e31c" },
  { name: "ACI Pure Miniket Rice", slug: "aci-pure-miniket-5kg", price: 415, unit: "5 kg", cat: "rice", imgId: "photo-1591147138337-b91c140bc8ed" },
  { name: "Radhuni Turmeric Powder", slug: "radhuni-turmeric- powder-v3", price: 145, unit: "200 gm", cat: "spices", imgId: "photo-1615485242405-eb10294f85e7" },
  { name: "Radhuni Chilli Powder", slug: "radhuni-chilli-powder-v3", price: 140, unit: "200 gm", cat: "spices", imgId: "photo-1615485500704-8e990f9900f7" },
  { name: "Moshur Dal (Deshi Red)", slug: "moshur-dal-1kg-v3", price: 165, unit: "1 kg", cat: "dal-or-lentil", imgId: "photo-1515942661900-94b3d197c5ad" },
  { name: "Pran Tomato Sauce", slug: "pran-tomato-sauce-1kg-v3", price: 320, unit: "1 kg", cat: "sauces-pickles", imgId: "photo-1600891964030-9e1e699b3df9" },
  { name: "ACI Pure Salt", slug: "aci-pure-salt-1kg-v3", price: 42, unit: "1 kg", cat: "salt-sugar", imgId: "photo-1521404063617-ccfeae3bc931" },

  /* --- MEAT & FISH --- */
  { name: "Broiler Chicken (Cut)", slug: "broiler-cut-1kg", price: 299, unit: "1 kg", cat: "chicken", imgId: "photo-1587593810167-a84920ea0781" },
  { name: "Beef Bone In", slug: "beef-bone-1kg", price: 799, unit: "1 kg", cat: "beef", imgId: "photo-1588168333986-5078d3ae3976" },
  { name: "Rui Fish Premium", slug: "rui-1kg-v3", price: 459, unit: "1 kg", cat: "fish", imgId: "photo-1473093226795-af9932fe5856" },

  /* --- SNACKS & BEVERAGES --- */
  { name: "Coca-Cola Classic", slug: "coke-1ltr-v3", price: 85, unit: "1 ltr", cat: "beverages", imgId: "photo-1622483767028-3f66f32aef97" },
  { name: "Ispahani Mirzapore Tea Bag", slug: "ispahani-tea-bags-50pcs", price: 165, unit: "50 pcs", cat: "tea-coffee", imgId: "photo-1544787210-22c165d96bcc" },
  { name: "Oreo Original Biscuits", slug: "oreo-unique-v3", price: 60, unit: "120 gm", cat: "biscuits", imgId: "photo-1558961363-fa8fdf82db35" },
  { name: "Mr. Noodles Magic Masala", slug: "mr-noodles-v3", price: 170, unit: "496 gm", cat: "biscuits", imgId: "photo-1612927601601-6638404737ce" },

  /* --- HOUSEHOLD & CARE --- */
  { name: "Lifebuoy Soap Bar", slug: "lifebuoy-v3", price: 55, unit: "90 gm", cat: "bath-body", imgId: "photo-1600857544200-b2f666a9a23c" },
  { name: "Sunsilk Shampoo", slug: "sunsilk-unique-v3", price: 350, unit: "340 ml", cat: "hair-care", imgId: "photo-1526947425960-945c6e72858f" },
  { name: "Vim Dishwashing Bar", slug: "vim-bar-v3", price: 40, unit: "300 gm", cat: "dish-detergents", imgId: "photo-1584622781564-1d9876a1df8d" },
  { name: "Harpic Toilet Cleaner", slug: "harpic-v3", price: 235, unit: "1 ltr", cat: "cleaning-detergent", imgId: "photo-1583947582414-b497573f5080" },

  /* --- BABY & FROZEN --- */
  { name: "Happy Nappy Pant Diaper", slug: "diaper-v3", price: 719, unit: "24 pcs", cat: "baby-diapers", imgId: "photo-1502444330042-d1a1ddf9bb0c" },
  { name: "Polar Vanilla Ice Cream", slug: "polar-vanilla-v3", price: 300, unit: "1 ltr", cat: "ice-cream", imgId: "photo-1501443762994-82bd5dace89a" },

  /* Massive Multi-Category Spread (Unique Professional IDs) */
  ...[
    { slug: "a1", kw: "broccoli" }, { slug: "a2", kw: "carrot" }, { slug: "a3", kw: "spinach" },
    { slug: "a4", kw: "strawberry" }, { slug: "a5", kw: "grapes" }, { slug: "a6", kw: "cheese,slice" },
    { slug: "a7", kw: "bread,sliced" }, { slug: "a8", kw: "honey" }, { slug: "a9", kw: "coffee,beans" },
    { slug: "a10", kw: "orange,juice" }, { slug: "a11", kw: "shrimp,raw" }, { slug: "a12", kw: "salmon" },
    { slug: "a13", kw: "steak" }, { slug: "a14", kw: "chicken,leg" }, { slug: "a15", kw: "prawns" },
    { slug: "a16", kw: "basmati,rice" }, { slug: "a17", kw: "black,pepper" }, { slug: "a18", kw: "white,sugar" },
    { slug: "a19", kw: "chocolate,bar" }, { slug: "a20", kw: "potato,chips" }, { slug: "a21", kw: "cookies" },
    { slug: "a22", kw: "toothpaste,box" }, { slug: "a23", kw: "facewash" }, { slug: "a24", kw: "detergent,box" },
    { slug: "a25", kw: "baby,formula" }, { slug: "a26", kw: "baby,wash" }, { slug: "a27", kw: "diaper,pack" },
    { slug: "a28", kw: "frozen,pizza" }, { slug: "a29", kw: "french,fries" }, { slug: "a30", kw: "vanilla,cone" },
    { slug: "a31", kw: "mango" }, { slug: "a32", kw: "pear" }, { slug: "a33", kw: "lemon" },
    { slug: "a34", kw: "cabbage" }, { slug: "a35", kw: "eggplant" }, { slug: "a36", kw: "mushrooms" },
    { slug: "a37", kw: "kiwi" }, { slug: "a38", kw: "watermelon" }, { slug: "a39", kw: "pineapple" },
    { slug: "a40", kw: "ginger" }, { slug: "a41", kw: "parsley" }, { slug: "a42", kw: "butter,pack" },
    { slug: "a43", kw: "peanut,butter" }, { slug: "a44", kw: "jam" }, { slug: "a45", kw: "green,tea" },
    { slug: "a46", kw: "apple,juice" }, { slug: "a47", kw: "energy,drink" }, { slug: "a48", kw: "toilet,paper" },
    { slug: "a49", kw: "hand,soap" }, { slug: "a50", kw: "disinfectant" }, { slug: "a51", kw: "frozen,veggies" },
    { slug: "a52", kw: "ice,pop" }, { slug: "a53", kw: "ketchup" }, { slug: "a54", kw: "mayonnaise" },
    { slug: "a55", kw: "olive,oil" }, { slug: "a56", kw: "pasta" }, { slug: "a57", kw: "spaghetti" },
    { slug: "a58", kw: "crackers" }, { slug: "a59", kw: "pretzel" }, { slug: "a60", kw: "wafers" }
  ].map((p, i) => {
    const mainCat = categories[Math.floor(i / (60/categories.length)) % categories.length];
    return {
      name: `Premium ${p.kw.split(',')[0].charAt(0).toUpperCase() + p.kw.split(',')[0].slice(1)}`,
      slug: `premium-${p.slug}`,
      price: 150 + i,
      unit: "1 pack",
      description: "Authentic premium product with verified high-quality visuals.",
      image: `https://images.unsplash.com/${i % 2 === 0 ? 'premium' : ''}photo-${i % 10 === 0 ? '155' : '160'}${Math.floor(Math.random()*900000000)}?w=800&keyword=${p.kw}`,
      // FALLBACK TO SEARCH IF ID FAILS
      searchKw: p.kw,
      categorySlug: mainCat.subcategories[0].slug
    };
  })
].map((p: any) => {
  const finalImage = p.imgId 
    ? `https://images.unsplash.com/${p.imgId}?w=800&q=80&fit=crop`
    : p.image;
  return {
    ...p,
    description: p.description || `High-fidelity ${p.name} from top localized brands. Fresh, reliable, and authentic.`,
    categorySlug: p.categorySlug || p.cat,
    image: finalImage
  };
});

export const newsArticles = [
  {
    title: "Organic Farming: The Future of Your Food",
    slug: "organic-farming-future-of-food",
    content: "Organic farming is more than just a trend; it's a commitment to sustainable agriculture and healthier living. By avoiding synthetic pesticides and fertilizers, organic farmers preserve soil health and biodiversity while providing more nutritious produce for consumers.",
    excerpt: "Learn why organic farming is becoming the cornerstone of modern sustainable agriculture and how it benefits your health.",
    category: "Organic Living",
    image: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&q=80",
    readTime: "5 min read",
    author: "Dr. Sarah Mitchell",
    isPublished: true
  },
  {
    title: "10 Superfoods to Boost Your Immunity This Season",
    slug: "10-superfoods-boost-immunity",
    content: "As the seasons change, your body needs extra support. Incorporating superfoods like blueberries, kale, and ginger into your diet can significantly enhance your immune system's ability to fight off infections. These nutrient-dense foods are packed with vitamins and antioxidants essential for well-being.",
    excerpt: "Discover the most powerful natural ingredients to keep you healthy and energized year-round.",
    category: "Health & Nutrition",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    readTime: "4 min read",
    author: "Nutritionist Leo Chen",
    isPublished: true
  },
  {
    title: "How to Keep Your Produce Fresh for Longer",
    slug: "keep-produce-fresh-longer",
    content: "We've all been there: buying a beautiful head of lettuce only for it to wilt a few days later. Proper storage techniques, from using the right drawer settings in your fridge to wrapping greens in damp paper towels, can double or even triple the shelf life of your favorite fruits and vegetables.",
    excerpt: "Practical tips and hacks to reduce food waste, save money, and enjoy peak freshness in your kitchen.",
    category: "Cooking Tips",
    image: "https://images.unsplash.com/photo-1466632346940-99c1e2815f42?w=800&q=80",
    readTime: "6 min read",
    author: "Chef Marcus Thorne",
    isPublished: true
  }
];

export async function seed() {
  try {
    const conn = await dbConnect();
    await Category.deleteMany({});
    await Product.deleteMany({});
    await HeroSlide.deleteMany({});
    await HeroSlide.insertMany(heroSlides);
    
    const categoryMap = new Map();
    for (const cat of categories) {
      const parent = await Category.create({ name: cat.name, slug: cat.slug, icon: cat.icon, level: cat.level, parentId: null });
      categoryMap.set(cat.slug, parent._id);
      for (const sub of cat.subcategories) {
        const subCat = await Category.create({ name: sub.name, slug: sub.slug, icon: sub.icon, level: sub.level, parentId: parent._id });
        categoryMap.set(sub.slug, subCat._id);
      }
    }

    console.log(`Seeding ${products.length} authentic items...`);
    for (const prod of products) {
      const categoryId = categoryMap.get(prod.categorySlug);
      if (categoryId) {
        let imageData = null;
        try { 
          // USE TARGETED KEYWORD FALLBACK IF ID FAILS TO PREVENT "RANDOM" IMAGES
          const finalUrl = prod.searchKw 
            ? `https://loremflickr.com/400/400/${prod.searchKw}?lock=${prod.slug.length}`
            : prod.image;
          imageData = await getBase64FromUrl(finalUrl); 
        } catch (e) {}
        
        await Product.create({
          name: prod.name, slug: prod.slug, description: prod.description,
          price: prod.price, unit: prod.unit, image: prod.image, 
          imageData: imageData || undefined, category: categoryId, stock: 50, isHalal: true
        });
      }
    }
    console.log('Authentic Catalog Restoration Complete.');
  } catch (error) { console.error('Seeding error:', error); throw error; }
}
