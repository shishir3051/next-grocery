# How to set up FreshBasket

Everything needed to go from this ZIP to a running store on a clean machine: install, configure,
create the database, log in as admin, and run it on a VPS with or without Docker.
Cloud hosting on Vercel is covered in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**This guide covers:** Node.js 22.18+ and npm (§1) · MongoDB Atlas or a local MongoDB (§1) ·
`.env.local` settings (§3) · creating the database: indexes first, then sample data and demo
accounts (§4) · first admin login (§4) · running locally (§5) · a VPS with Node.js, pm2 and a
Caddy/nginx HTTPS proxy (§6A) · a VPS with Docker Compose and an optional bundled MongoDB (§6B) ·
checks after deploying (§7) · branding: store name, logo, icons and Tailwind colour tokens (§8) ·
optional features and troubleshooting.

| You want | Follow |
|---|---|
| Try it on your computer | 1 → 2 → 3 → 4 → 5 |
| Run it on a VPS with Node.js | 1 → 2 → 3 → 4 → 6A |
| Run it on a VPS with Docker | 6B (needs only Docker) |

**Quick checklist** (each step is explained below):

1. Node.js 22 LTS, version 22.18 or newer, then `npm ci` (exact versions from `package-lock.json`).
2. `cp .env.example .env.local` and set `MONGODB_URI`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_SECRET`.
3. Database, in this order: `npm run db:indexes`, then `npm run db:seed -- --demo-users` (`npm run db:setup` does both).
4. First admin: register in the app, then `npm run promote-admin -- you@example.com` (or log in as the demo admin).
5. `npm run build`, then `npm start` (or `npm run dev` while developing).
6. Brand it: store name and delivery fees in *Admin → Settings*; logo, colours and texts in section 8.

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 22 LTS, 22.18 or newer. The same version everywhere: `.nvmrc` (22), `engines` in `package.json` (>=22.18.0) and the Docker image (`node:22-alpine`). Newer majors such as 24 also work | `node -v` |
| npm | 10 or newer (comes with Node) | `npm -v` |
| MongoDB | MongoDB Atlas (free tier) **or** MongoDB 6+ on your machine/server | — |

No other service is required. Email, online payments, AI, Google sign-in and Barikoi maps are
optional (see *Optional features*).

**MongoDB option A: Atlas (nothing to install).** Create a free cluster at
https://www.mongodb.com/atlas, add a database user, allow your IP under *Network Access*, and copy
the connection string (*Connect → Drivers*). Add a database name before the `?`, e.g.
`...mongodb.net/freshbasket?retryWrites=true&w=majority`.

**MongoDB option B: local, with Docker.**
```bash
docker run -d --name freshbasket-mongo -p 127.0.0.1:27017:27017 -v freshbasket-mongo:/data/db mongo:7
```
Connection string: `mongodb://localhost:27017/freshbasket`

## 2. Install

```bash
cd freshbasket          # the unzipped project folder
npm ci                  # installs the exact versions pinned in package-lock.json
```

## 3. Configure

```bash
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
```

Edit `.env.local` and set at least:

```ini
MONGODB_URI=<connection string from step 1>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=<random secret>
```

Generate the secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

For local testing leave `EMAIL_USER` / `EMAIL_PASS` empty: verification codes are printed in the
terminal running the app. Every other variable is explained in `.env.example`.

## 4. Create the database (indexes, sample data, demo accounts)

On an empty database, run once:

```bash
npm run db:setup
```

This runs two scripts (each can also be run on its own):

| Command | What it does |
|---|---|
| `npm run db:indexes` | `database/indexes.js`: creates all collections and indexes (unique emails, slugs and coupon codes, query indexes, auto-expiring rate-limit records). Safe to re-run. |
| `npm run db:seed -- --demo-users` | `database/seed.js`: sample categories, 30 products, 2 hero banners, coupons `WELCOME10` and `FRESH50`, store settings, and three demo accounts. Never deletes data; re-running only resets the demo passwords. |

