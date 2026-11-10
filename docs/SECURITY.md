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
| Google sign-in accepts only Google accounts with a verified email. Accounts are matched by Google id, then email; linking to an unverified account replaces its password and pending code (blocks pre-registration takeover); an email tied to a different Google account is refused | `lib/googleAccount.ts` |
| JWT sessions (30 days) are re-checked against the database every minute: deleted accounts and password changes end the session, role changes apply | `lib/auth.ts` |

## Authorization

- Every protected API calls one guard from `lib/authGuard.ts`: `requireRole(...)` to read,
  `requireRoleForWrite(...)` to change data, `requireUser()` for any signed-in account. The guard
  reads the account and its role **from the database**, not from the token, so a deleted or
  demoted account loses access at once. The rule itself is `decideAccess()` in `lib/access.ts`:
  401 without an existing account, 403 for a role outside the list, 403 "read-only demo" for a
  demo account changing data on a live demo (tested in `tests/access.test.ts`).
- `src/proxy.ts` redirects non-admins away from `/admin` and non-riders from `/delivery`
  (a convenience; the API checks are the security boundary).
- Riders can only see and update orders **assigned to them**. Order status changes follow
  fixed rules (`lib/orderStatus.ts`); cancelling returns stock, coupon use and wallet credit.
- Password hashes and code hashes are never returned by any API (`PRIVATE_USER_FIELDS`).

### Route access matrix

Every route handler in `src/app` and every method it exports. `tests/route-access.test.ts`
(part of `npm test`) fails if a route is missing from this table, if a handler lacks the
check listed for it, if any `/api/admin` method skips the admin role, or if any
POST/PUT/PATCH/DELETE has no guard, rate limit or payment verification. The table below is
generated from that test (`UPDATE_DOCS=1 npm test`), so it always matches the code.

