import mongoose from "mongoose";

/**
 * Makes sure the username and password in a MongoDB connection string are URL-encoded.
 *
 * Passwords often contain characters such as @ : / ? # that must be percent-encoded,
 * and an unencoded one fails with "MongoParseError: Password contains unescaped
 * characters". Already-encoded values are left as they are (decode, then encode).
 */
export function normalizeMongoUri(uri: string): string {
  const schemeEnd = uri.indexOf("://");
  if (schemeEnd === -1) return uri;
  const authorityStart = schemeEnd + 3;

  // The host part never contains "@", so the last "@" before the path ends the credentials.
  const pathStart = uri.indexOf("/", uri.lastIndexOf("@") + 1);
  const at = uri.lastIndexOf("@", pathStart === -1 ? undefined : pathStart);
  if (at < authorityStart) return uri; // no credentials

  const encode = (part: string) => {
    try {
      return encodeURIComponent(decodeURIComponent(part));
    } catch {
      return encodeURIComponent(part); // contains a lone "%": treat it literally
    }
  };

  const credentials = uri.slice(authorityStart, at);
  const colon = credentials.indexOf(":");
  const encoded = colon === -1
    ? encode(credentials)
    : `${encode(credentials.slice(0, colon))}:${encode(credentials.slice(colon + 1))}`;

  return uri.slice(0, authorityStart) + encoded + uri.slice(at);
}

const MONGODB_URI = normalizeMongoUri(process.env.MONGODB_URI || "");

if (!MONGODB_URI) {
  console.warn("Please define the MONGODB_URI environment variable inside .env.local");
}

// Cache the connection on `global` so hot reloads and serverless re-use don't open new pools.
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = global as typeof globalThis & { mongoose?: MongooseCache };
const cached: MongooseCache = globalWithMongoose.mongoose ?? (globalWithMongoose.mongoose = { conn: null, promise: null });

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
