# API reference

All endpoints are Next.js route handlers under `/api`. Requests and responses are JSON unless
noted. Errors are `{ "error": "message" }` with a 4xx/5xx status; messages are safe to show to
users and never include internal details. API responses send `Cache-Control: no-store`.

**Auth** column: *public*; *user* = any signed-in account; *admin* / *rider* = role checked in
the database on every request (`requireRole`). Signed-in requests use the NextAuth session
cookie set by `/api/auth/*`. **Limit** = rate limit (shared across server instances).

## Authentication

| Method & path | Auth | Body / query | Notes |
|---|---|---|---|
| `POST /api/auth/register` | public | `{ name, email, password, referralCode? }` | Creates an unverified account and emails a 6-digit code. Limit 10/h per IP. |
| `POST /api/auth/verify-otp` | public | `{ email, otp, password }` | Verifies the account; pays referral bonus once. 5 guesses per code; 30/h per IP, 15/h per account. |
| `POST /api/auth/forgot-password` | public | `{ email }` | Emails a reset code. Same reply whether or not the account exists. |
| `POST /api/auth/reset-password` | public | `{ email, otp, password }` | Sets a new password and signs out other sessions. |
| `POST /api/auth/callback/credentials` | public | form: `email, password, csrfToken` | NextAuth login. 30 attempts/15 min per IP; 10 wrong passwords/15 min per account. |
| `GET /api/auth/signin/google` → `/api/auth/callback/google` | public | — | Google sign-in (when `GOOGLE_CLIENT_ID/SECRET` are set). |
| `GET /api/auth/session`, `POST /api/auth/signout` | — | — | NextAuth session helpers. |

## Catalogue and content (public)

| Method & path | Query | Returns |
|---|---|---|
| `GET /api/products` | `category=<slug>` or `search=<text>` (max 64 chars, literal match) | `{ products }` |
| `GET /api/categories` | — | `{ categories }` with `subcategories` |
| `GET /api/public/hero` | — | `{ slides }` (active banners) |
| `GET /api/public/coupons` | — | `{ coupons }` (active, not expired, not used up) |
| `GET /api/news`, `GET /api/news/:id` | — | `{ articles }`, `{ article }` (drafts only for admins) |
| `GET /api/settings` | — | `{ settings }`: store name, support email, delivery fee, free-delivery threshold, maintenance mode |
| `GET /api/stats/public` | — | `{ customers, products, cities }` |
| `GET /api/geocode` | `type=search&q=` or `type=reverse&lat=&lng=` (Bangladesh only) | `{ results: [{ address, area, city, latitude, longitude }] }`. Limit 30/min. |
| `POST /api/ai/smart-search` | `{ query }` | `{ products, suggestion, mode: "ai" \| "keyword" }`. Limit 10/min. |
| `POST /api/ai/recipes` | `{ cartItems: string[] }` (product names in the cart) | Up to 3 recipes with missing ingredients we sell. Rate limited. |
| `POST /api/contact` | `{ name, email, phone?, subject, orderRef?, message, website }` | `201 { ok, reference }`. `website` is a honeypot and must be empty. Limit 5/h per IP, 3/h per email. |

## Customer (signed in)

| Method & path | Body | Notes |
|---|---|---|
| `GET /api/user/profile` | — | Own profile (no password or code hashes). |
| `PUT /api/user/profile` | `{ name?, phone?, address?: { street, city, zipCode }, image? }` | Image: PNG/JPEG/WebP/GIF/AVIF data URL ≤ 2 MB or https URL. |
| `POST /api/coupons/validate` | `{ code, subtotal }` | `{ isValid, discountAmount, message }`. Limit 20/10 min. |
| `POST /api/orders` | see *Order body* | Cash on delivery (wallet optional). `201 { success, orderId }`. Limit 10/10 min; max 5 unconfirmed COD orders. |
| `GET /api/orders` | — | Own orders, newest first (max 100). |
| `POST /api/payments/ssl-init` | see *Order body* | Creates a pending order and returns `{ url }` of the SSLCommerz payment page. |

**Order body**
```json
{
  "items": [{ "productId": "<24-hex id>", "quantity": 2 }],
  "shippingAddress": { "street": "House 1, Road 2", "city": "Dhaka", "zipCode": "1212", "phone": "01700000000" },
  "couponCode": "WELCOME10",
  "deliveryNote": "Call on arrival",
  "useWallet": false
}
```
The server ignores any prices sent by the browser: names, prices, discount, delivery fee and
total are rebuilt from the database. 1–50 lines, quantity 1–100 per product. Stock, coupon use
and wallet are reserved atomically and rolled back if a later step fails.

