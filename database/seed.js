/**
 * Sample data for a fresh FreshBasket database.
 *
 *   npm run db:seed                         # catalogue, coupons, banners, settings (only into empty collections)
 *   npm run db:seed -- --demo-users         # also create/reset the demo admin, customer and rider
 *   MONGODB_URI="mongodb+srv://..." node database/seed.js --demo-users
 *
 * Never deletes anything: categories, products, hero banners and settings are inserted only
 * when their collection is empty, and coupons only when their code doesn't exist yet.
 *
 * Demo account passwords come from DEMO_ADMIN_PASSWORD, DEMO_CUSTOMER_PASSWORD and
 * DEMO_RIDER_PASSWORD. Any that are not set get a random password, printed once at the end.
 * Product photos are free Unsplash images (https://unsplash.com/license); replace them with
 * your own before going live. Run `npm run db:indexes` first on a new database.
 */
const { connect, mongoose } = require("./connect");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");

const img = id => `https://images.unsplash.com/${id}?w=800&q=80&fit=crop`;

const CATEGORIES = [
  { name: "Fruits & Vegetables", slug: "fruits-vegetables", icon: "🥗", subs: [["Fresh Vegetables", "fresh-vegetables", "🥦"], ["Fresh Fruits", "fresh-fruits", "🍎"]] },
  { name: "Dairy & Eggs", slug: "dairy-eggs", icon: "🥚", subs: [["Milk", "milk", "🥛"], ["Eggs", "eggs", "🍳"], ["Butter & Cheese", "butter-cheese", "🧈"]] },
  { name: "Pantry & Cooking", slug: "cooking", icon: "🍳", subs: [["Rice", "rice", "🍚"], ["Dal or Lentil", "dal-or-lentil", "🍲"], ["Oil", "oil", "🫒"], ["Spices", "spices", "🌶️"]] },
  { name: "Meat & Fish", slug: "meat-fish", icon: "🥩", subs: [["Chicken", "chicken", "🍗"], ["Fish", "fish", "🐟"], ["Beef", "beef", "🥩"]] },
  { name: "Snacks & Beverages", slug: "snacks-beverages", icon: "🍪", subs: [["Biscuits", "biscuits", "🍪"], ["Tea & Coffee", "tea-coffee", "☕"], ["Juices", "juices", "🧃"]] },
  { name: "Cleaning & Household", slug: "household", icon: "🧹", subs: [["Dish Detergents", "dish-detergents", "🧼"], ["Bath & Body", "bath-body", "🧴"]] },
];

// [name, slug, price, discountPrice (sale price, 0 = none), unit, category slug, Unsplash photo id]
const PRODUCTS = [
  ["Potato (Alu)", "potato-1kg", 30, 24, "1 kg", "fresh-vegetables", "photo-1518977676601-b53f02ac6d31"],
  ["Red Tomato", "red-tomato-500g", 35, 0, "500 gm", "fresh-vegetables", "photo-1518977822534-7049a6feecba"],
  ["Onion (Peyaj)", "onion-1kg", 50, 45, "1 kg", "fresh-vegetables", "photo-1508747703725-719777637510"],
  ["Green Chilli", "green-chilli-250g", 29, 0, "250 gm", "fresh-vegetables", "photo-1588252303782-cb80119abd6d"],
  ["Cauliflower", "cauliflower-1pc", 65, 0, "1 pc", "fresh-vegetables", "photo-1568584711075-3d021a7c3ec3"],
  ["Garlic", "garlic-500g", 130, 119, "500 gm", "fresh-vegetables", "photo-1540148426945-6cf22a6b2383"],
  ["Banana", "banana-4pcs", 55, 0, "4 pcs", "fresh-fruits", "photo-1571771894821-ad9b58a32947"],
  ["Orange (Malta)", "orange-1kg", 340, 319, "1 kg", "fresh-fruits", "photo-1627930190132-723a1027ed71"],
  ["Guava", "guava-1kg", 119, 0, "1 kg", "fresh-fruits", "photo-1536657464919-892534f60d6e"],
  ["Red Apple", "red-apple-1kg", 420, 399, "1 kg", "fresh-fruits", "photo-1570913149827-d2ac84ab3f9a"],
  ["Papaya", "papaya-1kg", 179, 0, "1 kg", "fresh-fruits", "photo-1526318896980-cf78c088247c"],
  ["Farm Eggs", "farm-eggs-12pcs", 125, 115, "12 pcs", "eggs", "photo-1582722134903-b12ee0579198"],
  ["Fresh Milk", "fresh-milk-1ltr", 105, 0, "1 ltr", "milk", "photo-1550583724-125581ea2fdc"],
  ["Plain Yogurt", "plain-yogurt-500g", 120, 0, "500 gm", "butter-cheese", "photo-1485921325833-c519f76c4927"],
  ["Salted Butter", "salted-butter-200g", 290, 280, "200 gm", "butter-cheese", "photo-1589985270826-4b7bb135bc9d"],
  ["Soybean Oil", "soybean-oil-2ltr", 380, 0, "2 ltr", "oil", "photo-1474979266404-7eaacbcd87c5"],
  ["Premium Rice", "premium-rice-5kg", 470, 449, "5 kg", "rice", "photo-1586201375761-83865001e31c"],
  ["Miniket Rice", "miniket-rice-5kg", 415, 0, "5 kg", "rice", "photo-1591147138337-b91c140bc8ed"],
  ["Turmeric Powder", "turmeric-powder-200g", 145, 0, "200 gm", "spices", "photo-1615485242405-eb10294f85e7"],
  ["Chilli Powder", "chilli-powder-200g", 140, 0, "200 gm", "spices", "photo-1615485500704-8e990f9900f7"],
  ["Red Lentils (Moshur Dal)", "red-lentils-1kg", 175, 165, "1 kg", "dal-or-lentil", "photo-1515942661900-94b3d197c5ad"],
  ["Chicken (Cut)", "chicken-cut-1kg", 299, 0, "1 kg", "chicken", "photo-1587593810167-a84920ea0781"],
  ["Beef (Bone In)", "beef-bone-in-1kg", 799, 0, "1 kg", "beef", "photo-1588168333986-5078d3ae3976"],
  ["Rui Fish", "rui-fish-1kg", 480, 459, "1 kg", "fish", "photo-1473093226795-af9932fe5856"],
  ["Black Tea Bags", "black-tea-bags-50pcs", 165, 0, "50 pcs", "tea-coffee", "photo-1544787210-22c165d96bcc"],
  ["Chocolate Cookies", "chocolate-cookies-120g", 60, 0, "120 gm", "biscuits", "photo-1558961363-fa8fdf82db35"],
  ["Orange Juice", "orange-juice-1ltr", 220, 199, "1 ltr", "juices", "photo-1627930190132-723a1027ed71"],
  ["Bath Soap", "bath-soap-90g", 55, 0, "90 gm", "bath-body", "photo-1600857544200-b2f666a9a23c"],
  ["Shampoo", "shampoo-340ml", 350, 0, "340 ml", "bath-body", "photo-1526947425960-945c6e72858f"],
  ["Dishwashing Bar", "dishwashing-bar-300g", 40, 0, "300 gm", "dish-detergents", "photo-1584622781564-1d9876a1df8d"],
];

