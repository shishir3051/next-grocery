# FreshBasket: Architecture & Code Audit, Improvement Plan

_Audit date: 2026-11-02. Scope: all of `src/` (about 13k lines), config, tooling and docs._
_Method: six parallel auditors (security, payments, data/perf, frontend, integrations, quality). An adversarial verifier re-checked every finding against the code, and a completeness critic looked for gaps. The P0 items were re-checked by hand._
_Full evidence for all 138 raw findings: [AUDIT_FINDINGS.md](AUDIT_FINDINGS.md)._

---

## 1. Executive summary

The project has a solid base: TypeScript strict mode passes, totals are recomputed on the server from DB prices, order reads are scoped to their owner, bcrypt runs at cost 12, the JWT is kept small, and Leaflet and Recharts are lazy-loaded. But **it is not safe to take real money or real customers yet.** Five verified, easy-to-exploit problems let an attacker become admin, mark orders as paid, create wallet money, or wipe the catalog.

Beyond those, three structural decisions drive most of the remaining issues:

1. **No server-side boundary layer.** There is no `proxy.ts` (middleware), no shared auth guard, no input validation (no zod), and no service layer. Every route handler does its own auth, parsing, pricing and DB writes, so the same logic has been copied 25+ times and the copies have drifted apart.
2. **Images stored as base64 inside MongoDB documents.** They end up in the SSR payload, every catalog API response, localStorage, and every order line item.
3. **Almost every page is `"use client"`** (29 of 31). That costs SEO and metadata, adds a loading spinner to every page, and pushes data fetching into `useEffect`.

| Area | Grade | Headline |
|---|---|---|
| Security | 🔴 F | Self-promotion to admin, forgeable payments, unauthenticated DB-wipe endpoints |
| Payments / order integrity | 🔴 F | Negative quantities create money, displayed price ≠ charged price, oversell races |
| Data & performance | 🟠 D | Base64 images everywhere, homepage frozen at build time, unbounded queries |
| Architecture | 🟠 D | No validation, auth or service layer; logic in route handlers; client-only pages |
| Frontend / UX / a11y | 🟡 C | Attractive UI, but no shared nav, no error boundaries, weak a11y, no SEO |
| Code quality / tooling | 🟡 C | `tsc` passes, but ESLint has 304 problems, there are 0 tests, no CI, and the README is inaccurate |

---

## 2. P0: Fix before any real user or payment (≈1–2 days)

These are all **confirmed in the code** and can be exploited with a plain `curl`.

