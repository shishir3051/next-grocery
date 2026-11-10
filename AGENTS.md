# AGENTS.md — FreshBasket codebase guide

Guide for AI coding agents (Claude Code, Codex, Cursor) and developers working on this repo.
`CLAUDE.md` imports this file.

## What this is

FreshBasket is a grocery e-commerce app for Bangladesh: storefront, cart, checkout
(cash on delivery, wallet, SSLCommerz cards/mobile banking), AI product search and recipes,
delivery-location map, admin dashboard, and a delivery-rider view.

**Stack:** Next.js 16 (App Router, `src/proxy.ts` instead of middleware), React 19, TypeScript,
MongoDB + Mongoose 9, NextAuth 4 (credentials, JWT sessions), Tailwind CSS 4, Framer Motion,
Leaflet, Google Gemini, Nodemailer.

## Commands

```bash
npm run dev          # http://localhost:3000 (needs .env.local, see .env.example)
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run audit:prod   # must report 0 vulnerabilities
npm test             # 36 unit tests in tests/ (Node 22, 22.18 or later: built-in TypeScript support)
npm run test:demo -- http://localhost:3000   # API smoke test of the demo flow (DEMO_MODE=true)
npm run promote-admin -- user@example.com   # make a verified user an admin
npm run normalize-emails [-- --apply]       # one-time lower-case email migration
npm run db:setup     # indexes + sample data + demo accounts on a new database
```

## Layout

```
src/
  app/                    pages (App Router) and API routes
    api/admin/*           admin CRUD: products, categories, coupons, hero, orders, users, settings, stats
    api/auth/*            register, verify-otp, forgot/reset password, NextAuth (credentials + Google)
    api/contact           public contact form → ContactMessage + email alert
    api/admin/messages    admin inbox: list, status, reply by email, delete
    api/orders            COD checkout (POST) and order history (GET)
    api/payments/*        SSLCommerz init and callback/IPN
    api/delivery/orders   rider: assigned orders, mark delivered
    api/ai/*              Gemini smart search and recipes
    api/geocode           Barikoi / OpenStreetMap proxy
    admin/, delivery/     role-gated pages
  components/             UI (layout/, product/, admin/, ai/, map/, ui/)
  context/                Auth, Cart, Wishlist providers
  lib/
    auth.ts               NextAuth options, login rate limiting, session re-validation
    googleAccount.ts      Google sign-in: find/link/create the account safely
    email.ts              Nodemailer: codes, plain emails (escapes customer text)
    authGuard.ts          requireRole() for reads, requireRoleForWrite() for changes (blocks demo accounts)
    access.ts             decideAccess(): the pure role rule behind authGuard (tests/access.test.ts)
    demo.ts, demoMask.ts  live-demo mode (DEMO_MODE): demo accounts, masking of personal data
    validation.ts         input validators (strings, numbers, ObjectIds, images, slugs, email)
    http.ts               JSON body reader and error responses (never leak internals)
    rateLimit.ts          in-memory + MongoDB shared rate limiter
    orders.ts             order parsing, server-side pricing, atomic stock/coupon/wallet
    orderStatus.ts        order status rules and cancellation side effects
    otp.ts                one-time codes (crypto random, HMAC-stored)
    sslcommerz.ts         payment validation API
    imageUtils.ts         SSRF-safe image download
    pricing.ts            getEffectivePrice() — the only place a product's price is computed
  models/                 Mongoose schemas (User, Product+Category, Order, Coupon, News, HeroSlide, Settings, RateLimit)
  proxy.ts                redirects for /admin and /delivery (UX only; APIs re-check)
database/                 indexes.js, seed.js (npm run db:setup), connect.js helper
docs/                     api.md, DEPLOYMENT.md, SECURITY.md
scripts/                  one-off admin scripts (run with node, read .env.local)
```

## Rules for changes

