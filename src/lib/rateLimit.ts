/**
 * Small in-memory sliding-window rate limiter for expensive endpoints (AI, geocoding).
 *
 * Limitation: counts are per server instance and reset on restart. That is fine for a
 * single Node server; on serverless or multiple instances use a shared store
 * (e.g. Redis / Upstash) behind this same function.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
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

/** Best-effort client identifier for rate limiting. */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}
