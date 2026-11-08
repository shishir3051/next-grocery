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
- Before finishing: `npm run typecheck`, `npm run lint` on changed files, `npm run build`.

## Domain notes

- Roles: `user`, `admin`, `delivery`. The first admin is created with `npm run promote-admin`.
- Order flow: `pending → processing → shipped → delivered`, or `cancelled` from any non-final
  state. Assigning a rider sets `shipped`. COD becomes paid on delivery; online orders only via
  the validated SSLCommerz callback.
- Wallet credit comes from referrals (50 BDT each side after the new user verifies email) and
  is usable for COD orders only.
- Seeding (`POST /api/seed`) wipes catalog data: admin-only and disabled in production.
