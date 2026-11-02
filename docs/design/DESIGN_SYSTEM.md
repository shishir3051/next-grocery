# FreshBasket Design System (v1)

The rules every storefront, account and admin screen follows. Tokens live in
[`src/app/globals.css`](../../src/app/globals.css) (`@theme`), and shared primitives in
[`src/components/ui/`](../../src/components/ui/).

## Why
The audit (see [AUDIT_FINDINGS.md](../AUDIT_FINDINGS.md)) found the UI drifting apart screen by screen:

| Problem | Measured |
|---|---|
| Two brand colours: teal storefront, red `#CC0000` checkout | 43 hard-coded `#CC0000`, 7 `#A30000` |
| Everything shouts | 242 `font-black` vs 22 `font-semibold` |
| No radius scale | 11 radii, incl. `rounded-[2rem]`, `[2.5rem]`, `[3rem]` |
| Unreadable micro-text | 76 uses of 8–10 px text, incl. labels and errors |
| Low contrast | `text-slate-400` on white (≈2.6:1) used for real content |
| Dead config | `tailwind.config.ts` (Chaldal green / Shwapno red) is ignored by Tailwind v4 |

## 1. Colour: the "Fresh market" palette

| Token (Tailwind class) | Use | Value |
|---|---|---|
| `brand-50 … brand-900` (`bg-brand-600`, `text-brand-700`) | Primary actions, links, active states, prices | Deep teal (`brand-600` = `#0f766e`, 5.5:1 with white text) |
| `success-*` | Freshness, organic, confirmations, free-delivery progress | Leaf green (`success-600` = `#4d7c0f`): a clearly different hue from the brand |
| `accent-*` | Deals, offers, "save" badges, promotions | Tangerine (`accent-500` = `#f97316`) |
| `danger-*` | Errors, destructive actions | Red scale |
| `slate-*` | Text, borders and surfaces | **Sage-tinted neutrals** that override Tailwind slate (`slate-500` = `#5f7067`, 5.3:1 on white) |
| page canvas | `--background` | `#f1f5f1` so white cards stand out |
| category tints | Sidebar icon tiles, section heading markers | `src/lib/categoryColors.ts`: 8 soft aisle colours, picked from the category name |

Why it changed: v1 used the cold Tailwind slate greys and an emerald "success" almost identical to the teal brand, which read as one flat colour. v2 gives each role its own hue, warms the neutrals, and adds depth with a tinted canvas and layered shadows.

Rules
- **One primary colour.** Checkout, cart, auth and storefront all use `brand`. Red is never a brand colour, only `danger`.
- Text contrast on white must be ≥ 4.5:1: body `text-slate-700`, secondary `text-slate-600`, muted/meta `text-slate-500`.
  `text-slate-400` is only for placeholders, disabled states and decorative icons.
- No hard-coded hex colours in components; use tokens.
- Gradients only on the hero banner, the logo mark, the header signature stripe (brand → leaf → tangerine) and the primary button (a subtle vertical gradient).
- Legacy `teal-*` classes are mapped onto the brand scale, so there is only one teal.

## 2. Typography (Inter)

| Role | Classes |
|---|---|
| Page title (h1) | `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900` |
| Section title (h2) | `text-lg sm:text-xl font-semibold text-slate-900` |
| Card title | `text-sm font-semibold text-slate-800` |
| Body | `text-sm text-slate-700` (base `text-base` on content pages) |
| Meta / helper | `text-xs text-slate-500` |
| Overline (sparingly) | `text-xs font-semibold uppercase tracking-wide text-slate-500` |

Rules
- **Minimum size 12 px (`text-xs`)** for anything a user must read. `text-[8px]`–`text-[10px]` are removed (11 px allowed only for tiny count badges).
- `font-black` only for the logo wordmark and hero display headings. Use `font-semibold` and `font-bold` elsewhere.
- Avoid ALL-CAPS paragraphs and buttons; reserve uppercase for short overlines.

## 3. Shape, spacing, elevation

| Token | Class | Use |
|---|---|---|
| radius-sm | `rounded-lg` (8 px) | inputs, small badges, chips |
| radius-md | `rounded-xl` (12 px) | buttons, product cards, list rows |
| radius-lg | `rounded-2xl` (16 px) | panels, modals, drawers, section cards |
| pill | `rounded-full` | avatars, count badges, toggle pills |

- No `rounded-[2rem]`/`[2.5rem]`/`[3rem]`/`rounded-3xl`.
- Shadows: `shadow-sm` (resting cards), `shadow-md` (hover / popovers), `shadow-xl` (modals, drawers). They are redefined in `globals.css` as soft, layered shadows tinted with the neutral hue. No coloured glow shadows (`shadow-teal-600/20` etc.); the primary button is the only element with a brand-tinted shadow.
- Page container: `mx-auto max-w-6xl px-4 sm:px-6`; vertical rhythm `py-8 sm:py-12`; card padding `p-4 sm:p-6`.

## 4. Components (`src/components/ui/`)

- **`Button`**: variants `primary | secondary | ghost | danger`, sizes `sm | md | lg`, `fullWidth`, `loading`. Also works as a link (`href`).
- **`cn()`** (`src/lib/cn.ts`): merges classes (`clsx` + `tailwind-merge`).
- Inputs: `rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`. Every input has a `<label htmlFor>`.

## 5. Accessibility rules
- Every icon-only button has `aria-label`.
- Visible keyboard focus everywhere (global `:focus-visible` ring in globals.css). Never `outline-none` without a replacement.
- Interactive targets ≥ 40×40 px on touch screens.
- Honour `prefers-reduced-motion` (global rule disables non-essential animation).

## 6. Layout
- **One global header** (`Navbar`) on every storefront/content/account page, not just the home page. Searching from any page goes to `/?q=…`.
- Checkout, auth, admin and delivery keep their focused layouts.
- The cart drawer sits above the header, and its width is `min(100vw, 400px)`.
