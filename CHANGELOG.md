# Changelog

All notable changes to FreshBasket. Versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Changed
- Admin > Products loads 10 products per page, with paging and search done on the server, and
  no longer sends every product's base64 photo with the list (one page went from about 18.7 MB
  to about 4 KB in a 90-product test). Shows loading, updating and error states.
- Product photos are served from `/media/products/<id>/<version>` with a one-year cache.
  Store product lists and the admin dashboard no longer carry photo data.
- The header cart icon shows on every store page for every account, including admins, with
  the item count. The "Added to cart" toast stays for 5 seconds.

### Fixed
- Product photos that fail to load show a placeholder instead of a broken image.

### Upgrade note
- Run `npm run db:indexes` once to add the new `{ createdAt: -1, _id: -1 }` product index.

## [1.1.0] — 2026-11-08

### Added
- Live-demo mode (`DEMO_MODE=true`): `/showcase` product landing page, one-click Admin /
  Customer / Rider demo logins, read-only demo admin that can still run demo orders through
  the full flow, masking of real customers' data for demo accounts, and self-cleaning demo
  orders that never touch real stock, coupons or wallet credit.
- Sample demo customer messages in `database/seed.js`.
- Automated tests: `npm test` (unit tests for checkout totals, coupons, order status rules and
  demo privacy) and `npm run test:demo` (API smoke test of the demo flow and role checks).
- `.nvmrc` pins Node.js 22 LTS; setup guide has a quick checklist and a branding section.

### Changed
- Adding to the cart no longer opens the cart drawer: a short "Added to cart · View cart"
  confirmation appears instead, and the drawer opens from the cart icon.
- Admin panel uses a compact layout: less padding, denser tables and forms.

### Fixed
- The saved cart could be wiped on page load (the empty starting cart was saved before the
  saved one was loaded).
- Demo email addresses can no longer be registered, reset or used with Google sign-in.

### Security
- SSLCommerz fail/cancel callbacks are signed, so knowing an order's transaction id is no
  longer enough to cancel it.
- Live demo: transaction ids are hidden from the demo admin and rider, demo orders store a
  sample address instead of what visitors type, demo checkouts are rate-limited per visitor,
  the demo rider is the only possible assignee, payment status is read-only, and staff names in
  message replies are masked.
- Live demo: one-click demo sessions end as soon as `DEMO_MODE` is turned off, and online
  payment works only with the SSLCommerz sandbox.

## [1.0.0] — 2026-11-04

First release for sale.

### Storefront
- Product catalogue with categories and subcategories, search, wishlist and cart.
- Checkout with cash on delivery, wallet credit and SSLCommerz online payment (validated
  server-side), coupons with usage limits, configurable delivery fee and free-delivery threshold.
- AI smart search (English, Banglish, Bangla) and recipe suggestions from the cart (Google
  Gemini), with keyword and curated fallbacks when AI is not configured.
- Delivery-location picker with map (OpenStreetMap or Barikoi).
- Accounts: email sign-up with 6-digit verification code, password reset, optional Google
  sign-in, profile and address book, order history, referral wallet bonus.
- News pages, offers page, FAQ, policy pages and a contact form.

### Admin and delivery
- Admin dashboard with sales stats; management of products, categories, orders, users and
  roles, coupons, news, hero banners and store settings.
- Customer messages inbox: read, close, and reply by email from the admin panel.
- Order status rules (pending → processing → shipped → delivered, or cancelled) with stock,
  coupon and wallet returned on cancellation; rider assignment.
- Delivery rider view: assigned orders, navigation link, mark as delivered.

### Security
- Rate limiting shared across server instances (login, sign-up, codes, checkout, coupons,
  contact form, AI, geocoding); login lockout per account.
- Database-checked roles on every protected API; validated inputs; server-side pricing;
  SSRF-safe image downloads; CSP and security headers. See `docs/SECURITY.md`.

### Operations
- `HowToSetup.md`, `docs/DEPLOYMENT.md` (Vercel, Docker, VPS), `docs/api.md`.
- `database/indexes.js` and `database/seed.js` (sample catalogue and demo accounts).
- Dockerfile and docker-compose (app plus optional local MongoDB).