<!-- route-access:start -->
| Route | Method | Who can call it | Enforced in the handler by |
| --- | --- | --- | --- |
| `/api/admin/categories` | GET | Admin | `requireRole("admin")` |
| `/api/admin/categories` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/categories` | PUT | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/categories` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/coupons` | GET | Admin | `requireRole("admin")` |
| `/api/admin/coupons` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/coupons` | PUT | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/coupons` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/hero` | GET | Admin | `requireRole("admin")` |
| `/api/admin/hero` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/hero` | PUT | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/hero` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/messages` | GET | Admin (demo admin sees customer data masked) | `requireRole("admin")`, `isDemoRestricted(` |
| `/api/admin/messages/[id]` | PATCH | Admin (demo admin can't send replies) | `requireRole("admin")`, `isDemoRestricted(`, `demoReadOnly(` |
| `/api/admin/messages/[id]` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/orders` | GET | Admin (demo admin sees customer data masked) | `requireRole("admin")`, `isDemoRestricted(` |
| `/api/admin/orders` | PATCH | Admin (demo admin: demo orders only) | `requireRole("admin")`, `isDemoRestricted(`, `demoReadOnly(` |
| `/api/admin/products` | GET | Admin | `requireRole("admin")` |
| `/api/admin/products` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/products` | PUT | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/products` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/settings` | GET | Admin | `requireRole("admin")` |
| `/api/admin/settings` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/stats` | GET | Admin (demo admin sees customer data masked) | `requireRole("admin")`, `isDemoRestricted(` |
| `/api/admin/users` | GET | Admin (demo admin sees customer data masked) | `requireRole("admin")`, `isDemoRestricted(` |
| `/api/admin/users` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/users` | PUT | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/admin/users` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/ai/recipes` | POST | Public, rate-limited | `checkRateLimit(` |
| `/api/ai/smart-search` | POST | Public, rate-limited | `checkRateLimit(` |
| `/api/auth/[...nextauth]` | GET | Public (NextAuth sign-in, session and CSRF endpoints) | nothing: public by design |
| `/api/auth/[...nextauth]` | POST | Public (NextAuth sign-in, session and CSRF endpoints) | nothing: public by design |
| `/api/auth/forgot-password` | POST | Public, rate-limited | `checkRateLimit(` |
| `/api/auth/register` | POST | Public, rate-limited | `checkRateLimit(` |
| `/api/auth/reset-password` | POST | Public, rate-limited | `checkRateLimit(` |
| `/api/auth/verify-otp` | POST | Public, rate-limited | `checkRateLimit(` |
| `/api/categories` | GET | Public (read-only store content) | nothing: public by design |
| `/api/contact` | POST | Public contact form, rate-limited (demo accounts: read-only) | `checkRateLimit(`, `demoReadOnly(` |
| `/api/coupons/validate` | POST | Signed-in account, rate-limited | `requireUser()`, `checkRateLimit(` |
| `/api/delivery/orders` | GET | Rider or admin: only orders assigned to them | `requireRole("delivery", "admin")`, `assignedTo: auth.user.id` |
| `/api/delivery/orders` | PATCH | Rider or admin: only orders assigned to them (demo rider: demo orders only) | `requireRole("delivery", "admin")`, `assignedTo: auth.user.id`, `isDemoRestricted(` |
| `/api/geocode` | GET | Public, rate-limited | `checkRateLimit(` |
| `/api/news` | GET | Public (published articles) | nothing: public by design |
| `/api/news/[id]` | GET | Public (published articles; drafts only for admins) | `requireAdmin()` |
| `/api/news/admin` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/news/admin/[id]` | PATCH | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/news/admin/[id]` | DELETE | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/orders` | GET | Signed-in account: only their own orders | `requireUser()`, `user: auth.user.id` |
| `/api/orders` | POST | Signed-in account, rate-limited (order is saved for that account) | `requireUser()`, `checkRateLimit(`, `user: userId` |
| `/api/payments/ssl-init` | POST | Signed-in account, rate-limited (order is saved for that account) | `requireUser()`, `checkRateLimit(`, `user: user.id` |
| `/api/payments/ssl-status` | POST | SSLCommerz callback: paid only after SSLCommerz confirms; cancel needs the signed link | `validateSslPayment(`, `timingSafeEqual(` |
| `/api/products` | GET | Public (read-only store content) | nothing: public by design |
| `/api/public/coupons` | GET | Public (active coupons shown in the cart) | nothing: public by design |
| `/api/public/hero` | GET | Public (read-only store content) | nothing: public by design |
| `/api/seed` | POST | Admin (demo admin: read-only) | `requireRoleForWrite("admin")` |
| `/api/settings` | GET | Public (store name, delivery fees, maintenance flag) | nothing: public by design |
| `/api/stats/public` | GET | Public (read-only store content) | nothing: public by design |
| `/api/user/profile` | GET | Signed-in account: only their own profile | `requireUser()`, `auth.user.id` |
| `/api/user/profile` | PUT | Signed-in account: only their own profile (demo accounts: read-only) | `requireRoleForWrite()`, `auth.user.id` |
| `/media/products/[id]/[version]` | GET | Public (product photos) | nothing: public by design |
<!-- route-access:end -->

## Data access rules

MongoDB through Mongoose only: no SQL, no `$where`, no server-side JavaScript. Who can read
and change each collection, and how each query is scoped:

| Collection | Read | Change | Scoping in the query |
|---|---|---|---|
| `orders` | The customer (own), the assigned rider, admins | Customer creates; admin changes status and rider; rider marks delivered; SSLCommerz callback marks paid | Customer: `{ user: auth.user.id }`. Rider: `{ assignedTo: auth.user.id }` (demo rider also `isDemo: true`). Payment callback: by `tran_id` only after SSLCommerz validates it. Demo admin changes demo orders only |
| `users` | The account itself (`/api/user/profile`), admins | The account itself (name, phone, address), admins (role) | Profile: `findById(auth.user.id)` with `PRIVATE_USER_FIELDS` removed. Admin list is masked for the demo admin |
| `products`, `categories` | Everyone | Admins | Public lists select only display fields and never send photo data (`/media/products/...` serves photos) |
| `coupons` | Everyone (active ones), admins (all) | Admins; usage counted atomically at checkout | Checkout and the cart check use one rule, `couponProblem()` in `lib/orders.ts` (tested in `tests/coupons.test.ts`) |
| `news`, `heroslides`, `settings` | Everyone (published only) | Admins | Drafts only for admins (`/api/news/[id]`) |
| `contactmessages` | Admins (masked for the demo admin) | Anyone sends (rate-limited); admins reply | Demo accounts can't send or reply |
| `ratelimits` | Server only | Server only | Keyed by IP or account id, expire automatically (TTL index) |

How queries stay safe:

- Ids are checked with `isObjectId()` before any `findById`; text fields pass `requiredString()` /
  `optionalString()` (type and length) and numbers `toNumber()` (range), so a request can never
  put an operator object such as `{"$ne": null}` into a filter.
- Search text is escaped with `escapeRegex()` and capped at 64 characters.
- Writes copy named fields only (`$set` with an allow-list); request bodies are never spread into
  a document. Stock, coupon use and wallet credit change through atomic conditional updates.
- Indexes for every lookup above are created by `npm run db:indexes` (`database/indexes.js`).

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
- A fail/cancel callback cancels the order only when it carries the signature that
  `api/payments/ssl-init` puts on those URLs (HMAC-SHA256 of the transaction id, keyed with
  `NEXTAUTH_SECRET`), so knowing a transaction id is not enough to cancel someone's checkout.
- Abuse limits: 10 orders / 10 min per account, at most 5 unconfirmed COD orders, 20 coupon
  checks / 10 min.

## Live-demo mode (`DEMO_MODE=true`)

- One-click demo logins use a separate sign-in provider that exists only in demo mode and only
  signs into the three seeded demo accounts (rate limited per IP).
- One-click demo sessions end as soon as `DEMO_MODE` is off, checked on every request
  (`lib/auth.ts`, `src/proxy.ts`), so a saved demo-admin cookie never becomes a full admin.
- Every data-changing admin API uses `requireRoleForWrite()`: demo accounts get a 403
  "read-only demo" answer. Exceptions are deliberate and narrow: the demo admin may change the
  status of demo orders and assign them to the demo rider; the demo rider may deliver demo
  orders; the demo customer may place orders.
- The demo rider is the only possible assignee (not the demo admin itself or any other
  account), and payment status is read-only in the demo: the demo admin can't mark orders paid.
- Demo orders (`isDemo`) never reserve stock, coupon uses or wallet credit, and are cleaned up
  automatically.
- Demo orders store a sample address and no delivery note (`lib/demoOrder.ts`), never what the
  visitor typed: the demo customer is shared, so every other visitor would see it.
- Demo sessions are rate-limited per visitor: the shared demo customer's order, online-payment
  and coupon-check limits count per IP, not per account, so one visitor can't lock the others
  out of checkout. Orders and payments also have one ceiling for all demo visitors together.
- Demo admin and rider sessions never get SSLCommerz transaction ids (`paymentProviderId` is
  removed from every order they see). The fail/cancel callbacks are signed as well (see
  [Checkout and payments](#checkout-and-payments)), so a transaction id alone cancels nothing.
- Online payment in the demo works only with the SSLCommerz sandbox: with `IS_LIVE=true` it is
  refused, because demo orders are deleted after 3 days and would leave no refund trail.
- Demo sessions see real customers' personal data masked (`lib/demoMask.ts`): names (initials
  only, e.g. "S••• A."), emails, phones, addresses, avatars, delivery notes and contact-message text. Staff names in message
  replies are masked too (shown as "Store team").
- Demo addresses (`@demo.freshbasket.app`) can never register, verify, reset a password or sign
  in with Google, so whoever controls that mail domain gains nothing.

## Contact form

- `POST /api/contact`: 5 messages per hour per IP and 3 per email, a hidden honeypot field for
  bots, strict field validation. Messages are stored and shown to admins as plain text.
- Alert and reply emails escape customer text, strip line breaks from subjects (no header
  injection), and the form never emails the address a visitor types (no spam relay); only admin
  replies, written by staff, go to the customer.

## Rate limiting

`lib/rateLimit.ts` keeps a fast in-memory window plus a shared MongoDB counter (TTL-indexed
`ratelimits` collection), so limits hold across serverless instances. It fails open if the
database is unreachable. Behind your own server, the reverse proxy must overwrite `X-Real-IP`
and `X-Forwarded-For` with the address of the actual connection, never pass the client's values
through: otherwise a made-up header gets a fresh per-IP limit on every request (see
[DEPLOYMENT.md](DEPLOYMENT.md) for Caddy and nginx).

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

Last run for 1.2.2 (2026-11-10):

```text
$ npm audit --omit=dev        # production dependencies
found 0 vulnerabilities

$ npm audit                   # including development tools
7 moderate severity vulnerabilities   # all one advisory, in lint tooling only (below)
```

| Package | Version | Status |
|---|---|---|
| `next` | 16.4.5 | No known advisories |
| `next-auth` | 4.24.15 | No known advisories. Stays on 4.x on purpose: 4.24.15 is the current stable release on npm (`latest`), while Auth.js v5 is still a beta (`5.0.0-beta.32`). Update within 4.x for security fixes |
| `mongoose` | 9.11.4 | No known advisories |
| `nodemailer` | 10.3.1 | No known advisories. The one `overrides` entry makes `next-auth` use this same version instead of the older 7.x it asks for |
| `minimatch` 10.2.6, inside `typescript-eslint` 8.72.2 (lint only, never shipped) | dev | Moderate advisory GHSA-g3hv-75wg-m249, counted 7 times through the `typescript-eslint` packages. Fixed when `typescript-eslint` moves to minimatch 11.0.1 or later |

- Every dependency in `package.json` is an exact version (no `^` ranges), and
  `package-lock.json` pins the whole tree: install with `npm ci`.

## Known limitations

- `script-src` allows `'unsafe-inline'` because Next.js emits inline bootstrap scripts; a
  nonce-based CSP would force every page to render dynamically.
- Refunds for cancelled online payments are done manually in the SSLCommerz panel (logged).
- An SSLCommerz checkout the customer abandons without returning keeps its coupon reserved
  until an admin cancels the order.