The seed prints the demo logins **once**:

| Role | Email | Opens |
|---|---|---|
| Admin | `admin@demo.freshbasket.app` | `/admin` |
| Customer | `customer@demo.freshbasket.app` | the store |
| Delivery rider | `rider@demo.freshbasket.app` | `/delivery` |

Passwords are random unless you set `DEMO_ADMIN_PASSWORD`, `DEMO_CUSTOMER_PASSWORD` and
`DEMO_RIDER_PASSWORD` before running the seed. **Change or delete the demo admin before going
live** (Admin → Users).

## 5. Run on your computer

```bash
npm run dev
```

Open http://localhost:3000.

**First admin login**
- With demo data: log in at http://localhost:3000/login as `admin@demo.freshbasket.app` with the
  password from step 4, then open http://localhost:3000/admin.
- With your own account instead: click **Register**, enter the 6-digit code from the terminal,
  then make it an admin and sign out and back in:
  ```bash
  npm run promote-admin -- you@example.com
  ```

## 6A. Production on a VPS with Node.js

On an Ubuntu server (any Linux works) with Node.js 22.18+ installed:

```bash
git clone <your repository> freshbasket    # or upload and unzip the project
cd freshbasket
npm ci
cp .env.example .env.local                 # set the real values (see below)
npm run db:setup                           # once, on a new database
npm run build
npm install -g pm2
pm2 start npm --name freshbasket -- start  # serves on port 3000
pm2 save && pm2 startup                    # restart automatically after a reboot
```

Production values in `.env.local`: `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` set to your
`https://` domain, a new `NEXTAUTH_SECRET`, and `EMAIL_USER` / `EMAIL_PASS` (sign-up emails
are required in production).

Then put HTTPS in front of port 3000. With Caddy, `/etc/caddy/Caddyfile`:
```
shop.example.com {
    reverse_proxy 127.0.0.1:3000 {
        header_up X-Real-IP {remote_host}
    }
}
```
Keep the `header_up` line: it overwrites any `X-Real-IP` header a visitor sends with their real
address. Without it, anyone could dodge the per-IP rate limits with a made-up header.
For nginx and the security notes, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Never expose
port 3000 directly.

Update later: `git pull && npm ci && npm run build && pm2 restart freshbasket`.

## 6B. Production on a VPS with Docker

Requirements: Docker with the Compose plugin. Node.js is not needed on the server.
The `Dockerfile` builds with `NEXT_OUTPUT=standalone`, which switches `next.config.ts` to Next.js's
self-contained server output; the plain `npm run build` in sections 5 and 6A doesn't use it.

```bash
cd freshbasket
cp .env.example .env.production            # set the real values, as in 6A
```

**With MongoDB Atlas** (`MONGODB_URI` points to Atlas):
```bash
NEXT_PUBLIC_BASE_URL=https://shop.example.com docker compose up -d --build
```

**With the bundled MongoDB container**: set `MONGODB_URI=mongodb://mongo:27017/freshbasket` in
`.env.production`, then:
```bash
NEXT_PUBLIC_BASE_URL=https://shop.example.com docker compose --profile local-db up -d --build
```

**Create the database once** (both cases):
```bash
docker compose run --rm app node database/indexes.js
docker compose run --rm app node database/seed.js --demo-users
```

The app listens on `127.0.0.1:3000`, runs as a non-root user and has a health check
(`docker compose ps` shows `healthy`). Add the same Caddy/nginx HTTPS proxy as in 6A.
First admin login: as in step 5, with the demo admin or `promote-admin`. For an account you
registered yourself, run `promote-admin` from any machine with Node.js and `MONGODB_URI` set to
the server's database.

Update later: `git pull && docker compose up -d --build`.

## 7. Verify

```bash
npm run typecheck     # TypeScript: no errors
npm run audit:prod    # production dependencies: 0 vulnerabilities
```

