-- Cloudflare D1 auth/session schema for CekBiayaJualan.
-- Apply with:
--   npx wrangler d1 migrations apply cekbiayajualan-db --local
--   npx wrangler d1 migrations apply cekbiayajualan-db --remote

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    google_sub TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_google_sub ON user_sessions (google_sub);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS google_tokens (
    google_sub TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at INTEGER NOT NULL,
    scope TEXT,
    token_type TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_spreadsheets (
    google_sub TEXT PRIMARY KEY,
    spreadsheet_id TEXT NOT NULL,
    spreadsheet_name TEXT NOT NULL DEFAULT 'CekBiayaJualan Data',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
