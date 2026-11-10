# 🥑 FreshBasket – Grocery E-commerce Platform

FreshBasket is a complete online grocery store for Bangladesh, built with **Next.js 16**, **TypeScript** and **MongoDB**: storefront, checkout with cash on delivery and SSLCommerz, AI product search, an admin panel, and a delivery-rider view.

**Live demo:** https://next-grocery-nine.vercel.app/showcase (product page) · https://next-grocery-nine.vercel.app (store)

**One-click demo logins, no password:** open the login page and choose **Admin demo**, **Customer** or **Rider**. Try the full flow: order as the customer, assign the order to the Demo Rider as the admin, then mark it delivered as the rider. The demo admin can open every page but only changes demo orders; real customers' personal data is masked.

**Demo accounts** (live demo only, read-only except demo orders): `admin@demo.freshbasket.app` (admin), `customer@demo.freshbasket.app` (customer) and `rider@demo.freshbasket.app` (delivery rider). No password is needed on the live demo: use the one-click buttons. `npm run test:demo -- <url>` checks the whole flow and the role rules against a running demo (customer order, admin assigns the Demo Rider, rider delivers).

**Verified on the live demo** (2026-11-10, version 1.2.2): `npm run test:demo -- https://next-grocery-nine.vercel.app` passed **19/19 checks**: one-click login for all three roles with no password, a cash-on-delivery checkout as the customer, the admin assigning the Demo Rider, the rider marking it delivered, and every demo restriction (no real stock used, no real orders or settings changed, personal data masked).

**Sample data on the live demo** (from `npm run db:setup`, checked 2026-11-10): 101 products in 11 categories, 2 active coupons (`WELCOME10`, `FRESH50`), 3 news articles, 3 hero banners, the three demo accounts and demo orders placed by visitors (deleted after 3 days).

Set up your own copy, including the demo accounts and the optional live-demo mode, with [HowToSetup.md](HowToSetup.md).

## ✅ Features (datasheet)

### Storefront
- Catalogue with categories and subcategories, product search, product details, wishlist and cart.
- Checkout: **cash on delivery**, **wallet credit**, **SSLCommerz** online payment (verified server-side), coupons, configurable delivery fee and free-delivery threshold.
- **AI smart search** (English, Banglish, Bangla) and **recipe suggestions** from the cart using Google Gemini, with keyword and curated fallbacks when no AI key is set.
- **Delivery location** picker with a map, address search and "use my location" (OpenStreetMap or Barikoi), used to fill the checkout address.
- Accounts: sign-up with 6-digit email verification, password reset, optional **Google sign-in**, profile and address, order history, referral bonus (wallet).
- Content pages: offers (active coupons), news, FAQ, store locations, policies, and a **contact form**.

### Admin panel (`/admin`)
- Dashboard: sales of the last 7 days, order and user counts, low-stock products, latest orders.
- Manage products (with image upload or download from a URL), categories (3 levels), coupons, news, hero banners, store settings and maintenance mode.
- Orders: status workflow (pending → processing → shipped → delivered, or cancelled with stock, coupon and wallet returned), assign a delivery rider.
- Users: create accounts, change roles (customer, admin, delivery rider), delete.
- **Messages**: contact-form inbox; reply by email from the panel.

### Delivery rider (`/delivery`)
- Assigned orders with customer address, phone and map link; mark as delivered (cash orders become paid).

### Security
Rate-limited login and sign-up, hashed single-use codes, database-checked roles on every protected API, validated inputs, server-side pricing, verified payments, SSRF-safe image downloads and strict security headers.

