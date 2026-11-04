// One-time migration: store every user's email in lower case.
//
// Emails are now lower-cased on sign-up and on every lookup, so an account saved
// earlier as "Ana@Example.com" could no longer sign in until it is normalized.
// Run once per database after upgrading:
//
//   npm run normalize-emails            # dry run: shows what would change
//   npm run normalize-emails -- --apply # writes the changes
//
// If two accounts differ only by letter case, neither is changed; the script lists
// them so you can decide which one to keep.
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set (expected in .env.local).");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection("users");

const all = await users.find({}, { projection: { email: 1 } }).toArray();
const byLower = new Map();
for (const user of all) {
  const key = String(user.email).trim().toLowerCase();
  byLower.set(key, [...(byLower.get(key) ?? []), user]);
}

let changed = 0;
const conflicts = [];
for (const [lower, group] of byLower) {
  if (group.length > 1) {
    conflicts.push({ email: lower, accounts: group.map(u => `${u._id} (${u.email})`) });
    continue;
  }
  const [user] = group;
  if (user.email === lower) continue;
  changed++;
  console.log(`${apply ? "Updating" : "Would update"}: ${user.email} -> ${lower}`);
  if (apply) await users.updateOne({ _id: user._id }, { $set: { email: lower } });
}

await mongoose.disconnect();

console.log(`\n${changed} account(s) ${apply ? "updated" : "to update"}.`);
if (conflicts.length) {
  console.log(`\n${conflicts.length} email(s) belong to more than one account and were left unchanged:`);
  for (const c of conflicts) console.log(`  ${c.email}: ${c.accounts.join(", ")}`);
}
if (!apply && changed) console.log("\nRun again with --apply to write the changes.");
