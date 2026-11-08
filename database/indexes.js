/**
 * Creates every MongoDB index FreshBasket needs. Safe to run on an empty database and
 * safe to run again (existing indexes are left as they are).
 *
 *   npm run db:indexes                          # uses MONGODB_URI from .env.local
 *   MONGODB_URI="mongodb+srv://..." node database/indexes.js
 *
 * The Mongoose models declare the same indexes, but running this once on a fresh database
 * means unique rules (one account per email, unique slugs and coupon codes) are enforced
 * from the first request, before the app has started.
 */
const { connect, mongoose } = require("./connect");

const INDEXES = {
  users: [
    { key: { email: 1 }, options: { unique: true } },
    { key: { googleId: 1 }, options: { unique: true, sparse: true } },
    { key: { referralCode: 1 }, options: { unique: true, sparse: true } },
    { key: { role: 1 } },
  ],
  categories: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { parentId: 1 } },
  ],
  products: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { category: 1 } },
    { key: { stock: 1 } },
    { key: { name: "text", description: "text" } },
  ],
  orders: [
    { key: { createdAt: -1 } },
    { key: { status: 1, createdAt: -1 } },
    { key: { user: 1, createdAt: -1 } },
    { key: { assignedTo: 1, status: 1 } },
    { key: { paymentProvider: 1, paymentProviderId: 1 } },
  ],
  coupons: [
    { key: { code: 1 }, options: { unique: true } },
    { key: { isActive: 1, expiryDate: 1 } },
  ],
  news: [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { isPublished: 1, createdAt: -1 } },
  ],
  heroslides: [{ key: { isActive: 1, order: 1 } }],
  contactmessages: [
    { key: { status: 1, createdAt: -1 } },
    { key: { createdAt: -1 } },
  ],
  // Rate-limit counters delete themselves when their time window ends.
  ratelimits: [{ key: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } }],
};

async function main() {
  const db = await connect();
  console.log(`Database: ${db.databaseName}`);

  const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name));
  let created = 0;

  for (const [collection, indexes] of Object.entries(INDEXES)) {
    if (!existing.has(collection)) await db.createCollection(collection);
    for (const { key, options = {} } of indexes) {
      try {
        const name = await db.collection(collection).createIndex(key, options);
        console.log(`  ✓ ${collection}.${name}`);
        created++;
      } catch (error) {
        // e.g. duplicates already in the data prevent a unique index: report and continue.
        console.error(`  ✗ ${collection} ${JSON.stringify(key)}: ${error.message}`);
        process.exitCode = 1;
      }
    }
  }

  console.log(`\n${created} index(es) in place.`);
  await mongoose.disconnect();
}

main().catch(error => {
  console.error("Index setup failed:", error.message);
  process.exit(1);
});