**Security (non-negotiable; see docs/SECURITY.md):**
- Protected API routes start with `const auth = await requireRole("admin")` (or `"delivery"`,
  or `requireUser()`), then `if ("response" in auth) return auth.response;`. Handlers that
  change data use `requireRoleForWrite(...)` instead, so live-demo accounts stay read-only;
  GET handlers returning customers' personal data mask it when `isDemoRestricted(auth.user)`.
- Every route handler and method is listed in `tests/route-access.test.ts` with who may call
  it and the check that enforces it. Add new routes there, then run `UPDATE_DOCS=1 npm test`
  to refresh the route access matrix in docs/SECURITY.md; `npm test` fails until both match.
- Read bodies with `readJsonObject()`. Copy only expected fields, each validated with
  `lib/validation.ts`. Never spread a request body into `create`/`update`.
- Never put a value from the request into a Mongo filter unless it is a validated string or
  ObjectId. Escape user text before `$regex` (`escapeRegex`).
- Never trust prices, totals, names or images from the browser; recompute on the server.
- Money and stock changes use atomic conditional updates (`findOneAndUpdate` with a filter on
  the current value) and undo earlier steps when a later one fails.
- Return errors with `badRequest()` / `serverError()`; never return `error.message`.
- Rate-limit anything that sends email, costs money (AI, geocoding) or can be brute-forced,
  with `checkRateLimit()`.
- Never return password or code hashes: select with `PRIVATE_USER_FIELDS`.
- Secrets only in environment variables, never with the `NEXT_PUBLIC_` prefix. Add new
  variables to `.env.example`.
- Don't render user content as HTML.

**Code style:**
- Match the existing patterns; keep route handlers thin and put shared logic in `src/lib`.
- `discountPrice` is the **sale price**, not an amount off. Use `getEffectivePrice()`.
- Use `slugify()` for slugs (handles Bangla names).
- Before finishing: `npm run typecheck`, `npm run lint` on changed files, `npm test`, `npm run build`.

## Access control by route

Every route handler, grouped by who may call it. `tests/route-access.test.ts` checks each
handler for the guard named here (and fails on any unlisted route); the per-method table is
in docs/SECURITY.md ("Route access matrix").

| Who | Guard in the handler | Routes |
|---|---|---|
| Admin | reads `requireRole("admin")`, writes `requireRoleForWrite("admin")` | `/api/admin/categories`, `coupons`, `hero`, `messages`, `messages/[id]`, `orders`, `products`, `settings`, `stats`, `users`; `/api/news/admin`, `/api/news/admin/[id]`; `/api/seed` |
| Rider (or admin) | `requireRole("delivery", "admin")`, query `{ assignedTo: auth.user.id }` | `/api/delivery/orders` (GET, PATCH) |
| Any signed-in account, own data only | `requireUser()` (profile PUT: `requireRoleForWrite()`) | `/api/orders` (GET filters `{ user: auth.user.id }`; POST saves `user: auth.user.id`), `/api/payments/ssl-init`, `/api/coupons/validate`, `/api/user/profile` |
| Public, rate-limited | `checkRateLimit()` | `/api/auth/register`, `verify-otp`, `forgot-password`, `reset-password`; `/api/ai/smart-search`, `/api/ai/recipes`; `/api/geocode`; `/api/contact` |
| Public, read-only | none (published or active data only) | `/api/products`, `/api/categories`, `/api/news`, `/api/news/[id]` (drafts: `requireAdmin()`), `/api/public/coupons`, `/api/public/hero`, `/api/settings`, `/api/stats/public`, `/media/products/[id]/[version]` |
| SSLCommerz | signature and validation API (below) | `/api/payments/ssl-status` |
| NextAuth | NextAuth's own CSRF and session checks | `/api/auth/[...nextauth]` |

The guard reads the account and role from the database on every call (`lib/authGuard.ts`);
the rule itself is `decideAccess()` in `lib/access.ts` (401 signed out or deleted, 403 wrong
role, 403 read-only for demo accounts changing data), tested in `tests/access.test.ts`.

## Payments: SSLCommerz callback and IPN