const HERO_SLIDES = [
  { title: "Groceries at your door,", highlight: "fresh every day", subtitle: "Delivered in under 60 minutes.", ctaLabel: "Shop Now", ctaLink: "fruits-vegetables", emoji: "🥦", order: 0 },
  { title: "Weekly deals on", highlight: "fruits & dairy", subtitle: "Use code WELCOME10 on your first order.", ctaLabel: "See Deals", ctaLink: "fresh-fruits", emoji: "🍊", order: 1, gradient: "from-orange-500 via-amber-500 to-orange-700", accentColor: "text-amber-200", decorColor: "bg-amber-300/20" },
];

const inOneYear = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const COUPONS = [
  { code: "WELCOME10", discountType: "percentage", discountValue: 10, maxDiscount: 100, minOrderAmount: 300 },
  { code: "FRESH50", discountType: "fixed", discountValue: 50, minOrderAmount: 500, usageLimit: 1000 },
];

const DEMO_USERS = [
  { role: "admin", name: "Demo Admin", email: "admin@demo.freshbasket.app", env: "DEMO_ADMIN_PASSWORD" },
  { role: "user", name: "Demo Customer", email: "customer@demo.freshbasket.app", env: "DEMO_CUSTOMER_PASSWORD" },
  { role: "delivery", name: "Demo Rider", email: "rider@demo.freshbasket.app", env: "DEMO_RIDER_PASSWORD" },
];

