# 🥑 FreshBasket – Modern Grocery Platform

FreshBasket is a premium, high-performance e-commerce solution built with **Next.js 16+** and **MongoDB**. It offers a seamless grocery shopping experience with instant data loading, AI integrations, and a robust administrative suite.

![Banner Placeholder](https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200)

## ⚡ Key Highlights

### 🛍 Storefront Experience
- **Instant Data Loading**: Powered by Server-Side Pre-fetching, providing a zero-loading first render experience.
- **Smart Grouping**: Category navigation that automatically organizes products into sub-sections (e.g., Dairy & Eggs showing Milk, Eggs, etc.).
- **AI Tools**: Integrated **Smart Search** and **Recipe Suggestions** based on currently available ingredients.
- **Geolocation & Autofill**: Real-time delivery location detection with automatic address completion during checkout.
- **Micro-Interactions**: Smooth card transitions, glassmorphism badges, and hover-triggered quick-add controls.

### 🔐 Admin Dashboard
- **Product Management**: Comprehensive controls for inventory with automated image processing (Base64 optimization).
- **Category Architect**: Full CRUD for hierarchical categories (Parent/Sub) with dynamic icon assignment.
- **Analytics & Stats**: Real-time dashboard with sales overview and order velocity tracking.
- **Coupon System**: Advanced promotion engine supporting percentage, fixed amounts, and minimum order requirements.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router + Server Components)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js (credentials, email verification, password reset)
- **Payments**: Cash on delivery, wallet credit, SSLCommerz
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI search**: understands English, Banglish and Bangla queries

## 🚀 Getting Started

Requirements: Node.js 20.9 or newer, a MongoDB database (MongoDB Atlas free tier works).
The full clean-machine walkthrough (including a local MongoDB option) is in [HowToSetup.md](HowToSetup.md).

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env.local
   ```
   Then fill in the values. [`.env.example`](.env.example) explains each one:
   - **Required:** `MONGODB_URI`, `NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXTAUTH_SECRET`, and `EMAIL_USER` / `EMAIL_PASS` in production (in development the codes are printed to the server console).
   - **Optional:** `SSLCOMMERZ_*` + `IS_LIVE` (online payments), `GEMINI_API_KEY` (AI search and recipes; without it, keyword search and curated recipes are used), `BARIKOI_API_KEY` (address search; OpenStreetMap otherwise), `NEXT_PUBLIC_MAP_TILE_URL` (map tiles).

3. **Create the first admin**:
   Register and verify an account in the app, then run:
   ```bash
   npm run promote-admin -- you@example.com
   ```
   Sign out and back in to refresh your session.

4. **Seeding (Optional, development only)**:
   When the catalog is empty, admins see a **Seed Database** button on the home page. It wipes and repopulates categories, products and hero slides, so the API refuses it in production.

5. **Run Dev**:
   ```bash
   npm run dev
   ```

## 🌍 Deployment

Deploy to **Vercel** or with **Docker on a VPS** (Dockerfile and `docker-compose.yml` included). Step-by-step instructions, reverse-proxy config and a post-deploy checklist are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🛡 Security

Rate-limited login and sign-up, hashed single-use codes, database-checked roles on every protected API, validated inputs, server-side pricing, verified payments, SSRF-safe image downloads and strict security headers. Details: [docs/SECURITY.md](docs/SECURITY.md). Codebase guide for developers and AI agents: [AGENTS.md](AGENTS.md).

## 📡 Core API Routes

- `/api/products`: Public storefront listing and searching.
- `/api/admin/products`: Secure product inventory management.
- `/api/admin/categories`: Hierarchical category controller.
- `/api/orders`: Secure checkout and fulfillment processing.
- `/api/auth/forgot-password` → `/api/auth/reset-password`: "Forgot password?" flow (page: `/forgot-password`).

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

*Designed with ❤️ for premium grocery delivery.*
