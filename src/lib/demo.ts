/**
 * Live-demo mode.
 *
 * Turned on with DEMO_MODE=true (server environment). It is meant for a public showcase
 * deployment, never for a real store. When it is on:
 *
 * - /showcase serves the product landing page, and the login page shows one-click
 *   "demo" logins for the admin, customer and rider accounts below (no passwords).
 * - The demo admin can open every admin page but cannot change anything, except the
 *   status and rider of demo orders (so the full order → delivery flow can be tried).
 * - Demo accounts see other people's personal data masked.
 * - Orders placed by the demo customer never touch real stock or coupon counts, and old
 *   ones are cleaned up automatically.
 *
 * The demo accounts are created by `npm run db:seed -- --demo-users`.
 * This file is imported by client components too, so it must stay free of server-only code.
 */

export const DEMO_EMAIL_DOMAIN = "demo.freshbasket.app";

export const DEMO_ACCOUNTS = {
  admin: { email: `admin@${DEMO_EMAIL_DOMAIN}`, role: "admin", home: "/admin", label: "Admin" },
  customer: { email: `customer@${DEMO_EMAIL_DOMAIN}`, role: "user", home: "/", label: "Customer" },
  rider: { email: `rider@${DEMO_EMAIL_DOMAIN}`, role: "delivery", home: "/delivery", label: "Delivery rider" },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

export const isDemoRole = (value: unknown): value is DemoRole =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(DEMO_ACCOUNTS, value);

/** Server only: is the live-demo mode switched on for this deployment? */
export const isDemoModeEnabled = () => process.env.DEMO_MODE === "true";

/** Demo accounts are recognised by their email domain, so no database flag is needed. */
export const isDemoEmail = (email: unknown): boolean =>
  typeof email === "string" && email.trim().toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);

export const DEMO_READ_ONLY_MESSAGE =
  "This is the read-only live demo, so changes are turned off. The full version lets you change everything.";

/** Response header set on "blocked in demo" answers, so the UI can explain them. */
export const DEMO_READ_ONLY_HEADER = "x-demo-read-only";

// ---------------------------------------------------------------------------
// Masking: demo sessions never see real customers' personal data.
// ---------------------------------------------------------------------------

const DOT = "•••";

/** First character by code point: charAt would cut an emoji in half (a lone surrogate). */
const initial = (text: string) => Array.from(text)[0] ?? "";

export function maskEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) return DOT;
  if (isDemoEmail(email)) return email;
  const [local, domain] = email.split("@");
  const dot = domain.lastIndexOf(".");
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${initial(local)}${DOT}@${initial(domain)}${DOT}${tld}`;
}

export function maskPhone(phone: unknown): string {
  if (typeof phone !== "string" || !phone.trim()) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 2 ? `${DOT}${DOT}${digits.slice(-2)}` : DOT;
}

/** "Golam Rahman" → "G••• R.", "rahimuddin" → "r•••", "golam.rahman" → "g•••" */
export function maskName(name: unknown): string {
  if (typeof name !== "string" || !name.trim()) return "Customer";
  const parts = name.trim().split(/\s+/);
  // Only initials: the demo is public (and its screenshots are on the landing page), so not
  // even a first name of a real customer is shown. "Sudipta Akter" -> "S••• A.".
  // Names are free text (an email, phone number or username can end up here), which is
  // another reason to never show a whole word.
  const first = `${initial(parts[0])}${DOT}`;
  return parts.length === 1 ? first : `${first} ${initial(parts[parts.length - 1])}.`;
}

type Address = { street?: string; city?: string; zipCode?: string; phone?: string } | null | undefined;

export function maskAddress<T extends Address>(address: T): T {
  if (!address) return address;
  return {
    ...address,
    street: address.street ? "Hidden in the demo" : "",
    zipCode: address.zipCode ? DOT : "",
    phone: maskPhone(address.phone),
  } as T;
}