In the browser: log in as the demo customer → add a product to the cart → checkout with
*Cash on Delivery* → the order appears under *My Orders*. Log in as the demo admin → *Admin →
Orders* → assign the order to the demo rider → log in as the rider → *Mark delivered*.

## 8. Branding: make it your store

| What | Where |
|---|---|
| Store name, support email, delivery fee, free-delivery minimum, maintenance mode | *Admin → Settings* (no code change) |
| Home page banners and offers | *Admin → Hero Banners* and *Admin → Coupons* |
| Logo and name in the header and footer | `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx` |
| Browser tab icon and app icon | `src/app/icon.svg`, `src/app/apple-icon.png` |
| Colours | the `brand-*` and `accent-*` tokens in the `@theme` block of `src/app/globals.css` |
| Page title and description (SEO) | `metadata` in `src/app/layout.tsx` |

## Public live demo (optional)

To run a public demo of your store (like the one used to sell it), set `DEMO_MODE=true` on that
deployment and create the demo accounts once (`npm run db:seed -- --demo-users`). This turns on:

- `/showcase`: a product landing page with screenshots and "Live demo" buttons
  (`DEMO_BUY_URL` sets its "Buy" link).
- One-click **Admin / Customer / Rider** demo logins on `/login` (no passwords).
- A **read-only demo admin**: it can open every page, but only demo orders can be changed
  (status and assignment to the demo rider), so the full order → delivery flow can be tried.
- **Privacy:** demo accounts see real customers' names, emails, phones, addresses and messages
  masked. Demo accounts can't edit their profile, reset passwords or sign in with Google.
- **Self-cleaning demo orders:** they never reserve real stock, coupon uses or wallet credit;
  unattended ones are cancelled after 30 minutes and all are deleted after 3 days.

Online payment in the demo works only with the SSLCommerz sandbox (`IS_LIVE=false`). With
`IS_LIVE=true`, demo customers can only pay cash on delivery.

Never set `DEMO_MODE` on your real store, and delete the demo accounts there (Admin → Users).

**Turning the demo off:** one-click demo sessions end automatically once the app runs without
`DEMO_MODE=true`. The demo accounts stay in the database, though, and without `DEMO_MODE` they
are ordinary accounts (the demo admin is a full admin). So delete them when you turn the demo
off, for example in `mongosh` connected to the store's database:

```js
db.users.deleteMany({ email: /@demo\.freshbasket\.app$/ })
db.orders.deleteMany({ isDemo: true })   // optional: the leftover demo orders
```

Deleting the accounts also signs out, within a minute, anyone still signed in to them.

## Optional features

| Feature | Variables | Without them |
|---|---|---|
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (redirect URI `<site>/api/auth/callback/google`) | Email and password only |
| Contact-form alerts to another inbox | `CONTACT_EMAIL_TO` | Alerts go to `EMAIL_USER`; all messages are in Admin → Messages |
| Online payments (SSLCommerz) | `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `IS_LIVE` | Cash on delivery and wallet only |
| AI search and recipes (Google Gemini) | `GEMINI_API_KEY` | Keyword search, curated recipes |
| Bangladeshi address search (Barikoi) | `BARIKOI_API_KEY` | OpenStreetMap Nominatim |
| Map tiles | `NEXT_PUBLIC_MAP_TILE_URL` | OpenStreetMap tiles |

## Troubleshooting

- **`MongoServerSelectionError`**: your IP isn't allowed in Atlas *Network Access*, or the
  connection string is wrong.
- **`bad auth : authentication failed`**: wrong database username or password in `MONGODB_URI`.
- **Login says "Invalid email or password" right after sign-up**: enter the verification code first.
- **"Too many login attempts"**: wait 15 minutes, or use *Forgot password?*.
- **Admin menu missing after `promote-admin`**: sign out and back in.
- **Forgot the demo passwords**: run `npm run db:seed -- --demo-users` again to reset them.
- **Upgrading an older database**: run `npm run normalize-emails` once (see docs/DEPLOYMENT.md).