- **Access control:** every API route calls one guard from `src/lib/authGuard.ts` (`requireRole("admin")`, `requireRoleForWrite("admin")`, `requireRole("delivery", "admin")` or `requireUser()`), which reads the role from the database; public routes are read-only or rate-limited. The route-by-route table is in [AGENTS.md](AGENTS.md#access-control-by-route), and `tests/route-access.test.ts` fails if any route loses its guard.
- **Payments:** SSLCommerz sends success, fail, cancel and IPN to one route, `src/app/api/payments/ssl-status/route.ts`. It confirms `val_id` with the SSLCommerz validation API, then requires the validated `tran_id`, amount (±0.01) and currency (BDT) to match the stored order before marking it paid; fail/cancel need an HMAC-signed link. Flow: [AGENTS.md](AGENTS.md#payments-sslcommerz-callback-and-ipn).
- **Database:** Mongoose only (no SQL, no `$where`); ids are checked with `isObjectId()`, text with `requiredString()`, search with `escapeRegex()`; customers see only `{ user: auth.user.id }`, riders only `{ assignedTo: auth.user.id }`. Collections, constraints and indexes: [AGENTS.md](AGENTS.md#data-model-and-indexes).

Full details: [docs/SECURITY.md](docs/SECURITY.md).

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | MongoDB with Mongoose 9 |
| Authentication | NextAuth.js 4 (email + password, optional Google) |
| Payments | SSLCommerz (optional), cash on delivery, wallet |
| AI | Google Gemini (optional) |
| Email | Nodemailer (Gmail or any SMTP account via app password) |
| UI | Tailwind CSS 4, Framer Motion, Lucide icons, Leaflet maps, Recharts |

## 🔎 Quality checks (version 1.2.2, run 2026-11-10)

| Check | Result |
|---|---|
| `npm audit --omit=dev` (everything that ships) | **found 0 vulnerabilities** |
| `npm test` | **36/36 pass**: checkout totals, coupon rules, role checks, route access, order status, demo privacy |
| `npm run test:demo -- https://next-grocery-nine.vercel.app` | **19/19 pass** on the live demo |
| `npm run typecheck`, `npm run build` | pass |

- **Dependencies:** every version in `package.json` is exact and `package-lock.json` pins the tree (`npm ci`). `next` 16.4.5, `react` 19.2.4, `mongoose` 9.11.4, `next-auth` 4.24.15. NextAuth 4 is the current stable release on npm; Auth.js v5 is still in beta, so the project stays on 4.x and takes security fixes within 4.x. Server-side sign-in is configured in one file (`src/lib/auth.ts`) and API role checks go through `src/lib/authGuard.ts`; pages use NextAuth's standard `useSession` / `signIn` hooks, which keeps a later move manageable. One `overrides` entry: `next-auth` uses the app's `nodemailer` 10.3.1 instead of the 7.x it asks for. The full `npm audit` also lists one moderate advisory in `minimatch` inside the lint tooling (`typescript-eslint`), which never ships.
- **Node.js:** 22 LTS, version 22.18 or later, everywhere: `.nvmrc` (`22`), `engines` (`^22.18.0`) and the Docker image (`node:22-alpine`).
- **Release history** ([CHANGELOG.md](CHANGELOG.md), back to the first release): 1.0.0 (2026-11-04) first release · 1.1.0 (2026-11-08) live demo mode and `/showcase` · 1.2.0 (2026-11-10) fast paginated admin products and a header cart · 1.2.1 (2026-11-10) route access matrix and tests · 1.2.2 (2026-11-10) review evidence in README and AGENTS.md.

## 🚀 Getting Started

Requirements: Node.js 22 LTS, version 22.18 or later (the same in `.nvmrc`, `package.json` `engines` and the Docker image), and a MongoDB database (MongoDB Atlas free tier works). The full clean-machine walkthrough is in [HowToSetup.md](HowToSetup.md). It covers installing Node.js and npm, MongoDB Atlas or a local MongoDB, `.env.local`, creating the database (indexes first, then sample data and demo accounts), the first admin login (`npm run promote-admin`), a VPS with Node.js, pm2 and an HTTPS proxy, a VPS with Docker Compose (optional bundled MongoDB), and branding: store name, logo, icons and the Tailwind colour tokens in `src/app/globals.css`.

```bash
npm ci                         # install pinned dependencies
cp .env.example .env.local     # then set MONGODB_URI, NEXTAUTH_URL, NEXT_PUBLIC_BASE_URL, NEXTAUTH_SECRET
npm run db:setup               # indexes + sample catalogue + demo admin/customer/rider (prints passwords)
npm run dev                    # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run db:indexes` | Create collections and indexes on an empty (or existing) database |
| `npm run db:seed [-- --demo-users]` | Sample data; `--demo-users` creates/resets the demo accounts |
| `npm run promote-admin -- you@example.com` | Make a registered account an admin |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` / `npm run lint` / `npm run audit:prod` | Checks |
| `npm test` | Unit tests: checkout totals, coupon rules, role checks, the route-by-route access matrix, order status rules and demo privacy |
| `npm run test:demo -- <url>` | API smoke test of the live-demo flow and role checks against a running server |

Every environment variable is explained in [`.env.example`](.env.example). Required: `MONGODB_URI`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXTAUTH_SECRET`, plus `EMAIL_USER` / `EMAIL_PASS` in production. Optional: SSLCommerz, Gemini, Google sign-in, Barikoi, map tiles.

## 🌍 Deployment

Deploy to **Vercel**, a **VPS with Node.js**, or a **VPS with Docker** (Dockerfile and `docker-compose.yml` with optional MongoDB included). Step-by-step instructions, reverse-proxy config and a post-deploy checklist are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📡 API

Every endpoint, its access rule, request body and the SSLCommerz payment flow are documented in [docs/api.md](docs/api.md). Codebase guide for developers and AI agents: [AGENTS.md](AGENTS.md). Release notes: [CHANGELOG.md](CHANGELOG.md). Licence for buyers: [LICENSE-NOTE.md](LICENSE-NOTE.md).

## 🤖 AI search and recipes

- **Smart search** (`/api/ai/smart-search`): Gemini picks products from the real catalog (English, Banglish or Bangla, e.g. "alu peyaj dim"). If AI is unavailable it falls back to keyword matching with Bangla synonyms; it never shows random products.
- **Recipes** (`/api/ai/recipes`): up to 3 recipes from the cart, with steps and "Add" buttons for missing ingredients we sell. Without AI it suggests matching classic Bangladeshi recipes.
- Both are rate limited, validate input, time out after ~12–15 s, and never log the API key. After Google rejects the key (401/403), AI calls pause for 5 minutes.

## 📍 Delivery location

The location picker uses OpenStreetMap tiles and Nominatim search by default (no key needed, limited to Bangladesh). Set `BARIKOI_API_KEY` to use Barikoi instead. For heavy production traffic, use a commercial tile provider via `NEXT_PUBLIC_MAP_TILE_URL` (OpenStreetMap's servers are for light use).

## 🔑 Password reset

1. On the login page, **Forgot password?** opens `/forgot-password`.
2. The user enters their email; if a verified account exists, a 6-digit code is emailed. The reply is the same either way, so the form can't be used to discover accounts.
3. The user enters the code and a new password, then returns to login.

Safeguards:
- Codes expire after 10 minutes, are stored only as a keyed hash, and work once.
- Limits per account: 1 code a minute; 5 codes and 10 wrong guesses an hour.
- Changing the password signs out every other session within a minute.

---

*FreshBasket v1.2.2*
