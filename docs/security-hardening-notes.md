# Security Hardening Notes

Date: 2026-05-11

## Implemented in this pass

### HTML escaping utility

Added:

- `js/utils/sanitize.js`

Exports:

- `Sanitize.escapeHtml(value)`
- `window.escapeHtml(value)` compatibility helper

Use this before inserting user-controlled values into `innerHTML` templates.

### Patched high-risk legacy renders in `js/script.js`

Escaped user-controlled values in key UI paths:

- product combobox options
- ROAS multiselect options
- compare multiselect options
- compare selected badges
- history list names/profit/margin/selling price
- custom cost row input values
- custom cost tooltip labels
- product DB list names/product IDs
- product selector `<option>` labels
- price finder cost component input values

### Remaining known risk areas

Several modules still contain `innerHTML` templates and should be audited next:

- `js/modules/bundling-calculator.js`
- `js/modules/history-manager.js`
- `js/modules/ads-analyzer.js`
- `js/modules/compare-calculator.js`
- `js/modules/price-finder.js`
- `js/modules/category-modal.js`

Highest priority remaining module: `js/modules/bundling-calculator.js`, because it renders product names from `productDB` and manual bundle product names.

## Recommended rule

For all future code:

1. Prefer `textContent`, `createElement`, and `appendChild` for user data.
2. If using template strings with `innerHTML`, wrap user data with `safeHtml()` / `Sanitize.escapeHtml()`.
3. Do not interpolate raw user values into inline JavaScript handlers. If unavoidable during transition, use a dedicated JS string escaping helper.
4. Long-term: remove inline event handlers and use `addEventListener` with `data-*` attributes.