async function main() {
  const withDemoUsers = process.argv.includes("--demo-users");
  const db = await connect();
  const now = new Date();
  console.log(`Database: ${db.databaseName}`);

  // Categories and products: only into an empty catalogue.
  if ((await db.collection("products").countDocuments()) === 0 && (await db.collection("categories").countDocuments()) === 0) {
    const categoryIds = new Map();
    for (const cat of CATEGORIES) {
      const { insertedId } = await db.collection("categories").insertOne({ name: cat.name, slug: cat.slug, icon: cat.icon, level: 0, parentId: null });
      categoryIds.set(cat.slug, insertedId);
      for (const [name, slug, icon] of cat.subs) {
        const sub = await db.collection("categories").insertOne({ name, slug, icon, level: 1, parentId: insertedId });
        categoryIds.set(slug, sub.insertedId);
      }
    }
    await db.collection("products").insertMany(PRODUCTS.map(([name, slug, price, discountPrice, unit, cat, photo]) => ({
      name, slug, price, discountPrice, unit,
      description: `${name}, ${unit}. Sample product: replace the photo and details with your own.`,
      images: [img(photo)],
      category: categoryIds.get(cat),
      stock: 50, isHalal: true, isOrganic: false, ratings: 0, reviewsCount: 0,
      createdAt: now, updatedAt: now,
    })));
    console.log(`  ✓ ${categoryIds.size} categories and ${PRODUCTS.length} products`);
  } else {
    console.log("  · catalogue already has data, left unchanged");
  }

  if ((await db.collection("heroslides").countDocuments()) === 0) {
    await db.collection("heroslides").insertMany(HERO_SLIDES.map(s => ({
      gradient: "from-teal-600 via-emerald-600 to-teal-800", accentColor: "text-emerald-300", decorColor: "bg-emerald-400/20",
      tag: "", tagColor: "bg-emerald-500/30 text-emerald-100", image: "", isActive: true, ...s, createdAt: now, updatedAt: now,
    })));
    console.log(`  ✓ ${HERO_SLIDES.length} hero banners`);
  }

  for (const coupon of COUPONS) {
    const result = await db.collection("coupons").updateOne(
      { code: coupon.code },
      { $setOnInsert: { maxDiscount: null, usageLimit: null, ...coupon, usedCount: 0, isActive: true, startDate: now, expiryDate: inOneYear(), createdAt: now, updatedAt: now } },
      { upsert: true }
    );
    console.log(result.upsertedCount ? `  ✓ coupon ${coupon.code}` : `  · coupon ${coupon.code} already exists`);
  }

  if ((await db.collection("settings").countDocuments()) === 0) {
    await db.collection("settings").insertOne({ storeName: "FreshBasket", supportEmail: "support@example.com", supportPhone: "", deliveryFee: 50, minFreeDelivery: 500, maintenanceMode: false, createdAt: now, updatedAt: now });
    console.log("  ✓ store settings");
  }

  const printed = [];
  if (withDemoUsers) {
    for (const demo of DEMO_USERS) {
      const fromEnv = process.env[demo.env];
      const password = fromEnv || randomBytes(9).toString("base64url");
      if (password.length < 8) throw new Error(`${demo.env} must be at least 8 characters`);
      await db.collection("users").updateOne(
        { email: demo.email },
        {
          $set: { name: demo.name, role: demo.role, password: await bcrypt.hash(password, 12), isVerified: true, passwordChangedAt: now, updatedAt: now },
          $setOnInsert: { email: demo.email, image: "", address: { street: "", city: "Dhaka", zipCode: "", phone: "" }, walletBalance: 0, referralCode: `DEMO-${randomBytes(3).toString("hex").toUpperCase()}`, referredBy: null, referralRewarded: false, createdAt: now },
        },
        { upsert: true }
      );
      printed.push({ role: demo.role, email: demo.email, password: fromEnv ? `(from ${demo.env})` : password });
    }
    console.log(`  ✓ ${DEMO_USERS.length} demo accounts (created or reset)`);

    // Two sample customer messages so the admin inbox has demo content (live-demo mode
    // hides real customers' messages from demo accounts).
    const customerEmail = DEMO_USERS.find(u => u.role === "user").email;
    if ((await db.collection("contactmessages").countDocuments({ email: customerEmail })) === 0) {
      const customer = await db.collection("users").findOne({ email: customerEmail }, { projection: { _id: 1 } });
      const admin = await db.collection("users").findOne({ email: DEMO_USERS.find(u => u.role === "admin").email }, { projection: { _id: 1 } });
      const minutesAgo = m => new Date(now.getTime() - m * 60 * 1000);
      await db.collection("contactmessages").insertMany([
        {
          name: "Demo Customer", email: customerEmail, phone: "", subject: "Delivery delay", orderRef: "",
          message: "Hi! Can I choose an evening delivery slot for tomorrow? I'm at the office until 6 pm.",
          status: "new", user: customer?._id ?? null, replies: [], createdAt: minutesAgo(45), updatedAt: minutesAgo(45),
        },
        {
          name: "Demo Customer", email: customerEmail, phone: "", subject: "Product quality issue", orderRef: "",
          message: "The bananas in my last order were a bit too ripe. Could you pick greener ones next time?",
          status: "replied", user: customer?._id ?? null,
          replies: [{ body: "Thanks for telling us! We've added a note to pick greener bananas for your next orders.", sentBy: admin?._id ?? null, sentByName: "Demo Admin", sentAt: minutesAgo(30) }],
          createdAt: minutesAgo(180), updatedAt: minutesAgo(30),
        },
      ]);
      console.log("  ✓ 2 sample demo messages");
    }
  }

  await mongoose.disconnect();

  if (printed.length) {
    console.log("\nDemo accounts (log in at /login):");
    for (const u of printed) console.log(`  ${u.role.padEnd(9)} ${u.email}  ${u.password}`);
    console.log("Save these now; generated passwords are not shown again. Re-run with --demo-users to reset them.");
  }
  console.log("\nSeed complete.");
}

main().catch(error => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