## SSLCommerz payment flow

1. `POST /api/payments/ssl-init` → order saved as `pending` / `unpaid` with a random
   `tran_id`; the coupon is reserved. The browser is sent to SSLCommerz.
2. SSLCommerz posts the customer back to `POST /api/payments/ssl-status?status=success|fail|cancel`
   and also sends the server-to-server IPN to `?status=ipn`.
3. On `success` / `ipn`, the server calls the SSLCommerz **validation API** with `val_id`. The
   order is marked `paid` / `processing` only if the payment is `VALID`/`VALIDATED` **and** the
   `tran_id`, amount and currency (BDT) match the order. The update is atomic, so the redirect and
   the IPN can't both apply it; stock is reserved at this point.
4. On `fail` / `cancel`, the pending order is cancelled and its coupon released, but only when the
   callback carries the `sig` that `ssl-init` added to those URLs (an HMAC of the `tran_id`), so a
   transaction id alone can't cancel anyone's order.
5. The customer lands on `/orders?session=success` or back on `/checkout?status=fail|cancel`.

Nothing in the callback request itself is trusted. Set `IS_LIVE=true` for the live gateway.

## Delivery rider

| Method & path | Auth | Body | Notes |
|---|---|---|---|
| `GET /api/delivery/orders` | rider, admin | — | Own assigned orders that are not delivered/cancelled. |
| `PATCH /api/delivery/orders` | rider, admin | `{ orderId, status: "delivered" }` | Only own `shipped` orders. COD becomes paid on delivery. |

## Admin

All require **admin**. Bodies accept only the listed fields; anything else is ignored.

| Method & path | Body / query | Notes |
|---|---|---|
| `GET /api/admin/stats` | — | Dashboard metrics and 7-day sales. |
| `GET/POST/PUT/DELETE /api/admin/products` | `name, price, discountPrice, unit, category, description, stock, isOrganic, isHalal, imageData, imageUrl, image`; `PUT` adds `id`; `DELETE ?id=` | `discountPrice` is the sale price (0 = none). `imageUrl` is downloaded server-side (https, public hosts, ≤ 2 MB). |
| `GET/POST/PUT/DELETE /api/admin/categories` | `name, parentId?, icon?`; `PUT` adds `id`; `DELETE ?id=` | Max 3 levels; can't delete a category with subcategories or products. |
| `GET/POST/PUT/DELETE /api/admin/coupons` | `code, discountType (percentage\|fixed), discountValue, minOrderAmount, maxDiscount, startDate, expiryDate, isActive, usageLimit` | Percentage ≤ 100. |
| `GET/POST/PUT/DELETE /api/admin/hero` | `title, highlight, subtitle, ctaLabel, ctaLink, image, gradient, accentColor, decorColor, emoji, tag, tagColor, isActive, order` | `ctaLink`: category slug, coupon code or https URL. |
| `GET /api/admin/orders` | — | All orders with customer. |
| `PATCH /api/admin/orders` | `{ orderId, status }` or `{ orderId, assignedTo }` or `{ orderId, paymentStatus: "paid" }` | Status rules: pending → processing → shipped → delivered; cancelled from any non-final state (returns stock, coupon, wallet). Assigning a rider sets `shipped`. Online orders must be paid before fulfilment. |
| `GET/POST/PUT/DELETE /api/admin/users` | `POST { name, email, password, role }`, `PUT { id, role }`, `DELETE ?id=` | Roles: user, admin, delivery. Can't demote or delete yourself. |
| `GET/POST /api/admin/settings` | `storeName, supportEmail, supportPhone, deliveryFee, minFreeDelivery, maintenanceMode` | |
| `POST /api/news/admin`, `PATCH/DELETE /api/news/admin/:id` | `title, content, excerpt, category, readTime, image, imageData, isPublished` | Content is stored and shown as plain text. |
| `GET /api/admin/messages` | `?status=new\|read\|replied\|closed&page=` | Contact inbox with counts per status. |
| `PATCH /api/admin/messages/:id` | `{ status }` or `{ reply }` | `reply` is emailed to the customer and recorded; status becomes `replied`. |
| `DELETE /api/admin/messages/:id` | — | |
| `POST /api/seed` | — | Development only (404 in production). Prefer `npm run db:seed`. |
