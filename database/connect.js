/**
 * Shared connection helper for the database scripts.
 * - Reads MONGODB_URI from the environment, or from .env.local / .env in the project root.
 * - URL-encodes the username and password, so passwords with @ : / ? # work as typed.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnvFile() {
  if (process.env.MONGODB_URI) return;
  for (const name of [".env.local", ".env"]) {
    const file = path.join(__dirname, "..", name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
    return;
  }
}

/** Same rule as src/lib/mongodb.ts: encode credentials, leave already-encoded ones alone. */
function normalizeMongoUri(uri) {
  const schemeEnd = uri.indexOf("://");
  if (schemeEnd === -1) return uri;
  const start = schemeEnd + 3;
  const pathStart = uri.indexOf("/", uri.lastIndexOf("@") + 1);
  const at = uri.lastIndexOf("@", pathStart === -1 ? undefined : pathStart);
  if (at < start) return uri;
  const encode = part => {
    try { return encodeURIComponent(decodeURIComponent(part)); } catch { return encodeURIComponent(part); }
  };
  const credentials = uri.slice(start, at);
  const colon = credentials.indexOf(":");
  const encoded = colon === -1 ? encode(credentials) : `${encode(credentials.slice(0, colon))}:${encode(credentials.slice(colon + 1))}`;
  return uri.slice(0, start) + encoded + uri.slice(at);
}

async function connect() {
  loadEnvFile();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Put it in .env.local or the environment.");
    process.exit(1);
  }
  await mongoose.connect(normalizeMongoUri(uri), { serverSelectionTimeoutMS: 15000 });
  return mongoose.connection.db;
}

module.exports = { connect, mongoose };
