import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientKey } from '@/lib/rateLimit';

/**
 * Geocoding proxy used by the delivery-location modal.
 *
 *   GET /api/geocode?type=reverse&lat=23.81&lng=90.41   -> address for a map point (0..1 result)
 *   GET /api/geocode?type=search&q=gulshan              -> up to 5 matching places
 *   ('autocomplete' is accepted as a legacy alias of 'search')
 *
 * Provider: Barikoi when BARIKOI_API_KEY is set, otherwise OpenStreetMap Nominatim (free,
 * no key). If Barikoi fails we fall back to Nominatim. Both providers are normalised to
 *   { results: [{ address, area, city, latitude, longitude }] }
 * so the client never needs to know which one answered.
 */

// Server-only key. The legacy NEXT_PUBLIC_BARIKOI_API_KEY is still read for backward
// compatibility, but the NEXT_PUBLIC_ prefix ships the value to the browser bundle, so it
// must not be used for secrets — rename it to BARIKOI_API_KEY.
const BARIKOI_KEY = process.env.BARIKOI_API_KEY || process.env.NEXT_PUBLIC_BARIKOI_API_KEY || '';
const BARIKOI_BASE = 'https://barikoi.xyz/v2/api/search';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

const UPSTREAM_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // addresses rarely change
const CACHE_REVALIDATE_SECONDS = 86400;
const MAX_RESULTS = 5;

// Per-client limit, plus Nominatim's usage policy (max 1 request/second for the whole app).
const CLIENT_LIMIT = 30;
const CLIENT_WINDOW_MS = 60 * 1000;
const NOMINATIM_INTERVAL_MS = 1000;
const NOMINATIM_MAX_WAIT_MS = 4000; // queue briefly; beyond this answer 429

// Rough bounding box of Bangladesh (we only deliver there).
const BD_BOUNDS = { minLat: 20.5, maxLat: 26.7, minLng: 88.0, maxLng: 92.7 };

const QUERY_MIN = 2;
const QUERY_MAX = 120;

