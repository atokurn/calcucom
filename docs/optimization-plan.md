# CekBiayaJualan Optimization & Refactor Plan

Date: 2026-05-11
Project root: `/Volumes/ScutiEX/ScutiEX/antigravity/calcu/calcucom`

## Current architecture snapshot

CekBiayaJualan is a static browser app/PWA for Indonesian marketplace seller fee and profit calculations. It includes profit calculation, price finder, bundling, ROAS, ads analysis, scenario comparison, history, local product database, dark mode, language toggle, and service-worker caching.

Current key files:

- `index.html` — large single-page UI, about 2.9k lines.
- `css/style.css` — custom UI styling, about 1.4k lines.
- `js/script.js` — legacy/global application logic, about 4.3k lines.
- `js/core/pricing-engine.js` — newer pure calculation engine.
- `js/modules/*.js` — feature modules already extracted.
- `js/utils/*.js` — formatter, validation, storage, UI, exporter helpers.
- `js/data*.js` — marketplace fee/category data.
- `manifest.json`, `sw.js` — PWA assets.

The codebase is halfway through a good modularization effort. The biggest risk is that the app currently has both a modular architecture and a large legacy global script.

## Main issues found

### 1. `script.js` is still the application god-file

`js/script.js` owns too many responsibilities:

- global state
- DOM reads/writes
- category selection
- marketplace fee calculation
- chart updates
- history
- product DB
- ads analysis
- language toggle
- import/export
- module switching

This makes changes risky and prevents reliable testing.

### 2. Business math exists in more than one place

Fee/profit logic exists in both:

- `js/core/pricing-engine.js`
- `js/script.js` inside `calculate()` and other helper functions

This creates a correctness risk. Marketplace fee logic must have one source of truth.

### 3. `index.html` depends on global functions and inline `onclick`

Many UI controls use inline handlers. This blocks a clean Content Security Policy and makes load order brittle.

Target direction: use `data-*` attributes and centralized event binding.

### 4. Data definitions are global but inconsistently exported

`data-tokopedia.js` and `data-tiktok.js` expose data on `window`, but `data.js` defines `shopeeRates`, `categoryData`, and `translations` as globals through non-module script scope only. This works in current script loading, but it is brittle for future ES module/build migration.

### 5. Service worker can fail on CDN cache entries

`sw.js` precaches CDN assets with `cache.addAll()`. If one external asset fails, service worker installation can fail. Its offline fallback also returns nothing for uncached failed requests.

### 6. Production performance is limited by CDN Tailwind

The app uses:

- `https://cdn.tailwindcss.com`
- Chart.js CDN
- Font Awesome CDN
- Google Fonts

This is acceptable for prototypes, but not ideal for production PWA performance/offline reliability.

### 7. XSS hardening is needed

The app uses many `innerHTML` template strings. Any user-controlled product name/history/imported data rendered this way must be escaped.

## Refactor target architecture

Recommended target without changing product behavior:

```txt
js/main.js
js/app/bootstrap.js
js/app/dom-bindings.js
js/app/module-router.js
js/core/pricing-engine.js
js/core/marketplace-fees.js
js/core/ads-metrics.js
js/core/business-insights.js
js/data/shopee.js
js/data/tokopedia.js
js/data/tiktok.js
js/data/translations.js
js/modules/profit-calculator.js
js/modules/category-selector.js
js/modules/product-database.js
js/modules/history-manager.js
js/modules/bundling-calculator.js
js/modules/price-finder.js
js/modules/roas-calculator.js
js/modules/compare-calculator.js
js/modules/ads-analyzer.js
js/modules/chart-manager.js
js/modules/theme-manager.js
js/modules/language-manager.js
js/utils/formatters.js
js/utils/dom.js
js/utils/storage.js
js/utils/validation.js
js/utils/sanitize.js
```

For the current no-build setup, keep the IIFE/global export pattern. Later, migrate to ES modules or Vite.

## Phase plan

### Phase 0 — Safety baseline

Goal: make future changes safe.

Tasks:

1. Add `.gitignore` for junk/build/private files.
2. Remove `.DS_Store` files.
3. Add `docs/fee-sources.md` documenting marketplace fee source and last-updated date.
4. Add `docs/optimization-plan.md` — this file.
5. Add a tiny browser-based test harness or Node-compatible tests for pure calculations.

Acceptance:

- No behavior changes.
- App still opens locally.
- Junk files no longer tracked/kept.

### Phase 1 — Calculation single source of truth

Goal: all marketplace math flows through `PricingEngine`.

Tasks:

1. Add test fixtures for:
   - Shopee nonstar/star/mall by category group.
   - Tokopedia regular/power/mall by category group.
   - TikTok regular/mall by category group.
   - voucher.
   - free shipping fee cap.
   - cashback cap.
   - affiliate fee.
   - order process fee.
   - fixed and operational costs.
   - custom deductions/additions.
