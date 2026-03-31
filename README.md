<div align="center">

# Shree Ganpati Agency -- Label Print System v3.1

**Precision A4 label printing with Jaquar product integration and vector PDF export**

[![Version](https://img.shields.io/badge/Version-3.1.0-f97316?style=flat-square)](https://github.com/NICK-FURY-6023/printer-image-generator/releases)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

> Print **12 labels per A4 sheet** (105x48mm each, 2x6 grid) with live preview, **instant Jaquar product search** (4,600+ products), **vector PDF export**, cloud templates, and CSV import. Built for Indian market workflows.

</div>

---

## Screenshots

Screenshots coming soon.

---

## What's New in v3.1.0

### Jaquar Product Integration
- **4,600+ products** preloaded in a local JSON database -- instant client-side search
- Search by **product code** or **product name** with real-time dropdown
- Auto-fills: code, name, description, and **exact MRP price** from jaquar.com
- QR codes auto-generated from Jaquar product URLs
- Product images fetched from jaquar.com via CORS image proxy

### Vector PDF Engine (Native jsPDF)
- **Completely rewritten** PDF generator -- no more html2canvas screenshots
- Text is **real vector text** -- never cuts, always sharp, fully selectable and searchable
- PDF file size: **100-500 KB** (was 30 MB with the old raster approach)
- Transparent brand logos preserved with PNG alpha channel
- Grid, borders, and text drawn directly via jsPDF native drawing API

### Reliable Ctrl+P Printing
- Uses **React Portal** (`createPortal`) to render print content directly under `<body>`
- Eliminates blank-page issues caused by CSS `:not()` selector conflicts
- Clean print CSS -- only 15 lines

### Performance Improvements
- **Code splitting** via `React.lazy` -- Dashboard (81KB), Landing (186KB), Login (6KB) loaded on demand
- **React.memo** on label cells -- only re-renders cells that actually changed
- Main bundle reduced from **500KB to 235KB** (53% smaller)
- Jaquar search: 150ms debounce, module-level cache, sorted by prefix match

### 3D Dynamic UI
- **3D depth panels** -- CSS perspective + translateZ for layered depth effect
- **Card hover lift** -- Cards lift up with enhanced shadow on hover
- **Active label glow** -- Animated pulsing ring on the selected label card
- **"Currently Editing" bar** -- Floating indicator showing active label name, code, and status
- **Enhanced dot navigator** -- Scale + glow animations on active/filled dots
- **Gradient backgrounds** -- Subtle depth gradients on all panels

### Multi-page Labels
- Add unlimited pages -- each page holds 12 labels (one A4 sheet)
- Page navigator bar with filled-count badges per page
- Add, remove, and duplicate pages
- PDF exports all pages x copies
- Ctrl+P prints all pages
- History and templates save/restore all pages

### Auto-generated Manufacturing Date
- `mfgDate` is automatically generated for every label (3-5 months before current date)
- Displayed in MM/YYYY format in the label footer

### History Auto-naming
- Auto-generated names from product codes and brands
- Format: `Jaquar ALD-CHR-079N +5 (2pg)`
- Easily identify entries without manual naming

---

## Architecture

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + Vite)"]
        LP[Landing Page]
        LG[Login]
        DB[Dashboard]
        LE[Label Editor]
        LS[Label Sheet]
        LV[Label Preview]
        TM[Template Manager]
    end

    subgraph Jaquar ["Jaquar Integration"]
        JDB[(jaquar-products.json<br/>4,600+ products)]
        JP[/api/jaquar-product]
        JI[/api/image-proxy]
    end

    subgraph Auth ["Auth Layer"]
        JWT[JWT Token]
        BC[Bcrypt Hash]
    end

    subgraph Backend ["Vercel Serverless API"]
        AL[POST /api/auth/login]
        AV[GET /api/auth/verify]
        TG[GET /api/templates]
        TP[POST /api/templates]
        TU[PUT /api/templates/:id]
        TD[DELETE /api/templates/:id]
    end

    subgraph Storage ["Supabase"]
        PG[(PostgreSQL)]
    end

    LP --> LG
    LG --> |email + password| AL
    AL --> |JWT| JWT
    JWT --> DB
    DB --> LE & LV
    LE --> |instant search| JDB
    LE --> |fetch details| JP
    LE --> |product images| JI
    LE --> LS
    LV --> LS
    DB --> TM
    TM --> TG & TP & TU & TD
    TG & TP & TU & TD --> PG

    AV --> |verify| JWT

    style Frontend fill:#1e293b,color:#f1f5f9,stroke:#f97316
    style Jaquar fill:#1e293b,color:#f1f5f9,stroke:#22c55e
    style Backend fill:#0f172a,color:#f1f5f9,stroke:#2563eb
    style Storage fill:#0f172a,color:#f1f5f9,stroke:#3FCF8E
    style Auth fill:#1e293b,color:#f1f5f9,stroke:#eab308
```

---

## User Flow

```mermaid
flowchart LR
    A([Visit App]) --> B{Logged in?}
    B -->|No| C[Login Page]
    C -->|email + pass| D[POST /api/auth/login]
    D -->|JWT Token| E[Dashboard]
    B -->|Yes| E
    E --> F[Edit 12 Labels]
    F --> S{Search Jaquar?}
    S -->|Yes| T[Instant Search<br/>4600+ products]
    T --> U[Auto-fill Code,<br/>Name, Price, URL]
    U --> F
    S -->|No| F
    F --> G{Action}
    G --> H[Print A4<br/>React Portal]
    G --> I[Vector PDF<br/>Native jsPDF]
    G --> J[Save Template]
    G --> K[Load Template]
    G --> L[Import CSV]
    G --> M[Export JSON]
    J --> N[(Supabase DB)]
    K --> N

    style A fill:#f97316,color:white
    style E fill:#1e293b,color:#f1f5f9,stroke:#f97316
    style T fill:#22c55e,color:white
    style N fill:#3FCF8E,color:white
```

---

## Label Layout

### A4 Sheet Grid

Each A4 sheet holds 12 labels in a 2-column x 6-row grid. Each label cell is approximately 105x48mm.

### Single Label Layout

```
+====+==========================================+
| M  | [LOGO]  [QR CODE]                        |
| O  |------------------------------------------|
| D  | Size | Qty | MRP (Per Piece)             |
| E  |------|-----|------------------           |
| L  | XX   | XX  | Rs.XXXX                     |
|    |      |     | (Incl. of All Taxes)        |
| C  |------------------------------------------|
| O  | PRODUCT NAME           | [Product        |
| D  | DESCRIPTION TEXT...    |  Image]         |
| E  |------------------------------------------|
|    | Jaquar & Co. Pvt. Ltd. | Made in India   |
|    | Mth/Yr: 10/2025  service@jaquar.com       |
|    |              Tel: 1800-102-9900           |
+====+==========================================+
```

The left sidebar displays the model code vertically. The main area contains:
- **Header row** -- Brand logo (left) and QR code (right)
- **Size/Qty/MRP table** -- Size, quantity, and MRP per piece with "(Incl. of All Taxes)" text
- **Product area** -- Product name and description on the left, product image from jaquar.com on the right
- **Footer (3 lines)** -- "Jaquar & Co. Pvt. Ltd." + "Made in India", manufacturing date + email, phone number

### Label Data Fields (11 fields)

| Field | Description | Jaquar Auto-fill |
|-------|-------------|:---:|
| `manufacturer` | Brand name (e.g., "Jaquar") | -- |
| `logoUrl` | Brand logo URL (PNG for transparency) | -- |
| `code` | Product code (e.g., "ALD-CHR-079N") | Yes |
| `product` | Product name | Yes |
| `description` | Product description | Yes (on-demand) |
| `price` | MRP price in Rs. | Yes |
| `productUrl` | Jaquar product page URL (used for QR code) | Yes |
| `productImage` | Product image URL from jaquar.com | Yes |
| `size` | Product size/dimensions | -- |
| `qty` | Quantity per unit | -- |
| `mfgDate` | Manufacturing date (MM/YYYY, auto-generated 3-5 months back) | Auto |

---

## Features

### Jaquar Product Search
- **4,600+ products** instantly searchable -- no API calls for search
- Type in **product code** or **name** -- results appear in real-time
- Auto-fills code, name, price, product URL, and product image
- Description fetched on-demand from Jaquar's website via serverless proxy
- Exact **MRP prices** scraped from jaquar.com (Indian pricing with tax)
- Search results sorted: exact code prefix matches shown first

### Printing and PDF
- **12 labels per A4 sheet** -- 2x6 grid, each 105x48mm
- **Pixel-perfect layout** -- 210x297mm with 7mm top/bottom, 3.5mm side margins
- **Native browser print** -- `Ctrl+P` via React Portal (no blank page issues)
- **Vector PDF export** -- Native jsPDF drawing API (not screenshots)
  - Real text (selectable, searchable, never cuts or breaks)
  - File size: 100-500 KB (vs 30 MB with old raster approach)
  - Transparent PNG logos preserved
  - Auto QR codes from product URLs
- **Multi-copy print** -- 1-10 copies with automatic page breaks
- **Print calibration** -- Top margin offset (+/-5mm) + font scale (60%-150%)

### Label Features
- **11 data fields** -- manufacturer, logoUrl, code, product, description, price, productUrl, productImage, size, qty, mfgDate
- **Auto QR codes** -- Generated from product URL or code
- **Product images** -- Fetched from jaquar.com via CORS image proxy
- **Brand logos** -- External URL with transparent PNG support
- **Size/Qty/MRP table** -- Structured pricing section with "(Incl. of All Taxes)" text
- **Auto mfgDate** -- Manufacturing date auto-generated 3-5 months before current date
- **3-line footer** -- Company name + Made in India, mfg date + email, phone number
- **Smart text wrapping** -- `splitTextToSize` in PDF, `-webkit-line-clamp` on screen
- **Conditional rendering** -- Empty fields hidden in preview (not shown as blanks)

### Data Management
- **CSV import** -- Upload or paste CSV text with preview; only `code` and `product` columns required (all others optional)
- **CSV export** -- Exports all 11 columns (manufacturer, logoUrl, code, product, description, price, productUrl, productImage, size, qty, mfgDate)
- **JSON export/import** -- Full backup and restore
- **Cloud templates** -- Save/load/delete via Supabase (localStorage fallback)
- **Copy to all 12** -- Duplicate single label across entire sheet
- **Bulk fill** -- Apply fields to all labels at once
- **Auto-save drafts** -- Every 1.2s to localStorage
- **Print history** -- Last 30 operations with one-click restore

### UI/UX
- **Dark theme** -- Slate-900 base with saffron gradient accent (#f97316 to #c2410c)
- **Glassmorphism** -- Frosted glass cards with backdrop blur
- **Smooth animations** -- Framer Motion 3D tilt on Landing, anime.js timelines
- **Toast notifications** -- react-hot-toast for all user actions
- **42/58% split layout** -- Editor left, Preview right
- **Dot navigator** -- 12 clickable dots showing filled status + product code tooltips
- **Filled labels summary** -- Quick overview of all filled labels with codes

### Security
- **JWT authentication** -- 7-day token expiry
- **Bcrypt password hashing** -- Salt rounds: 12
- **Protected API routes** -- All endpoints require Bearer token
- **Single admin access** -- Hardcoded admin-only system
- **Logo URL sanitization** -- Only http(s) or relative paths allowed

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 18.2 | Component-based UI |
| **Build Tool** | Vite | 6.0 | Fast HMR + production builds |
| **Styling** | Tailwind CSS | 4.0 | Utility-first CSS |
| **Routing** | React Router | 7.13 | Client-side navigation |
| **Animations** | Framer Motion + anime.js | 12.38 / 4.3.6 | Landing page animations |
| **HTTP Client** | Axios | 1.6 | API calls with interceptors |
| **PDF Generation** | jsPDF (native drawing) | 2.5.1 | Vector PDF export |
| **QR Codes** | qrcode | 1.5.4 | QR code generation per label |
| **Notifications** | react-hot-toast | 2.6.0 | Toast messages |
| **Backend** | Vercel Serverless | Node.js | API + Jaquar proxy |
| **Database** | Supabase (PostgreSQL) | 2.39.0 | Cloud template storage |
| **Auth** | jsonwebtoken + bcryptjs | 9.0 / 2.4 | JWT + password hashing |
| **Product DB** | Static JSON | -- | 4,600+ Jaquar products |

---

## Project Structure

```
printer-image-generator/
|-- index.html                    # HTML entry -- meta, OG tags
|-- package.json                  # v3.1.0 -- dependencies & scripts
|-- vite.config.js                # React + Tailwind plugins
|-- vercel.json                   # Headers, caching, SPA rewrites
|
|-- src/                          # Frontend source
|   |-- main.jsx                  # React root render
|   |-- App.jsx                   # React.lazy routes + Suspense + AuthProvider
|   |-- index.css                 # Tailwind + print CSS (portal-based)
|   |
|   |-- components/
|   |   |-- Landing.jsx           # Animated public homepage
|   |   |-- Login.jsx             # Auth form (email/password)
|   |   |-- Dashboard.jsx         # Main app -- 42% editor / 58% preview
|   |   |                         #   (includes inline CSV import modal
|   |   |                         #    and history modal)
|   |   |-- LabelEditor.jsx       # 12 label cards + Jaquar instant search
|   |   |-- LabelSheet.jsx        # A4 grid renderer (React.memo cells)
|   |   |-- LabelPreview.jsx      # Print preview + vector PDF + calibration
|   |   |-- TemplateManager.jsx   # Save/load/delete cloud templates
|   |   +-- ErrorBoundary.jsx     # React error boundary wrapper
|   |
|   |-- contexts/
|   |   +-- AuthContext.jsx       # JWT auth state (login/logout/verify)
|   |
|   |-- services/
|   |   |-- api.js                # Axios client + Bearer token interceptor
|   |   +-- supabase.js           # Supabase client initialization
|   |
|   +-- utils/
|       +-- mfgDate.js            # Auto-generate mfg date (3-5 months back)
|
|-- api/                          # Vercel Serverless Functions
|   |-- _lib/
|   |   +-- db.js                 # Shared Supabase client
|   |-- auth/
|   |   |-- login.js              # POST -- authenticate, return JWT
|   |   +-- verify.js             # GET -- validate JWT token
|   |-- templates/
|   |   |-- index.js              # GET (list) / POST (create)
|   |   +-- [id].js               # GET / PUT / DELETE by ID
|   |-- jaquar-search.js          # GET -- search Jaquar products
|   |-- jaquar-product.js         # GET -- fetch product details + description
|   |-- jaquar-price.js           # GET -- fetch exact MRP from jaquar.com
|   +-- image-proxy.js            # GET -- CORS proxy for jaquar.com images
|
|-- public/                       # Static assets
|   |-- favicon.svg               # Saffron gradient brand icon
|   |-- og-image.png              # Social preview (1200x630)
|   |-- og-image.svg              # OG image source
|   |-- icons.svg                 # SVG icon sprites
|   |-- manifest.json             # PWA manifest
|   |-- sw.js                     # Service worker
|   |-- jaquar-logo.png           # Default Jaquar brand logo
|   +-- jaquar-products.json      # Preloaded product DB (4,600+ items, ~1.2MB)
|
|-- scripts/
|   |-- build-jaquar-db.js        # Scrapes jaquar.com -> builds product JSON
|   |-- generate-hash.js          # CLI: bcrypt password hash generator
|   |-- generate-label-pdf.js     # CLI: generate label PDF from command line
|   |-- generate-og.js            # CLI: OG image generator
|   +-- setup-db.sql              # Supabase database setup SQL
|
+-- dist/                         # Production build output (code-split)
    |-- index.html
    +-- assets/
        |-- index-*.js            # Core bundle (235KB)
        |-- Dashboard-*.js        # Lazy: Dashboard (81KB)
        |-- Landing-*.js          # Lazy: Landing page (186KB)
        |-- Login-*.js            # Lazy: Login (6KB)
        +-- jspdf.es.min-*.js     # PDF library (358KB)
```

---

## API Reference

### Authentication

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Supabase

    Note over C,A: Authentication
    C->>A: POST /api/auth/login {email, password}
    A->>A: bcrypt.compare()
    A-->>C: {token, expiresIn: "7d"}

    C->>A: GET /api/auth/verify [Bearer token]
    A->>A: jwt.verify()
    A-->>C: {valid: true, user: {role}}
```

### Template CRUD

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant D as Supabase

    C->>A: GET /api/templates [Bearer]
    A->>D: SELECT * FROM templates
    D-->>A: [{id, name, label_data}]
    A-->>C: templates[]

    C->>A: POST /api/templates {name, label_data}
    A->>D: INSERT INTO templates
    A-->>C: 201 Created
```

### Jaquar Product Search

```mermaid
sequenceDiagram
    participant C as Client
    participant J as jaquar-products.json
    participant A as API
    participant W as jaquar.com

    Note over C,J: Instant Search (Client-Side)
    C->>J: Load on first mount (1.2MB)
    J-->>C: 4,600+ products cached
    C->>C: Local filter (150ms debounce)

    Note over C,W: On-Demand Details
    C->>A: GET /api/jaquar-product?url=...
    A->>W: Fetch product page (Indian IP headers)
    W-->>A: HTML with description + MRP
    A-->>C: {name, description, price}
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:---:|-------------|
| `POST` | `/api/auth/login` | No | Authenticate with email + password |
| `GET` | `/api/auth/verify` | Yes | Validate JWT token |
| `GET` | `/api/templates` | Yes | List all saved templates |
| `POST` | `/api/templates` | Yes | Create new template |
| `PUT` | `/api/templates/:id` | Yes | Update template |
| `DELETE` | `/api/templates/:id` | Yes | Delete template |
| `GET` | `/api/jaquar-search?q=...` | No | Search Jaquar products |
| `GET` | `/api/jaquar-product?url=...` | No | Fetch product details from jaquar.com |
| `GET` | `/api/jaquar-price?url=...` | No | Fetch exact MRP from jaquar.com |
| `GET` | `/api/image-proxy?url=...` | No | CORS proxy for jaquar.com images (see below) |

### Image Proxy (/api/image-proxy)

Proxies product images from jaquar.com to bypass browser CORS restrictions.

- **Method:** GET
- **Query parameter:** `url` -- full image URL from jaquar.com
- **Domain restriction:** Only allows URLs starting with `https://www.jaquar.com/`; all other domains return HTTP 403
- **Caching:** Responses cached for 7 days (`s-maxage=604800`) with stale-while-revalidate of 30 days
- **Returns:** Raw image binary with the original `Content-Type` header

Example:
```
GET /api/image-proxy?url=https://www.jaquar.com/images/thumbs/0012345_product.jpeg
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Supabase** account ([supabase.com](https://supabase.com))
- **Vercel** account ([vercel.com](https://vercel.com)) for deployment

### 1. Clone and Install

```bash
git clone https://github.com/NICK-FURY-6023/printer-image-generator.git
cd printer-image-generator
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Auth
JWT_SECRET=<generate-a-strong-random-string>
ADMIN_EMAIL=shreeganpatiagency.printer@admin
ADMIN_PASSWORD_HASH=<bcrypt-hash-of-your-password>

# Supabase Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Generate Password Hash

```bash
npm run generate-hash -- "YourSecurePassword123"
# Copy the output hash into ADMIN_PASSWORD_HASH in .env
```

### 4. Setup Supabase Database

Run the full SQL from `scripts/setup-db.sql` in **Supabase Dashboard -> SQL Editor**:

```sql
-- 1. Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates (created_at DESC);

-- 3. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Grant access to Supabase roles (required for REST API)
GRANT ALL ON templates TO anon;
GRANT ALL ON templates TO authenticated;
GRANT ALL ON templates TO service_role;

-- 5. Disable RLS (auth is handled at API layer via JWT)
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
```

See `scripts/setup-db.sql` for the complete, canonical version of this script.

### 5. Build Jaquar Product Database (Optional)

```bash
npm run build-db    # Scrapes jaquar.com -> public/jaquar-products.json
```

> A pre-built `jaquar-products.json` with 4,600+ products is already included.

### 6. Run Locally

```bash
npm run dev          # Vite dev server -> http://localhost:5173
npx vercel dev       # Full stack (frontend + API) -> http://localhost:3000
```

### 7. Deploy to Vercel

```bash
npx vercel --prod
```

Set environment variables in **Vercel Dashboard -> Settings -> Environment Variables**.

---

## Default Login

| Field | Value |
|-------|-------|
| **Email** | `shreeganpatiagency.printer@admin` |
| **Password** | `@Shree_Ganpati@123` |

> **Change these in production!** Regenerate hash with `npm run generate-hash`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + P` / `Cmd + P` | Print labels (browser dialog) |
| `Ctrl + S` / `Cmd + S` | Save current template |

---

## Database Schema

```mermaid
erDiagram
    TEMPLATES {
        uuid id PK "gen_random_uuid()"
        text name "NOT NULL"
        jsonb label_data "Array of 12 label objects"
        timestamptz created_at "DEFAULT NOW()"
        timestamptz updated_at "DEFAULT NOW()"
    }

    LABEL_OBJECT {
        string manufacturer "Brand name"
        string logoUrl "Brand logo URL (PNG)"
        string code "Product code"
        string product "Product name"
        string description "Product description"
        string price "MRP in Rs."
        string productUrl "Jaquar product page URL"
        string productImage "Product image URL"
        string size "Product size"
        string qty "Quantity per unit"
        string mfgDate "Mfg date MM/YYYY (auto-generated)"
    }

    TEMPLATES ||--o{ LABEL_OBJECT : "contains 12"
```

---

## Print Specifications

| Parameter | Value |
|-----------|-------|
| **Paper Size** | A4 (210mm x 297mm) |
| **Grid Layout** | 2 columns x 6 rows |
| **Labels per Sheet** | 12 |
| **Label Size** | ~101mm x ~46mm (cell area) |
| **Top/Bottom Padding** | 7mm |
| **Left/Right Padding** | 3.5mm |
| **Grid Gap** | 1mm |
| **Logo Area** | 18mm wide (left side) |
| **QR Code Area** | 13mm wide (right side) |
| **Supported Printers** | Any A4 printer (inkjet/laser) |
| **Recommended Stickers** | A4 sticker sheets (105x48mm pre-cut) |
| **Print Scale** | Always 100% (no browser scaling) |
| **PDF Type** | Vector (native jsPDF drawing) |
| **PDF Size** | 100-500 KB per page |

---

## Scripts

```bash
npm run dev              # Start Vite dev server
npm run build            # Production build -> /dist (code-split)
npm run preview          # Preview production build locally
npm run generate-hash    # Generate bcrypt password hash
npm run build-db         # Rebuild Jaquar product database from jaquar.com
npm run generate-label   # Generate label PDF from command line
```

---

## CSV Format

### CSV Import

Only `code` and `product` columns are required. All other columns are optional.

```csv
code,product,manufacturer,logoUrl,description,price,productUrl,productImage,size,qty,mfgDate
ALD-CHR-079N,Single Lever Diverter,Jaquar,,Concealed body for high flow diverter,4400,,,,,
F360002CP,Contessa Pillar Cock,Hindware,,Chrome pillar cock with aerator,1250,,,,,
```

- Maximum **12 rows** per page (extra rows ignored)
- `logoUrl` is optional -- leave blank for text-only brand display
- `mfgDate` auto-generates if left blank (3-5 months before current date)

### CSV Export

Exports all 11 columns: `manufacturer`, `logoUrl`, `code`, `product`, `description`, `price`, `productUrl`, `productImage`, `size`, `qty`, `mfgDate`.

---

## Security Notes

- `.env` file is in `.gitignore` -- **never commit credentials**
- JWT tokens expire after **7 days**
- All template API routes validate Bearer token
- Jaquar search/product/image-proxy APIs are public (read-only)
- Image proxy restricted to `jaquar.com` domain only
- Passwords stored as **bcrypt hashes** (salt rounds: 12)
- Logo URLs sanitized -- only `http(s)` or relative paths allowed
- Single admin account -- no multi-user support

---

## Performance

| Metric | Value |
|--------|-------|
| **Main bundle** | 235 KB (code-split from 500 KB) |
| **Dashboard chunk** | 81 KB (lazy loaded) |
| **Landing chunk** | 186 KB (lazy loaded) |
| **Login chunk** | 6 KB (lazy loaded) |
| **Jaquar DB** | 1.2 MB (loaded once, cached in memory) |
| **Search latency** | < 5ms (client-side, 150ms debounce) |
| **PDF generation** | ~1-3s for 12 labels |
| **QR code cache** | LRU, max 50 entries |

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

Private -- All rights reserved by **Shree Ganpati Agency**.

---

<div align="center">

**Built for Shree Ganpati Agency**

*Precision labels. Instant Jaquar search. Vector PDF. Every time.*

</div>
