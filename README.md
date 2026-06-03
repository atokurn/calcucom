# CekBiayaJualan (Calcucom)

CekBiayaJualan is a local-first, SKU-based seller workspace and financial intelligence platform designed for e-commerce merchants selling on major Indonesian and Southeast Asian marketplaces (such as Shopee, Tokopedia, and TikTok Shop).

It enables sellers to manage their operational ledgers, calculate production cost/COGS (Harga Pokok Penjualan - HPP), forecast profitability, compute marketplace commission/admin fees, import raw marketplace Excel reports, and sync their workspace data to Google Sheets via Cloudflare Pages and Google OAuth.

---

## 🚀 Key Features

- **Centralized Product & SKU Workspace**: Reusable products mapped to materials and compositions.
- **HPP & Recipe Manager**: Calculates product cost from raw materials, waste factors, and overheads.
- **Marketplace Calculator Suite**: Computes admin fees, cashbacks, shipping discounts, optimal selling prices, and ROI/ROAS for ads.
- **Excel Settlement Ingest**: Imports order and income settlement sheets, matches SKUs, and tracks financial performance.
- **Financial Dashboard**: Displays real-time estimated vs. imported actual profit, revenue margins, and marketplace fee metrics.
- **Local-First & Offline Support**: Stores data in `localStorage` with a service worker PWA wrapper for offline accessibility.
- **Google Sheets Sync**: Integrates with Google OAuth 2.0 to securely push and pull workspace data to and from a Google Spreadsheet.
- **Android Companion App**: Located in the `calcucom-android` directory.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML, Vanilla CSS, Vanilla JavaScript, Tailwind CSS (for some layouts), Service Worker (PWA)
- **Backend / Serverless**: Cloudflare Pages Functions (D1 Database session lookup, Google OAuth token exchange)
- **Database**: Cloudflare D1 (SQLite-based serverless database)
- **Authentication & Storage**: Google OAuth 2.0 (OpenID, Profile, email), Google Sheets & Drive API
- **Mobile App**: Android (Kotlin/Gradle project in `calcucom-android/`)

---

## 📂 Project Structure

```text
├── .wrangler/               # Wrangler local cache
├── assets/                  # Public assets & images
├── calcucom-android/        # Android companion app source
├── css/                     # Styling files
├── docs/                    # Design specs and plans
│   ├── cloudflare-google-auth-plan.md
│   ├── dashboard-design.md
│   ├── design.md
│   ├── fee-sources.md
│   ├── fitur-tambahan.md
│   ├── optimization-plan.md
│   └── product-core-workspace-design.md
├── functions/               # Cloudflare Pages Functions
│   ├── _shared/             # Common server helper modules
│   └── api/                 # API endpoints (Auth, Sync, etc.)
├── js/                      # Frontend JavaScript files
│   ├── core/                # Core engines (pricing, data-store)
│   ├── modules/             # UI/Feature modules
│   ├── utils/               # Utilities & helpers
│   ├── data.js              # Shopee fee structures & category trees
│   ├── data-tokopedia.js    # Tokopedia fee structures
│   ├── data-tiktok.js       # TikTok Shop fee structures
│   ├── constants.js         # Default fallback configurations
│   ├── state.js             # Global frontend state controller
│   └── script.js            # Main application bootstrap
├── migrations/              # Cloudflare D1 SQLite database migrations
├── tests/                   # Test suits (integration and unit tests)
├── index.html               # Main application template
├── manifest.json            # PWA manifest
├── sw.js                    # PWA Service worker
└── wrangler.toml            # Cloudflare Pages configuration
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/get-started/) (installed via `npm` or run with `npx`)

### Local Development Setup

1. **Install dependencies** (if any, using wrangler pages for preview):
   ```bash
   npx wrangler pages dev .
   ```

2. **Initialize local D1 database**:
   Create the database and execute local migrations:
   ```bash
   npx wrangler d1 create cekbiayajualan-db
   npx wrangler d1 migrations apply cekbiayajualan-db --local
   ```

3. **Configure Google Cloud Console**:
   - Go to Google Cloud Console and set up an OAuth 2.0 Web Client.
   - Set the redirect URI to:
     - `http://localhost:8788/api/auth/callback` (Local development)
     - `https://your-production-domain.example/api/auth/callback` (Production)
   - Enable Google Drive API and Google Sheets API.

4. **Environment Variables**:
   Define variables in `wrangler.toml` or set them during local execution:
   ```bash
   # Add variables locally using a wrangler.toml or command options
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SESSION_SECRET=your-session-secret-hash
   ```

5. **Start Dev Server**:
   ```bash
   npx wrangler pages dev . --compatibility-date=2026-05-11 --binding DB=cekbiayajualan-db
   ```

---

## 📝 Maintenance & Rules

### Updating Marketplace Fee Rates
When marketplace fee structures change (such as new Shopee, Tokopedia, or TikTok Shop rates):
1. Retrieve reference PDF/documentation and save it in `docs/fee-references/`.
2. Update the corresponding JS files (`js/data.js`, `js/data-tokopedia.js`, `js/data-tiktok.js`).
3. Run calculation tests in `/tests` to check for fee calculation regressions.
4. Record details in `docs/fee-sources.md`.

---

## 📖 Further Documentation

For deep dives into specific topics, read the following design specs in the `docs` folder:
- [Product Workspace Design](docs/product-core-workspace-design.md) - Explains local DataStore v2 and the core product/material/composition model.
- [Cloudflare + Google Auth Plan](docs/cloudflare-google-auth-plan.md) - Details D1 database tables, Google Sheets synchronization schema, and session cookie handling.
- [Marketplace Fee Sources](docs/fee-sources.md) - Documents data files, reference PDFs, and fee updates changelog.
- [Dashboard Design Spec](docs/dashboard-design.md) - Explains layout grids, metrics, ledger visuals, and widgets design guidelines.