- `POST /api/payments/ssl-init` (`requireUser()`, rate-limited) prices the order from the
  database, saves it as unpaid with a random `tran_id`, and registers all four gateway URLs on
  one route (`src/app/api/payments/ssl-init/route.ts`, lines 105–108):
  `success_url`, `fail_url`, `cancel_url` and `ipn_url` →
  `/api/payments/ssl-status?status=success|fail|cancel|ipn`.
- `POST /api/payments/ssl-status` (`src/app/api/payments/ssl-status/route.ts`) is the
  callback **and** the IPN listener:
  - success / IPN: reads `val_id` (line 44), confirms it with the SSLCommerz validation API
    (`validateSslPayment()` in `lib/sslcommerz.ts`: status must be `VALID` or `VALIDATED`),
    loads the stored order by the validated `tran_id` (line 50), and requires the paid amount
    to equal `order.totalAmount` within 0.01 and the currency to be BDT (line 54). Only then
    does an atomic `findOneAndUpdate` move it from unpaid/pending to paid/processing (line 61),
    so the redirect and the IPN can't both apply it. A mismatch is logged and nothing changes.
  - fail / cancel: cancels the unpaid order only when the request carries the HMAC signature
    that ssl-init put in those URLs, compared with `timingSafeEqual`; without it nothing
    changes (`npm run test:demo` checks this).
- Stock and coupon use are reserved atomically (`lib/orders.ts`) and returned if the order is
  cancelled.

## Data model and indexes

Schemas live in `src/models` and are the source of truth; `npm run db:indexes`
(`database/indexes.js`) creates every index below on an empty database.

| Collection | Key fields and constraints | Indexes | Written by |
|---|---|---|---|
| `users` | `email` unique, lower-case; `role` enum `user`/`admin`/`delivery`; `walletBalance` min 0; password and code hashes never returned (`PRIVATE_USER_FIELDS`) | `email` unique; `googleId`, `referralCode` unique sparse; `role` | sign-up; the user (profile); admins |
| `orders` | `user` ref required; items with `productId` ref, server-side `price`, `quantity` ≥ 1; `totalAmount` ≥ 0; `status` enum of 5; `assignedTo` rider; `paymentProvider` + `paymentProviderId`; `isDemo` | `createdAt`; `status`+`createdAt`; `user`+`createdAt`; `assignedTo`+`status`; `paymentProvider`+`paymentProviderId` | checkout; admins; the assigned rider; the payment callback |
| `products`, `categories` | `slug` unique; `price`, `discountPrice` (sale price), `stock`, `category` ref; categories nest 3 levels via `parentId` | `slug` unique; `category`; `stock`; text index on name/description; `createdAt`+`_id` | admins |
| `coupons` | `code` unique, upper-case; `discountType` enum; `minOrderAmount`; `usageLimit` / `usedCount` | `code` unique; `isActive`+`expiryDate` | admins; `usedCount` by atomic `$inc` at checkout |
| `news`, `heroslides`, `settings` | `slug` unique (news); `isPublished`; `isActive` + `order` | `slug` unique; `isPublished`+`createdAt`; `isActive`+`order` | admins |
| `contactmessages` | `name` ≤ 80, `email` ≤ 254, `message` ≤ 3000, replies ≤ 5000; `subject` and `status` enums | `status`+`createdAt`; `createdAt` | the public form (rate-limited); admins |
| `ratelimits` | `_id` (the limit key: IP or account id plus action), `count`, `expiresAt` | TTL on `expiresAt` | the server |

## Domain notes

- Roles: `user`, `admin`, `delivery`. The first admin is created with `npm run promote-admin`.
- Order flow: `pending → processing → shipped → delivered`, or `cancelled` from any non-final
  state. Assigning a rider sets `shipped`. COD becomes paid on delivery; online orders only via
  the validated SSLCommerz callback.
- Wallet credit comes from referrals (50 BDT each side after the new user verifies email) and
  is usable for COD orders only.
- Seeding (`POST /api/seed`) wipes catalog data: admin-only and disabled in production.
