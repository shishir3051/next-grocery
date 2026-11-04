import dbConnect from "@/lib/mongodb";
import { RateLimit } from "@/models/RateLimit";

/**
 * Rate limiting for login, sign-up, codes, checkout and the paid AI / geocoding APIs.
 *
 * Two layers:
 * 1. An in-memory sliding window per server instance. It is free, and rejects floods
 *    before they reach the database.
 * 2. A shared fixed-window counter in MongoDB, so the limit holds across every
 *    serverless instance (Vercel) and across restarts.
 *
 * If the database is unreachable the shared layer fails open (logs and allows) so a
 * database hiccup can't lock every user out; the in-memory layer still applies.
 */

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

const hits = new Map<string, number[]>();

/** In-memory sliding window (per server instance). */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep memory bounded: drop keys with no recent hits once the map grows.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every(t => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true, retryAfterSeconds: 0 };
}

function windowFor(key: string, windowMs: number) {
  const start = Math.floor(Date.now() / windowMs) * windowMs;
  return { id: `${key}:${start}`, expiresAt: new Date(start + windowMs) };
}

const secondsUntil = (date: Date) => Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));

/** Adds one hit to the shared counter and returns the new count (null if the DB failed). */
async function incrementShared(key: string, windowMs: number): Promise<{ count: number; expiresAt: Date } | null> {
  const { id, expiresAt } = windowFor(key, windowMs);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await dbConnect();
      const doc = await RateLimit.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, new: true }
      ).lean<{ count: number }>();
      return { count: doc?.count ?? 1, expiresAt };
    } catch (error) {
      // Two parallel upserts of a new window can race on the unique _id; retry once.
      if ((error as { code?: number })?.code === 11000 && attempt === 0) continue;
      console.error("Rate limiter unavailable (allowing request):", error);
      return null;
    }
  }
  return null;
}

/**
 * Counts this request against `limit` per `windowMs`, in memory and in the shared store.
 * Use for anything that costs money or can be brute-forced.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const local = rateLimit(key, limit, windowMs);
  if (!local.ok) return local;

  const shared = await incrementShared(key, windowMs);
  if (shared && shared.count > limit) return { ok: false, retryAfterSeconds: secondsUntil(shared.expiresAt) };
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Failure counters (e.g. wrong passwords per account): `isBlocked` only reads the counter,
 * and `recordFailure` is called after a failed attempt. Counting failures only, instead of
 * every attempt, means the real owner's successful logins never use up their own limit.
 */
export async function isBlocked(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const { id, expiresAt } = windowFor(key, windowMs);
  try {
    await dbConnect();
    const doc = await RateLimit.findById(id).lean<{ count: number }>();
    return doc && doc.count >= limit ? { ok: false, retryAfterSeconds: secondsUntil(expiresAt) } : { ok: true, retryAfterSeconds: 0 };
  } catch (error) {
    console.error("Rate limiter unavailable (allowing request):", error);
    return { ok: true, retryAfterSeconds: 0 };
  }
}

export async function recordFailure(key: string, windowMs: number): Promise<void> {
  await incrementShared(key, windowMs);
}

type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined | null;

function readHeader(headers: HeaderSource, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name) ?? undefined;
  const value = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Best-effort client IP. On Vercel both headers are set by the platform and can't be
 * spoofed. When self-hosting, put the app behind a reverse proxy (nginx, Caddy) that
 * sets X-Real-IP / X-Forwarded-For; see docs/DEPLOYMENT.md.
 */
export function clientIp(headers: HeaderSource): string {
  const realIp = readHeader(headers, "x-real-ip")?.trim();
  const forwarded = readHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim();
  return (realIp || forwarded || "unknown").slice(0, 64);
}

/** Rate-limit key for a request: `${scope}:${ip}`. */
export function clientKey(request: Request, scope: string): string {
  return `${scope}:${clientIp(request.headers)}`;
}
