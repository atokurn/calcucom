-- Cloudflare D1 app data schema for CekBiayaJualan cloud sync.

CREATE TABLE IF NOT EXISTS products (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT,
    hpp REAL,
    marketplace TEXT,
    category_group TEXT,
    category_name TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_products_user_updated_at ON products (user_id, updated_at);

CREATE TABLE IF NOT EXISTS calculation_history (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    product_name TEXT,
    marketplace TEXT,
    selling_price REAL,
    hpp REAL,
    profit REAL,
    margin REAL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_calculation_history_user_created_at ON calculation_history (user_id, created_at);

CREATE TABLE IF NOT EXISTS scenarios (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    label TEXT,
    name TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_scenarios_user_updated_at ON scenarios (user_id, updated_at);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, key)
);

CREATE TABLE IF NOT EXISTS sync_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_events_user_created_at ON sync_events (user_id, created_at);
