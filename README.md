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
- **Authentication**: NextAuth.js
- **Styling**: Vanilla CSS + Tailwind-utility principles
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Internationalization**: Full English/Bengali localization

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file with:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `OPENAI_API_KEY` (Optional for AI features)

3. **Seeding (Optional)**:
   The storefront includes a **Seed Database** button to instantly populate the platform with 100+ professional grocery items and categories.

4. **Run Dev**:
   ```bash
   npm run dev
   ```

## 📡 Core API Routes

- `/api/products`: Public storefront listing and searching.
- `/api/admin/products`: Secure product inventory management.
- `/api/admin/categories`: Hierarchical category controller.
- `/api/orders`: Secure checkout and fulfillment processing.

---

*Designed with ❤️ for premium grocery delivery.*
