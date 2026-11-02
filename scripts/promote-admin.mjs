// Promote an existing, verified user to admin.
// Replaces the old public /api/admin/setup route, which let any logged-in user become admin.
//
// Usage: npm run promote-admin -- user@example.com
import mongoose from "mongoose";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run promote-admin -- <email>");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local).");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const result = await mongoose.connection
  .collection("users")
  .updateOne({ email, isVerified: true }, { $set: { role: "admin" } });
await mongoose.disconnect();

if (result.matchedCount === 0) {
  console.error(`No verified user found with email ${email}.`);
  process.exit(1);
}
console.log(`${email} is now an admin. They must sign out and back in to refresh their session.`);
