import { lookup } from "dns/promises";
import { isIP } from "net";

/**
 * Downloads an image from a URL and returns it as a base64 data URL (images are stored
 * in MongoDB). The URL comes from an admin form, so it is treated as untrusted:
 *
 * - https only, no credentials in the URL, default port only
 * - the host must resolve to public IP addresses (blocks SSRF to localhost, the cloud
 *   metadata service at 169.254.169.254, or other private-network services)
 * - redirects (max 3) are followed by hand and every hop is checked the same way
 * - the response must be a raster image type, at most 2 MB, within 10 seconds
 */

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast and reserved
  );
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7)); // IPv4-mapped
  return (
    v6 === "::" || v6 === "::1" ||
    v6.startsWith("fc") || v6.startsWith("fd") || // unique local
    v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || // link-local
    v6.startsWith("ff") // multicast
  );
}

async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Only https image URLs are allowed");
  if (url.username || url.password) throw new Error("Credentials in image URLs are not allowed");
  if (url.port && url.port !== "443") throw new Error("Non-standard ports are not allowed");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(a => isPrivateAddress(a.address))) {
    throw new Error("Image host resolves to a private address");
  }
  return url;
}

async function readLimited(response: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("Image is too large");
  if (!response.body) throw new Error("Empty response");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Image is too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

const MAX_REDIRECTS = 3;

/**
 * Fetches with redirects followed by hand, so every hop is re-checked: a public URL
 * must not be able to redirect the server to a private address.
 */
async function fetchPublicImage(url: string, signal: AbortSignal): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safeUrl = await assertPublicHttpsUrl(current);
    const response = await fetch(safeUrl, { redirect: "manual", cache: "no-store", signal, headers: { Accept: "image/*" } });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      current = new URL(location, safeUrl).toString();
      continue;
    }
    return response;
  }
  throw new Error("Too many redirects");
}

export async function getBase64FromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetchPublicImage(url, AbortSignal.timeout(FETCH_TIMEOUT_MS));
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) throw new Error(`Unsupported image type: ${contentType || "unknown"}`);

    const buffer = await readLimited(response, MAX_IMAGE_BYTES);
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    // Log the reason only; the URL may be long or sensitive.
    console.error("Image download rejected:", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

// Alias for flexibility/consistency in previous imports
export const downloadImageAsBase64 = getBase64FromUrl;