interface GeoResult {
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

type Lookup =
  | { type: 'reverse'; lat: number; lng: number }
  | { type: 'search'; q: string };

/** Thrown for any upstream problem; the client only ever sees a generic message. */
class UpstreamError extends Error {}
/** Thrown when the shared Nominatim gate is saturated. */
class BusyError extends Error {}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const NUMBER_PATTERN = /^-?\d{1,3}(\.\d{1,12})?$/;

function parseCoordinate(raw: string | null, min: number, max: number): number | null {
  if (raw === null || !NUMBER_PATTERN.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

/** 4 decimals ≈ 11 m: plenty for an address and makes nearby pins share a cache entry. */
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;

function parseLookup(params: URLSearchParams): Lookup | { error: string } {
  const type = params.get('type');

  if (type === 'reverse') {
    const lat = parseCoordinate(params.get('lat'), -90, 90);
    const lng = parseCoordinate(params.get('lng'), -180, 180);
    if (lat === null || lng === null) return { error: 'Invalid coordinates' };
    if (lat < BD_BOUNDS.minLat || lat > BD_BOUNDS.maxLat || lng < BD_BOUNDS.minLng || lng > BD_BOUNDS.maxLng) {
      return { error: 'Location is outside our delivery area' };
    }
    return { type: 'reverse', lat: round4(lat), lng: round4(lng) };
  }

  if (type === 'search' || type === 'autocomplete') {
    const raw = params.get('q');
    if (typeof raw !== 'string') return { error: 'Invalid search text' };
    // Collapse whitespace and drop control characters before measuring length.
    const q = raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    if (q.length < QUERY_MIN || q.length > QUERY_MAX) return { error: 'Invalid search text' };
    return { type: 'search', q };
  }

  return { error: 'Invalid type' };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const asText = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

function asNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: CACHE_REVALIDATE_SECONDS },
    });
  } catch {
    throw new UpstreamError('network');
  }
  if (!res.ok) throw new UpstreamError(`status ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new UpstreamError('invalid json');
  }
}

// ---------------------------------------------------------------------------
// Barikoi
// ---------------------------------------------------------------------------

/**
 * `fallback` is the requested point for reverse lookups: Barikoi's reverse-geocode `place`
 * does not always include coordinates, and the client keeps the pin's own point anyway.
 */
function normaliseBarikoiPlace(p: unknown, fallback?: { lat: number; lng: number }): GeoResult | null {
  if (!isRecord(p)) return null;
  const latitude = asNumber(p.latitude) ?? fallback?.lat ?? null;
  const longitude = asNumber(p.longitude) ?? fallback?.lng ?? null;
  const address = asText(p.address);
  if (!address || latitude === null || longitude === null) return null;
  return {
    address,
    area: asText(p.area) || asText(p.sub_district),
    city: asText(p.city) || asText(p.district),
    latitude,
    longitude,
  };
}

async function lookupBarikoi(lookup: Lookup): Promise<GeoResult[]> {
  const params = new URLSearchParams({ api_key: BARIKOI_KEY });
  let url: string;

  if (lookup.type === 'reverse') {
    params.set('longitude', String(lookup.lng));
    params.set('latitude', String(lookup.lat));
    for (const flag of ['district', 'post_code', 'sub_district', 'union', 'address', 'area']) params.set(flag, 'true');
    url = `${BARIKOI_BASE}/reverse/geocode?${params}`;
  } else {
    params.set('q', lookup.q);
    params.set('city', 'dhaka');
    params.set('sub_area', 'true');
    params.set('sub_district', 'true');
    url = `${BARIKOI_BASE}/autocomplete/place?${params}`;
  }

  const data = await fetchJson(url);
  if (!isRecord(data)) throw new UpstreamError('unexpected shape');

  // Barikoi reports errors (e.g. a bad key) in the body; 404 just means "nothing found".
  const status = asNumber(data.status);
  if (status === 404) return [];
  if (status !== null && status !== 200) throw new UpstreamError(`body status ${status}`);

  if (lookup.type === 'reverse') {
    const place = normaliseBarikoiPlace(data.place, { lat: lookup.lat, lng: lookup.lng });
    return place ? [place] : [];
  }
  const places: unknown[] = Array.isArray(data.places) ? data.places : [];
  return places
    .map(p => normaliseBarikoiPlace(p))
    .filter((r): r is GeoResult => r !== null)
    .slice(0, MAX_RESULTS);
}

// ---------------------------------------------------------------------------
// OpenStreetMap Nominatim
// ---------------------------------------------------------------------------

// Server-wide gate: reserve the next free 1-second slot; wait for it, or refuse if the
// queue is already too long. (Per server instance, like rateLimit.)
let nextNominatimSlot = 0;

async function waitForNominatimSlot(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextNominatimSlot);
  const wait = slot - now;
  if (wait > NOMINATIM_MAX_WAIT_MS) throw new BusyError();
  nextNominatimSlot = slot + NOMINATIM_INTERVAL_MS;
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
}

function nominatimHeaders(): Record<string, string> {
  // Nominatim's policy asks for an identifying User-Agent with a way to contact us.
  const site = asText(process.env.NEXT_PUBLIC_BASE_URL);
  const contact = /^https?:\/\/[^\s()]+$/.test(site) ? ` (+${site})` : '';
  return { 'User-Agent': `FreshBasket/1.0${contact}`, 'Accept-Language': 'en' };
}

/** Builds a short, readable address from Nominatim's long display_name. */
function shortAddress(displayName: string, postcode: string): string {
  const parts = displayName
    .split(',')
    .map(s => s.trim())
    .filter(s => s && s !== postcode && s.toLowerCase() !== 'bangladesh' && !/division$/i.test(s));
  return [...new Set(parts)].slice(0, 4).join(', ');
}

/**
 * Street-style address from Nominatim's structured fields ("House 34, Road 11, Dhanmondi, Dhaka").
 * Used for map taps and GPS so the delivery address isn't the name of a nearby shop or clinic.
 */
function streetAddress(addr: Record<string, unknown>): string {
  const house = asText(addr.house_number);
  const road = asText(addr.road);
  const parts = [
    road ? (house ? `${house}, ${road}` : road) : "",
    asText(addr.neighbourhood) || asText(addr.quarter),
    asText(addr.suburb) || asText(addr.city_district),
    asText(addr.city) || asText(addr.town) || asText(addr.village),
  ].filter(Boolean);
  return [...new Set(parts)].slice(0, 4).join(", ");
}

function normaliseNominatimPlace(p: unknown, kind: "reverse" | "search" = "search"): GeoResult | null {
  if (!isRecord(p)) return null;
  const latitude = asNumber(p.lat);
  const longitude = asNumber(p.lon);
  const addr = isRecord(p.address) ? p.address : {};
  // Searches keep the place name the user looked for; reverse lookups describe the street.
  const address = (kind === "reverse" ? streetAddress(addr) : "") || shortAddress(asText(p.display_name), asText(addr.postcode));
  if (!address || latitude === null || longitude === null) return null;
  return {
    address,
    area:
      asText(addr.suburb) || asText(addr.neighbourhood) || asText(addr.quarter) ||
      asText(addr.city_district) || asText(addr.village) || asText(addr.town),
    city:
      asText(addr.city) || asText(addr.town) || asText(addr.state_district) ||
      asText(addr.county) || asText(addr.state),
    latitude,
    longitude,
  };
}

async function lookupNominatim(lookup: Lookup): Promise<GeoResult[]> {
  let url: string;
  if (lookup.type === 'reverse') {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lookup.lat),
      lon: String(lookup.lng),
      addressdetails: '1',
    });
    url = `${NOMINATIM_BASE}/reverse?${params}`;
  } else {
    const params = new URLSearchParams({
      format: 'jsonv2',
      q: lookup.q,
      countrycodes: 'bd',
      limit: String(MAX_RESULTS),
      addressdetails: '1',
    });
    url = `${NOMINATIM_BASE}/search?${params}`;
  }

  await waitForNominatimSlot();
  const data = await fetchJson(url, nominatimHeaders());

  if (lookup.type === 'reverse') {
    // Nominatim answers { error: 'Unable to geocode' } for points with no address (e.g. water).
    if (isRecord(data) && 'error' in data) return [];
    const place = normaliseNominatimPlace(data, "reverse");
    return place ? [place] : [];
  }
  if (!Array.isArray(data)) throw new UpstreamError('unexpected shape');
  return data
    .map(place => normaliseNominatimPlace(place, "search"))
    .filter((r): r is GeoResult => r !== null)
    .slice(0, MAX_RESULTS);
}

// ---------------------------------------------------------------------------
// Small in-memory result cache (checked before the Nominatim gate, so repeated
// lookups never wait). The fetch cache above also persists across instances.
// ---------------------------------------------------------------------------

const resultCache = new Map<string, { results: GeoResult[]; expires: number }>();
const RESULT_CACHE_MAX = 500;

function cacheKey(lookup: Lookup): string {
  return lookup.type === 'reverse' ? `r:${lookup.lat},${lookup.lng}` : `s:${lookup.q.toLowerCase()}`;
}

function readCache(key: string): GeoResult[] | null {
  const hit = resultCache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    resultCache.delete(key);
    return null;
  }
  return hit.results;
}

function writeCache(key: string, results: GeoResult[]) {
  if (resultCache.size >= RESULT_CACHE_MAX) {
    const oldest = resultCache.keys().next().value; // Map keeps insertion order
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(key, { results, expires: Date.now() + CACHE_TTL_MS });
}

async function lookupAddress(lookup: Lookup): Promise<GeoResult[]> {
  if (BARIKOI_KEY) {
    try {
      return await lookupBarikoi(lookup);
    } catch (err) {
      if (!(err instanceof UpstreamError)) throw err;
      console.warn('[geocode] Barikoi lookup failed, falling back to OpenStreetMap:', err.message);
    }
  }
  return lookupNominatim(lookup);
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const lookup = parseLookup(request.nextUrl.searchParams);
  if ('error' in lookup) return NextResponse.json({ error: lookup.error }, { status: 400 });

  const limit = await checkRateLimit(clientKey(request, 'geocode'), CLIENT_LIMIT, CLIENT_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const key = cacheKey(lookup);
  const cached = readCache(key);
  if (cached) return NextResponse.json({ results: cached });

  try {
    const results = await lookupAddress(lookup);
    writeCache(key, results);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof BusyError) {
      return NextResponse.json(
        { error: 'Location service is busy. Please try again in a moment.' },
        { status: 429, headers: { 'Retry-After': '2' } }
      );
    }
    // Log only the reason (no URLs: the Barikoi URL contains the API key).
    console.warn('[geocode] lookup failed:', err instanceof UpstreamError ? err.message : 'unexpected error');
    return NextResponse.json({ error: 'Location lookup failed' }, { status: 502 });
  }
}
