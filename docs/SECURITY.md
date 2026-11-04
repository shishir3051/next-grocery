# Security model

How FreshBasket protects accounts, payments and data, and where each control lives.
To report a vulnerability, contact the maintainer privately instead of opening a public issue.

## Authentication and sessions

| Control | Where |
|---|---|
| Passwords hashed with bcrypt (cost 12), 8–128 characters | `api/auth/register`, `api/auth/reset-password` |
| Login rate limits: 30 attempts / 15 min per IP, 10 wrong passwords / 15 min per account | `lib/auth.ts` |
| Same error and timing for unknown emails and wrong passwords (no account probing) | `lib/auth.ts` |
| Emails stored and matched in lower case (one inbox = one account) | `models/User.ts` |
| Email verification and password reset use 6-digit codes from `crypto.randomInt`, stored only as an HMAC, valid 10 minutes, single use, max 5 guesses per code | `lib/otp.ts` |
| Resend cooldown 1 minute; reset: 5 codes and 10 wrong guesses per hour per account; verification and reset also limited per IP | `api/auth/*` |
| JWT sessions (30 days) are re-checked against the database every minute: deleted accounts and password changes end the session, role changes apply | `lib/auth.ts` |

## Authorization

- Every admin and delivery API calls `requireRole()` (`lib/authGuard.ts`), which reads the role
  **from the database**, not from the token.
- `src/proxy.ts` redirects non-admins away from `/admin` and non-riders from `/delivery`
  (a convenience; the API checks are the security boundary).
- Riders can only mark **their own** shipped orders as delivered. Order status changes follow
  fixed rules (`lib/orderStatus.ts`); cancelling returns stock, coupon use and wallet credit.
- Password hashes and code hashes are never returned by any API (`PRIVATE_USER_FIELDS`).

## Input handling

- Each route copies only the fields it expects and checks type, length and range
  (`lib/validation.ts`). Request bodies are never spread into database writes.
- Filters only receive validated strings and ObjectIds, which blocks NoSQL operator injection
  (`{"email": {"$ne": null}}`).
- Product search escapes regular-expression characters and caps length (no ReDoS).
- Images are PNG/JPEG/WebP/GIF/AVIF data URLs up to 2 MB, or https URLs. SVG is rejected.
- News is rendered as plain text; there is no `dangerouslySetInnerHTML` on user content.
- Server-side image downloads (`lib/imageUtils.ts`) allow https only, refuse private/loopback/
  cloud-metadata addresses (re-checked on every redirect hop), and cap size and time (no SSRF).

## Checkout and payments

- Prices, names and totals are rebuilt on the server from the database; the browser only sends
  product ids and quantities (`lib/orders.ts`). Quantities are integers 1–100.
- Stock, coupon use and wallet are reserved with atomic conditional updates and rolled back on
  failure, so concurrent orders can't oversell or double-spend.
- SSLCommerz: an order is marked paid only after the server calls the SSLCommerz validation API
  with `val_id`, and the transaction id, amount and currency match (`api/payments/ssl-status`).
- Abuse limits: 10 orders / 10 min per account, at most 5 unconfirmed COD orders, 20 coupon
  checks / 10 min.

## Rate limiting

`lib/rateLimit.ts` keeps a fast in-memory window plus a shared MongoDB counter (TTL-indexed
`ratelimits` collection), so limits hold across serverless instances. It fails open if the
database is unreachable. Behind your own server, the reverse proxy must set `X-Real-IP`
(see [DEPLOYMENT.md](DEPLOYMENT.md)).

## HTTP security headers (`next.config.ts`)

`Content-Security-Policy` (no third-party scripts, `frame-ancestors 'none'`, `object-src 'none'`,
`form-action 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy: same-origin`, HSTS (by Vercel, or by the app when self-hosted),
`Cache-Control: no-store` on all API responses, and no `X-Powered-By`.

## Secrets and errors

- All secrets come from environment variables; `.env*` files are git-ignored (only
  `.env.example` is tracked). Server-only keys never use the `NEXT_PUBLIC_` prefix.
- APIs return generic error messages; details are logged on the server only.
- Destructive seeding is admin-only and disabled in production.

## Dependencies

`npm run audit:prod` must report 0 vulnerabilities for production dependencies before a
release. Remaining advisories are in development-only lint tooling.

## Known limitations

- `script-src` allows `'unsafe-inline'` because Next.js emits inline bootstrap scripts; a
  nonce-based CSP would force every page to render dynamically.
- Refunds for cancelled online payments are done manually in the SSLCommerz panel (logged).
- An SSLCommerz checkout the customer abandons without returning keeps its coupon reserved
  until an admin cancels the order.
