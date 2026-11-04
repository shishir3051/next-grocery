# How to set up FreshBasket

Step-by-step setup on a clean machine: install, configure, build and start. About 15 minutes.
For production hosting (Vercel or Docker on a VPS) see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20.9 or newer (22 LTS recommended) | `node -v` |
| npm | 10 or newer (comes with Node) | `npm -v` |
| MongoDB | Atlas (free tier) **or** local MongoDB 6+ | — |

No other services are required. Email, online payments, AI and Barikoi maps are optional.

**Database, option A: MongoDB Atlas (no install).** Create a free cluster at
https://www.mongodb.com/atlas, add a database user, allow your IP under *Network Access*, and copy
the connection string (*Connect → Drivers*).

**Database, option B: local MongoDB with Docker.**
```bash
docker run -d --name freshbasket-mongo -p 27017:27017 mongo:7
```
Connection string: `mongodb://localhost:27017/freshbasket`

## 2. Install

```bash
cd freshbasket          # the unzipped project folder
npm ci                  # installs the exact versions from package-lock.json
```

## 3. Configure

```bash
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
```

Edit `.env.local` and set at least:

```ini
MONGODB_URI=<your connection string from step 1>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=<random secret>
```

Generate the secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Leave `EMAIL_USER` / `EMAIL_PASS` empty for local testing: verification codes are then printed in
the terminal that runs the app. Every other variable is optional and explained in `.env.example`.

## 4. Run in development

```bash
npm run dev
```

Open http://localhost:3000.

## 5. Create your admin account and demo data

1. Click **Register**, sign up, and enter the 6-digit code printed in the `npm run dev` terminal
   (or emailed, if email is configured).
2. In a second terminal, make that account an admin:
   ```bash
   npm run promote-admin -- you@example.com
   ```
3. Sign out and sign in again, then open http://localhost:3000/admin.
4. Optional demo catalog: while the catalog is empty, the home page shows admins a
   **Seed Database** button (development only). It creates categories, sample products, hero
   banners and news. You can also add products by hand under *Admin → Products*.

## 6. Build and start for production

```bash
npm run build
npm start               # http://localhost:3000
```

Before deploying, set `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your real `https://` domain
and configure email (`EMAIL_USER` / `EMAIL_PASS`); production refuses to run sign-up without it.

**With Docker instead:**
```bash
cp .env.example .env.production   # fill in values
docker compose up -d --build      # http://127.0.0.1:3000
```

## 7. Verify

```bash
npm run typecheck     # TypeScript: no errors
npm run audit:prod    # production dependencies: 0 vulnerabilities
```

Then in the browser: register → verify → add a product to the cart → checkout with
*Cash on Delivery* → the order appears under *My Orders* and in *Admin → Orders*.

## Optional features

| Feature | Variables | Without them |
|---|---|---|
| Online payments (SSLCommerz) | `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `IS_LIVE` | Cash on delivery and wallet only |
| AI search and recipes (Google Gemini) | `GEMINI_API_KEY` | Keyword search, curated recipes |
| Bangladeshi address search (Barikoi) | `BARIKOI_API_KEY` | OpenStreetMap Nominatim |
| Map tiles | `NEXT_PUBLIC_MAP_TILE_URL` | OpenStreetMap tiles |

## Troubleshooting

- **`MongoServerSelectionError`**: your IP isn't allowed in Atlas *Network Access*, or the
  connection string is wrong.
- **Login says "Invalid email or password" right after sign-up**: enter the verification code first.
- **"Too many login attempts"**: wait 15 minutes, or use *Forgot password?*.
- **Admin menu missing after `promote-admin`**: sign out and back in.
- **Upgrading an older database**: run `npm run normalize-emails` once (see docs/DEPLOYMENT.md).