2. Reconcile `PricingEngine.calculateFees()` with `script.js calculate()`.
3. Update `calculate()` to call `PricingEngine.calculateFees()` for single product fee math.
4. Keep all DOM updates in `script.js` initially.

Acceptance:

- Same UI outputs before/after for representative fixtures.
- No duplicated fee formulas in `script.js` except thin mapping code.

### Phase 2 — Extract profit calculator UI

Goal: reduce `script.js` by moving profit-specific DOM logic.

Create:

```txt
js/modules/profit-calculator.js
```

Responsibilities:

- read profit form inputs
- call `PricingEngine`
- render profit summary
- render fee breakdown
- update profit health/mobile bar through UI functions

Acceptance:

- `script.js` no longer contains main `calculate()` body.
- Existing global `calculate()` can remain as wrapper for compatibility.

### Phase 3 — Remove inline event handlers gradually

Goal: decouple HTML from global functions.

Tasks:

1. Add `data-action` and `data-*` attributes to controls.
2. Create `js/app/dom-bindings.js`.
3. Bind platform buttons, tabs, toggles, category modal, export/import actions through JS.
4. Keep global function aliases during transition.

Acceptance:

- User interactions still work.
- Inline `onclick` count reduced significantly.

### Phase 4 — PWA service worker hardening

Goal: reliable app shell and offline behavior.

Tasks:

1. Remove required CDN URLs from `cache.addAll()`.
2. Cache external assets opportunistically.
3. Use network-first for HTML.
4. Use cache-first/stale-while-revalidate for static assets.
5. Add offline fallback response.
6. Add `skipWaiting()` and `clients.claim()`.

Acceptance:

- Service worker install does not fail when CDN is unavailable.
- App shell opens offline after first successful load.

### Phase 5 — Production build

Goal: improve load speed and deploy quality.

Tasks:

1. Add Vite.
2. Compile Tailwind locally.
3. Bundle/minify JS.
4. Pin dependencies.
5. Add ESLint/Prettier.
6. Add build output to `dist/`.

Acceptance:

- `npm run build` produces deployable app.
- No Tailwind CDN in production HTML.

## Suggested immediate quick wins

### Add `.gitignore`

```gitignore
.DS_Store
*.log
node_modules/
dist/
.vite/
.env
.env.*
```

### Add safe HTML escaping helper

Create `js/utils/sanitize.js`:

```js
const Sanitize = (() => {
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  return { escapeHtml };
})();

if (typeof window !== 'undefined') {
  window.Sanitize = Sanitize;
}
```

Then use for product names, scenario names, imported JSON, and history entries before injecting via `innerHTML`.

### Export Shopee/default data explicitly

At the bottom of `js/data.js`, add:

```js
if (typeof window !== 'undefined') {
  window.shopeeRates = shopeeRates;
  window.categoryData = categoryData;
  window.translations = translations;
}
```

This keeps the current no-build approach stable and prepares for gradual module migration.

## Calculation reconciliation notes

Current `script.js calculate()` formula pattern:

```txt
finalPrice = price - discount
basis = max(0, finalPrice - voucher)
adminFee = basis * adminRate
freeShipFee = min(basis * 4%, 40000) when enabled
cashbackFee = min(basis * 4.5%, 60000) when enabled
affiliateFee = basis * affiliatePercent
custom deduction = percent/fixed off basis
custom cost = added to product cost
totalDed = admin + service + affiliate + fixedFee + orderProcessFee + customDed
net = finalPrice - voucher - totalDed
profit = net - (hpp + opsCost + adsCost + customCost)
margin = profit / finalPrice
```

Current `PricingEngine.calculateFees()` is close but has differences to reconcile:

- `serviceFee` is included in total deductions, good.
- `orderProcessFee`, `fixedFee`, `operationalCost`, `adsCost` are grouped as `totalFixedFees`, then added to `totalCost` rather than marketplace deduction. UI currently displays fixed/order process under deductions but mathematically total profit is equivalent if carefully presented.
- Custom cost category names differ: `script.js` uses `potongan`, while `PricingEngine` expects `deduction`.
- `cashbackFee` in `calculateFees()` currently has no cap, while `script.js` caps it at 60,000.
- `maxServiceFee` override exists in `script.js` but not in `PricingEngine.calculateFees()`.

Before replacing `calculate()`, update `PricingEngine.calculateFees()` to support:

```js
maxServiceFee
freeShipCap
cashbackCap
custom cost category aliases: deduction/potongan, addition/biaya
```

## Risk management

Do not big-bang rewrite this app. The safe path is strangler-style refactor:

1. preserve current UI and globals
2. extract pure calculation first
3. add tests around formulas
4. move DOM modules one by one
5. only then migrate build tooling

## Recommended next coding step

Implement Phase 0 quick wins:

1. create `.gitignore`
2. remove `.DS_Store`
3. add `js/utils/sanitize.js`
4. load it before modules in `index.html`
5. export Shopee/default data explicitly from `js/data.js`
6. patch `PricingEngine.calculateFees()` for cashback cap/max service fee/category aliases

Then validate app still loads.
