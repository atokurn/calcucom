# Marketplace Fee Sources

Date created: 2026-05-11

This project contains marketplace fee/category data used by CekBiayaJualan.

## Current data files

- `js/data.js` — Shopee fee rates, category tree, translations.
- `js/data-tokopedia.js` — Tokopedia fee/category data.
- `js/data-tiktok.js` — TikTok Shop fee/category data.
- `js/constants.js` — centralized fallback/default marketplace constants.
- `js/core/pricing-engine.js` — fee/profit calculation formulas.

## Reference documents currently in repository

- `Skema dan Ketentuan Biaya Layanan per Kategori Produk _ Pusat Edukasi Penjual Tokopedia.pdf`
- `Seller Center.pdf`

Move these into `docs/fee-references/` when cleaning the project tree.

## Maintenance rule

Whenever marketplace fee rules are updated:

1. Save the source URL/PDF and access date.
2. Update the relevant `js/data*.js` file.
3. Update test fixtures for affected categories/seller types.
4. Run calculation regression tests.
5. Update this file with the change log.

## Change log

| Date | Marketplace | Source | Notes |
| --- | --- | --- | --- |
| 2026-05-11 | Shopee/Tokopedia/TikTok | Existing repo data/PDF references | Baseline documentation created. Exact source dates still need verification. |