| # | Problem | Where | Fix |
|---|---|---|---|
| 1 | **Any logged-in user becomes admin** with `GET /api/admin/setup`. It only checks that a session exists. | [setup/route.ts:18](../src/app/api/admin/setup/route.ts#L18) | Delete the route. Bootstrap the first admin with a CLI script (`scripts/promote-admin.ts` using `promoteUserToAdmin`). |
| 2 | **Payment forgery.** `POST /api/payments/ssl-status?status=success&orderId=X` with `status=VALID` in the body marks any order paid. `val_id` is never validated, and `tran_id` and amount are never compared. | [ssl-status/route.ts:19](../src/app/api/payments/ssl-status/route.ts#L19) | Call the SSLCommerz validation API with `val_id` from the server. Require `tran_id === order.paymentProviderId` and a matching amount and currency. Update atomically: `findOneAndUpdate({_id, paymentStatus:'unpaid'})`. Handle the IPN on the same code path. |
| 3 | **Negative quantities.** `quantity: -100` passes the stock check, makes the total negative, **credits the wallet** (`walletBalance -= negative`) and inflates stock. | [orders/route.ts:43-101](../src/app/api/orders/route.ts#L43) (and `ssl-init`) | Validate the body with zod (`quantity` int 1–50, valid ObjectId, ≤50 items). Reject orders with total ≤ 0. Add `min: 1` / `min: 0` in the schema. |
| 4 | **Price shown ≠ price charged.** ProductCard and ChatWidget treat `discountPrice` as an *amount off* (`price - discountPrice`). The server and admin treat it as the *sale price*. With price 120 and discountPrice 100, the card shows ৳20 and checkout charges ৳100. | [ProductCard.tsx:38](../src/components/product/ProductCard.tsx#L38), [ChatWidget.tsx:82](../src/components/ui/ChatWidget.tsx#L82) vs [orders/route.ts:50](../src/app/api/orders/route.ts#L50) | Add one `getEffectivePrice(product)` in `src/lib/pricing.ts` and use it everywhere. |
| 5 | **Unauthenticated destructive endpoints.** `POST /api/seed` wipes products, categories and hero slides. `GET /api/news/seed` and `GET /api/admin/restore-news` wipe news. The storefront even shows a public **"Seed Database" button**. | [api/seed](../src/app/api/seed/route.ts#L4), [news/seed](../src/app/api/news/seed/route.ts#L6), [restore-news](../src/app/api/admin/restore-news/route.ts#L36), [HomeClient.tsx:257](../src/components/layout/HomeClient.tsx#L257) | Move seeding to `scripts/seed.ts` (run with `npx tsx`). Delete the routes and the button. |
| 6 | **OTP brute force and pre-verification takeover.** There is no attempt limit, the OTP uses `Math.random`, it is stored in plaintext, and `email` is not type-checked (operator injection). Re-registering an unverified email **overwrites its password** and re-sends mail with no limit. | [verify-otp/route.ts:18-34](../src/app/api/auth/verify-otp/route.ts#L34), [register/route.ts:23-53](../src/app/api/auth/register/route.ts#L34) | Use `crypto.randomInt` and store a hash of the OTP. Clear it after 5 failed attempts. Add a resend cooldown, never overwrite the password before verification, and validate the email with zod. Set `mongoose.set('sanitizeFilter', true)`. |
| 7 | **Admin UI open to any logged-in user** (it checks the session only, not the role, and there is no proxy). The APIs mostly re-check, but several trust the stale JWT role. | [admin/layout.tsx:65](../src/app/admin/layout.tsx#L65) | Add `src/proxy.ts` with `getToken()` and a role check for `/admin/*`, `/delivery/*`, `/checkout`, `/orders` and `/profile`. Also add a `requireAdmin()` server helper (see §4). |
| 8 | **Stored XSS sink.** News content is rendered with `dangerouslySetInnerHTML`. | [news/[id]/page.tsx:127](../src/app/news/%5Bid%5D/page.tsx#L127) | The content is plain text, so render `{content}` with `whitespace-pre-line`. |

### P0 status (2026-11-02): implemented, not yet committed

| # | What changed |
|---|---|
| 1 | `/api/admin/setup` deleted, along with `lib/promoteAdmin.ts`. The first admin is created with `npm run promote-admin -- <email>` (`scripts/promote-admin.mjs`). |
| 2 | `ssl-status` validates `val_id` with the SSLCommerz validation API, finds the order by the confirmed `tran_id`, checks the amount and currency, and moves the order to paid atomically (pending orders only). It handles the IPN, cancels the order on fail/cancel, and never reopens a cancelled order. `tran_id` is now a random UUID. |
| 3 | New `src/lib/orders.ts`: one validator and one pricing quote shared by COD and SSL. Quantities must be integers from 1 to 100, duplicate lines are merged, and line items are rebuilt from the DB. Stock, coupon and wallet are reserved atomically and rolled back if a later step fails. Schema adds `min` checks and a `walletAmount` field, and `zipCode` is now optional. |
| 4 | `src/lib/pricing.ts` `getEffectivePrice()` is used by ProductCard, ChatWidget and the server. `/api/coupons/validate` shares `computeCouponDiscount()` with the order routes. The wallet is offered only for COD. |
| 5 | `/api/news/seed` and `/api/admin/restore-news` deleted. `/api/seed` is admin-only (role checked in the DB) and returns 404 in production. The Seed button shows only for admins in dev. Sample news is inserted only into an empty collection. |
| 6 | OTP uses `crypto.randomInt`, stored as an HMAC (keyed with `NEXTAUTH_SECRET` and bound to the email). Attempts are counted atomically (max 5), the resend cooldown is atomic, and verification also requires the account password. Inputs are type-checked against operator injection, and the password needs at least 8 characters. Mock email is dev-only. |
| 7 | Added `src/proxy.ts` (role-gates `/admin` and `/delivery`), a role check in the admin layout, and `lib/authGuard.ts` `requireAdmin()` (DB role) for the hero and news admin APIs, which used to trust the JWT. |
| 8 | News content renders as text (`whitespace-pre-line`); `dangerouslySetInnerHTML` removed. |

**Known follow-ups** (left open, folded into P1):
- No IP-based rate limiter yet. A resend still resets the per-code attempt counter.
- SSL orders reserve stock only after payment, so an oversell is logged rather than prevented. `risk_level` from SSLCommerz is ignored.
- A coupon reserved for an SSL checkout the customer abandons (no callback) is not released.
- The cart doesn't enforce the 100-per-item cap.
- The other ~20 admin routes still copy their own role check instead of using `requireAdmin()`.

---

## 3. P1: Correctness & data integrity (≈1 week)

**Order pipeline** ([orders/route.ts](../src/app/api/orders/route.ts), [ssl-init/route.ts](../src/app/api/payments/ssl-init/route.ts))
- **Oversell race:** the stock check and `$inc` run as separate steps. Use `findOneAndUpdate({_id, stock: {$gte: qty}}, {$inc: {stock: -qty}})` and treat a null result as out of stock.
- **No transaction:** the wallet, coupon and stock writes all happen *before* `Order.create`. A validation failure, such as the required `zipCode` that the UI treats as optional, leaves money and stock already changed. Wrap all of it in `session.withTransaction()` (Atlas supports this).
- **Wallet:** the read-modify-write races; the wallet is ignored in the SSL flow even though the UI shows it applied; the wallet amount is never stored on the order; and orders fully paid by wallet are **rejected** (`!totalAmount` is true when the total is 0).
- **Coupons:** `usageLimit`, `startDate` and per-user limits are not enforced at order time. The SSL flow never increments usage. Fixed discounts can exceed the subtotal. Consume coupons with one conditional atomic update.
- **Client-supplied line items** (name, price, imageData) are stored as-is. Build order items on the server from the Product document.
- **Fees:** `settings.deliveryFee || 50` ignores an admin value of 0. Use `??` and a shared pricing function.
- **Product create:** `stock || 100` turns stock 0 into 100.

**Order state machine**
- Admin PATCH accepts any status or paymentStatus (`runValidators` is off), and cancelling does not restock or refund. Delivery riders can set `paymentStatus`, and marking an order "delivered" marks *online* orders as paid. Fix: one `ORDER_TRANSITIONS` map in `src/lib/orders/stateMachine.ts`, used by the admin and delivery routes, with side effects (restock, refund, coupon decrement) in a transaction.
- Failed or cancelled SSL payments leave orphaned `pending` orders that **count as revenue** in stats. Cancel them by `tran_id`, and count only paid or non-cancelled COD orders in stats.

**Other integrity bugs**
- Unpublished news is still served publicly by id ([news/[id]/route.ts:14](../src/app/api/news/%5Bid%5D/route.ts#L14)).
- Maintenance mode also blocks `/login`, so an admin who is signed out cannot get back in to turn it off ([MaintenanceGuard.tsx:34](../src/components/layout/MaintenanceGuard.tsx#L34)).
- Slugify strips Bangla text, which produces empty slugs and unique-index collisions (6 duplicated copies of slugify).
- A deleted user's JWT stays valid, and new orders can still be created for that user.
- LocationModal can save "Locating..." or "Address Not Found" as the address, and checkout autofills it.
- The checkout coupon discount goes stale when quantities change.
- Login ignores `callbackUrl`.

---

## 4. Target architecture (the structural fix)

Most issues come from route handlers doing everything themselves. Introduce **four thin layers**. No new framework is needed, just a few folders:

```
src/
  proxy.ts                    ← Next 16 middleware: route protection (role-gated), maintenance rewrite
  lib/
    env.ts                    ← zod-validated process.env, fail fast at boot
    http/
      guards.ts               ← requireUser(), requireRole('admin'|'delivery'), one source of truth (DB role, lean + projection)
      handler.ts              ← withHandler(): try/catch → typed JSON errors, no raw error.message leaks, logging
      rateLimit.ts            ← one limiter (Upstash/Mongo TTL) for login, register, OTP, AI, geocode
    validation/               ← zod schemas per resource (order, product, coupon, auth, news…)
    services/                 ← business logic, framework-free and unit-testable
      pricing.ts              ← getEffectivePrice, computeTotals(subtotal, fee, coupon, wallet)  (shared by COD + SSL + UI)
      orders.ts               ← placeOrder() in a transaction; state machine; cancel/restock/refund
      payments/sslcommerz.ts  ← init, validate(val_id), handleIPN, all idempotent
      coupons.ts              ← validate + atomic consume
    data/                     ← cached read functions (unstable_cache + tags) used by server pages
  app/
    (shop)/layout.tsx         ← Navbar + CartDrawer once, for all storefront pages
    (shop)/products/[slug]/   ← new product detail pages (SEO)
    admin/layout.tsx          ← server component: getServerSession + redirect
```

The rules that come with it:
- **Route handlers stay thin:** parse with zod, call the guard, call the service, return. Business logic never lives in `route.ts`. (This also matches the AGENTS.md rule "keep business logic separate from routes".)
- **One pricing function**, shared by the client display, COD orders and SSL. The COD and SSL routes have already diverged on wallet, coupon and stock handling.
- **Server components by default.** Interactive pieces go into small client children. Read-mostly data (catalog, categories, hero, news, settings) goes through cached `lib/data` functions with `revalidateTag()` in the admin write routes.
- **Typed models:** `InferSchemaType<typeof ProductSchema>` plus `Model<T>`. Use the existing `next-auth.d.ts` augmentation and drop the `(session.user as any)` casts (119 uses of `any`).

---

## 5. P2: Performance & data layer

| Issue | Fix |
|---|---|
| **Base64 images in Mongo** go into the homepage RSC payload, every `/api/products` response, cart and wishlist localStorage (quota errors), and every order item ([Product.ts:21](../src/models/Product.ts#L21), [CartContext.tsx:74](../src/context/CartContext.tsx#L74)) | Move images to object storage (Cloudinary, R2, S3 or Vercel Blob) and store only URLs. **Interim:** set `imageData: { select: false }` and add `GET /api/products/[id]/image` with immutable cache headers. Store only `{id, qty}` in the cart. |
| **Homepage frozen at build:** `page.tsx` has no `revalidate`, so prices and stock never refresh in production | Add `export const revalidate = 60` plus `revalidateTag('products')` in the admin writes. |
| **MaintenanceGuard** wraps the whole app, so the SSR HTML is replaced by a spinner (losing SEO and LCP) and every tab polls the DB every 10 s | Decide maintenance mode on the server (proxy or root layout, cached flag). Remove the polling. |
| Unbounded admin lists (orders, users, products) are paginated on the client | Paginate on the server (`limit`/`skip` or cursor), project only list fields, use `.lean()`. |
| `getCategories` runs 1+N queries on every request | One `find()` plus grouping in memory, cached. |
| Every admin request loads the full User document (including the base64 avatar) for a role check | `requireRole()` with `.select('role').lean()`. |
| Regex search is unescaped (ReDoS) and the new `text` index is unused | Escape the input, or switch to `$text`/Atlas Search with `.limit()`. |
| Every ProductCard re-renders on any cart change, and context values are not memoized | `useMemo` the context values, split cart state from actions, `React.memo(ProductCard)`. |
| No timeouts on external calls (Gemini, Barikoi, SMTP) | `AbortSignal.timeout(…)`. Send email after the response or through a queue. |

**About your uncommitted index change** ([Order.ts](../src/models/Order.ts), [Product.ts](../src/models/Product.ts)): `{category:1}` and `{createdAt:-1}` are good, keep them. Change `{user:1}` to `{user:1, createdAt:-1}` to match the order-history sort. The `text` index is unused today: either switch search to `$text`, or drop it so it doesn't slow down writes. Also add `{assignedTo:1, status:1}` for delivery queries and `{parentId:1}` on categories.

---

## 6. P3: Frontend, UX, accessibility, SEO

- **Shared layout:** the Navbar only renders inside `HomeClient`, so other pages have no header or cart. Create a `(shop)` route group layout. Drive search and category from the URL (`?q=`, `/category/[slug]`).
- **Server pages and metadata:** convert about, privacy, terms, faq, shipping-policy and news to server components with `metadata` / `generateMetadata`. Add `sitemap.ts`, `robots.ts`, `metadataBase`, OpenGraph, and product pages with JSON-LD.
- **Error UX:** add `not-found.tsx`, `error.tsx`, `global-error.tsx` and `loading.tsx` skeletons. Replace the copied fetch, spinner and silent-catch code with one `useApi()` SWR hook and a `fetchJson()` that throws on `!res.ok`.
- **Split big components:** checkout (618 lines) becomes `useCheckoutTotals`, `useCoupon`, AddressForm, PaymentPicker and OrderSummary. Admin CRUD pages (344–488 lines each) share a `DataTable`, `FormModal` and `useCrudResource` hook.
- **Accessibility:** add one `Dialog`/`Drawer` primitive built on native `<dialog>` (focus trap, Esc, scroll lock) to replace about 11 hand-built overlays. Icon buttons need `aria-label`. Labels need `htmlFor`. `text-slate-400` on white (~2.6:1 contrast, 261 uses) fails WCAG AA. Avoid 8–10 px text. The hero carousel needs pause and labelled controls.
- **Hero themes:** admins type Tailwind class strings that Tailwind v4 never generates. Replace them with a fixed theme enum.
- **Cart drawer** sits under the navbar (`z-40` vs `z-50`), and its fixed 380 px width overflows small phones.
- **Unfinished features:** the contact form submits nowhere, the share and app-store buttons do nothing, `FloatingAI` is never mounted, and `ChatWidget` promises a human agent that doesn't exist. Implement or remove each one.
- **Missing core flows:** password reset, customer order cancellation, and a message after a failed payment (checkout ignores `?status=fail`).

---

## 7. P4: AI & integrations

- **Gemini endpoints** are public, unthrottled and accept unbounded input, so anyone can drain the quota. Add the rate limiter, input caps (zod), `maxOutputTokens`, response caching for recipes, and zod validation of the model's JSON output.
- The `@google/generative-ai` SDK is deprecated. Move to `@google/genai` and keep the model id in one config place (it is currently hardcoded twice).
- Some logs print **part of the API key**, raw model output, and OTP codes. Remove them.
- `/api/geocode` is an open proxy to the paid Barikoi API with parameter injection. Validate lat/lng, encode with `URLSearchParams`, cache, and rate limit. **Rename `NEXT_PUBLIC_BARIKOI_API_KEY`**: the `NEXT_PUBLIC_` prefix exposes it to the client bundle as soon as any client file references it.
- Two geocoders are used inconsistently, and BigDataCloud is called directly from the browser. Pick one and call it through the server.
- Email: if `EMAIL_*` is missing, the app silently switches to "mock" mode and reports success. Allow that only in dev. Reuse one transporter and add a plain-text part.

---

## 8. P5: Quality, tooling, docs

- **ESLint: 304 problems (166 errors)**, mostly `any`, unused imports and `setState` in effects. `tsc --noEmit` passes ✅.
- **No tests, no CI.** Add Vitest for `services/` first: pricing, coupons, order totals and the state machine are pure and worth testing. Add one Playwright happy path (browse, add to cart, checkout COD). Add a GitHub Actions workflow running `lint`, `tsc` and `test`.
- `package.json` scripts: add `typecheck`, `test`, `format`. Remove the unused dependencies: `stripe`, `@stripe/*`, `clsx`, `tailwind-merge`, `next-themes` (or actually use them). Move `@types/leaflet` to devDependencies.
- Add a **`.env.example`**: it is referenced but missing. List all ~13 vars and validate them in `lib/env.ts`.
- **README is wrong in several places:** it says `OPENAI_API_KEY` (the code uses Gemini), "Vanilla CSS" (the code uses Tailwind v4), and "English/Bengali localization" (none exists). It documents 4 of the 34 routes and says nothing about SSLCommerz or admin bootstrap.
- Delete the dead `tailwind.config.ts`: Tailwind v4 ignores it. Move tokens into `@theme` in `globals.css`.
- **`gsap-skills`** is an orphaned gitlink with no `.gitmodules`. Remove it (`git rm --cached gsap-skills`) or register it properly.
- `next.config.ts`: add security headers (CSP, `frame-ancestors`, HSTS, `nosniff`). Reconsider hotlinking images from competitor CDNs (chaldal.com, shwapno.com).
- No observability: errors are swallowed and returned as empty arrays. Add structured logging, Sentry (or similar), and a `/api/health` route.

---

## 9. Roadmap

| Phase | Goal | Contents | Est. |
|---|---|---|---|
| **0: Stop the bleeding** | Safe to expose | P0 items 1–8 | 1–2 days |
| **1: Foundations** | Make it hard to reintroduce bugs | `env.ts`, zod, `guards.ts`, `withHandler`, `proxy.ts`, rate limiter, `.env.example`, CI with lint + tsc | 2–3 days |
| **2: Money correctness** | Orders and payments you can trust | `services/pricing`, `orders` (transaction, atomic stock/wallet/coupon), SSLCommerz validate + IPN, state machine, unit tests | 3–5 days |
| **3: Performance** | Fast, fresh catalog | Image storage migration, `revalidate` + tags, server-side maintenance, pagination, memoized contexts | 3–4 days |
| **4: Frontend structure** | Maintainable UI, SEO | `(shop)` layout, server pages + metadata, product pages, sitemap, Dialog primitive, split checkout and admin CRUD | 1–2 weeks |
| **5: Polish** | Production-grade | a11y contrast pass, error/loading files, password reset, order cancel, observability, README/docs, remove dead code and dependencies | ongoing |

---

## 10. What's already good (keep it)

- Totals are recomputed on the server from DB prices. The client `totalAmount` is not trusted.
- `GET /api/orders` and the delivery routes are correctly scoped to the caller (no IDOR).
- The profile update allowlists its fields (no mass assignment to `role` or `walletBalance`).
- bcrypt cost 12, `isVerified` checked at login, passwords excluded from responses.
- The JWT and session deliberately exclude base64 avatars.
- The Mongo connection is cached correctly for HMR and serverless.
- Leaflet uses `next/dynamic({ssr:false})`, and Recharts is admin-only.
- The homepage fetches products and categories in parallel on the server. HomeClient debounces search and handles races correctly.
- Category delete refuses to orphan subcategories or products. Admins cannot demote or delete themselves.
- TypeScript strict mode is on and passes.
