# Copilot Instructions

## Build & Run Commands

```bash
npm run dev              # Vite dev server (frontend only) → http://localhost:5173
npx vercel dev           # Full local dev (frontend + serverless API) → http://localhost:3000
npm run build            # Production build → /dist
npm run preview          # Preview production build
npm run generate-hash -- "password"   # Generate bcrypt hash for ADMIN_PASSWORD_HASH
npm run build-db         # Scrape Jaquar catalog → public/jaquar-products.json
```

There are no tests or linters configured in this project.

## Architecture

React 18 + Vite frontend with Vercel Serverless Functions backend. Supabase (PostgreSQL) for persistent storage. Prints product labels on A4 sticker sheets — **multi-page support** with 12 labels per page (2×6 grid, each 105×48mm).

### Frontend (`src/`)

- **`App.jsx`** — React Router v7 with two routes: `/` (Landing) and `/app` (Dashboard, protected). All route components are **code-split** via `React.lazy`.
- **`Dashboard.jsx`** — Main orchestrator. Holds all label state (multi-page `pages` array), passes it down via props. Split layout: 42% editor / 58% preview. Manages draft auto-save, print history, and CSV import.
- **`LabelEditor.jsx`** — Form for editing labels with Jaquar product search (client-side search against `/public/jaquar-products.json`, 150ms debounce)
- **`LabelPreview.jsx`** — A4 preview with print/PDF toolbar and calibration controls. PDF generation is inline here using **native jsPDF vector drawing** (not html2canvas).
- **`LabelSheet.jsx`** — Renders the 105×48mm label grid. `LabelCell` is wrapped in `React.memo` with a custom comparator to prevent unnecessary re-renders.
- **`TemplateManager.jsx`** — Modal for cloud template CRUD; falls back to localStorage if Supabase is unavailable
- **`ErrorBoundary.jsx`** — Class component wrapping the entire app. Has a Sentry integration point (`window.Sentry`).
- **`contexts/AuthContext.jsx`** — JWT auth state. Token stored in **`sessionStorage`** (not localStorage). Client-side JWT expiry check before network verification via `/api/auth/verify`.
- **`contexts/ThemeContext.jsx`** — Dark/light theme toggle. Persisted in `localStorage` as `ganpati_theme`, applied via `data-theme` attribute on `<html>`.
- **`services/api.js`** — Axios client with request interceptor that auto-attaches Bearer token from `sessionStorage`
- **`services/supabase.js`** — Singleton Supabase client for frontend (Realtime WebSocket). Returns `null` if env vars aren't set.

### Backend (`api/`)

Vercel Serverless Functions. Each file exports a default `(req, res)` handler.

- **`api/_lib/db.js`** — Shared Supabase client singleton (uses `SUPABASE_SERVICE_ROLE_KEY`). CRUD helpers with graceful "table missing" detection.
- **`api/auth/login.js`** — POST: validates against `ADMIN_EMAIL` + bcrypt-hashed password, returns JWT (7-day expiry)
- **`api/auth/verify.js`** — GET: validates Bearer token
- **`api/templates/index.js`** — GET (list) / POST (create) with JWT auth
- **`api/templates/[id].js`** — GET / PUT / DELETE by UUID
- **`api/jaquar-search.js`**, **`api/jaquar-product.js`**, **`api/jaquar-price.js`** — Product catalog proxy endpoints

Auth middleware is a `verifyToken(req)` helper inlined in each protected endpoint (not shared middleware).

### Data Flow

```
Dashboard (pages: array of label arrays, each page = 12 labels)
  → LabelEditor (edits labels via onChange callbacks)
  → LabelPreview → LabelSheet (renders A4 grid per page)
  → TemplateManager (saves/loads label_data to Supabase)
```

### PWA

Service worker (`public/sw.js`) and manifest (`public/manifest.json`) registered only in production (`import.meta.env.PROD`). Web Vitals reported via `web-vitals` package in production.

## Label Data Model

Each label has 7 fields. A page is always an array of 12. Multiple pages are stored as `pages: [[12 labels], [12 labels], ...]`.

```javascript
{
  product: '',       // Product name
  code: '',          // SKU/product code
  price: '',         // MRP in ₹
  manufacturer: '',  // Brand name
  logoUrl: '',       // Brand logo URL (defaults to /jaquar-logo.png)
  description: '',   // Product description
  productUrl: '',    // URL encoded into QR code
}
```

Stored in Supabase as `label_data JSONB` on the `templates` table.

## Key Conventions

### Error Handling Pattern

All API calls use this pattern consistently:

```javascript
try {
  await apiCall();
  toast.success('Done');
} catch (err) {
  if (err?.response?.data?.error) toast.error(err.response.data.error);
  else if (err?.code === 'ERR_NETWORK') toast.error('Network error');
  else toast.error('Failed. Try again.');
}
```

### CORS in Serverless Functions

Every API endpoint must set these headers before any logic:

```javascript
res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
res.setHeader('Access-Control-Allow-Methods', '...');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
if (req.method === 'OPTIONS') return res.status(200).end();
```

### Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no `tailwind.config.js` — uses CSS-first config in `src/index.css`)
- Dark theme with saffron accent (`#f97316`). Theme variables are CSS custom properties in `src/index.css`.
- Print CSS in `src/index.css` under `@media print` — uses React Portal (`.print-root` as direct child of `<body>`) to avoid CSS conflicts. Hides everything except `.print-root`.
- Label cell styling is **inline styles only** (not Tailwind) for accurate print/PDF rendering.

### Print & PDF

- **Browser print**: `window.print()` triggers `@media print` CSS. Content rendered via `createPortal` directly under `<body>`.
- **PDF export**: Native **jsPDF vector drawing** — text, lines, and images drawn directly via jsPDF API. No html2canvas. Produces small files (100–500 KB). `jsPDF` and `qrcode` are dynamically imported.
- QR codes generated via `qrcode` library and cached in an in-memory LRU map (max 50 entries) in `LabelSheet.jsx`.
- PDF renders all pages × copies with proper page breaks.

### State & Storage

- No Redux/Zustand — all state is `useState` lifted to `Dashboard.jsx`
- **Auth token**: `sessionStorage` (key: `token`)
- **Draft auto-save**: `localStorage` (key: `ganpati_draft`) every 30s
- **Print history**: `localStorage` (key: `ganpati_history`)
- **Theme preference**: `localStorage` (key: `ganpati_theme`)
- `TemplateManager` gracefully falls back to localStorage when Supabase is unavailable

### Environment Variables

Server-side (Vercel): `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
Client-side (Vite): `VITE_API_URL` (optional, defaults to relative URLs), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN` (optional)

## Database Setup

Run `scripts/setup-db.sql` in the Supabase SQL Editor. It creates the `templates` table with UUID primary key, JSONB `label_data`, and auto-updating timestamps. RLS is disabled — auth is handled at the API layer via JWT.
