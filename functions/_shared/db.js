const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function requireDb(env) {
    if (!env.DB) {
        throw new Error('D1 binding DB is not configured');
    }
    return env.DB;
}

export function isoFromNow(seconds) {
    return new Date(Date.now() + seconds * 1000).toISOString();
}

export function nowIso() {
    return new Date().toISOString();
}

export async function createSession(env, user) {
    const db = requireDb(env);
    const sessionId = crypto.randomUUID();
    const expiresAt = isoFromNow(SESSION_MAX_AGE_SECONDS);

    await db.prepare(`
        INSERT INTO user_sessions (id, google_sub, email, name, picture, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
        sessionId,
        user.sub,
        user.email,
        user.name || null,
        user.picture || null,
        expiresAt
    ).run();

    return { sessionId, expiresAt, maxAge: SESSION_MAX_AGE_SECONDS };
}

export async function getSession(env, sessionId) {
    if (!sessionId) return null;
    const db = requireDb(env);

    const session = await db.prepare(`
        SELECT id, google_sub, email, name, picture, expires_at
        FROM user_sessions
        WHERE id = ? AND expires_at > ?
        LIMIT 1
    `).bind(sessionId, nowIso()).first();

    if (!session) return null;

    await db.prepare(`
        UPDATE user_sessions SET last_seen_at = ? WHERE id = ?
    `).bind(nowIso(), sessionId).run();

    return session;
}

export async function deleteSession(env, sessionId) {
    if (!sessionId) return;
    const db = requireDb(env);
    await db.prepare('DELETE FROM user_sessions WHERE id = ?').bind(sessionId).run();
}

export async function upsertGoogleTokens(env, user, tokens) {
    const db = requireDb(env);
    const expiresAt = Math.floor(Date.now() / 1000) + Number(tokens.expires_in || 3600);

    const existing = await db.prepare(`
        SELECT refresh_token FROM google_tokens WHERE google_sub = ? LIMIT 1
    `).bind(user.sub).first();

    const refreshToken = tokens.refresh_token || existing?.refresh_token || null;

    await db.prepare(`
        INSERT INTO google_tokens (
            google_sub, email, access_token, refresh_token, expires_at, scope, token_type, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(google_sub) DO UPDATE SET
            email = excluded.email,
            access_token = excluded.access_token,
            refresh_token = COALESCE(excluded.refresh_token, google_tokens.refresh_token),
            expires_at = excluded.expires_at,
            scope = excluded.scope,
            token_type = excluded.token_type,
            updated_at = excluded.updated_at
    `).bind(
        user.sub,
        user.email,
        tokens.access_token,
        refreshToken,
        expiresAt,
        tokens.scope || null,
        tokens.token_type || null,
        nowIso()
    ).run();

    return { expiresAt };
}

export async function getGoogleTokens(env, googleSub) {
    const db = requireDb(env);
    return db.prepare(`
        SELECT google_sub, email, access_token, refresh_token, expires_at, scope, token_type
        FROM google_tokens
        WHERE google_sub = ?
        LIMIT 1
    `).bind(googleSub).first();
}

export async function getUserSpreadsheet(env, googleSub) {
    const db = requireDb(env);
    return db.prepare(`
        SELECT spreadsheet_id, spreadsheet_name
        FROM user_spreadsheets
        WHERE google_sub = ?
        LIMIT 1
    `).bind(googleSub).first();
}

export async function saveUserSpreadsheet(env, googleSub, spreadsheetId, spreadsheetName = 'CekBiayaJualan Data') {
    const db = requireDb(env);
    await db.prepare(`
        INSERT INTO user_spreadsheets (google_sub, spreadsheet_id, spreadsheet_name, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(google_sub) DO UPDATE SET
            spreadsheet_id = excluded.spreadsheet_id,
            spreadsheet_name = excluded.spreadsheet_name,
            updated_at = excluded.updated_at
    `).bind(googleSub, spreadsheetId, spreadsheetName, nowIso()).run();
}

function jsonString(value) {
    return JSON.stringify(value ?? null);
}

function parseJson(value, fallback) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function valueAt(record, ...keys) {
    for (const key of keys) {
        if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
    }
    return null;
}

function recordId(record, prefix, index) {
    return String(valueAt(record, 'id', 'productId') || `${prefix}-${index + 1}`);
}

function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

export async function replaceCloudState(env, userId, state = {}) {
    const db = requireDb(env);
    const now = nowIso();
    const products = Array.isArray(state.products || state.productDB) ? (state.products || state.productDB) : [];
    const history = Array.isArray(state.history || state.calcHistory) ? (state.history || state.calcHistory) : [];
    const scenarios = Array.isArray(state.scenarios) ? state.scenarios : [];
    const settings = state.settings && typeof state.settings === 'object' ? state.settings : {};

    const statements = [
        db.prepare('DELETE FROM products WHERE user_id = ?').bind(userId),
        db.prepare('DELETE FROM calculation_history WHERE user_id = ?').bind(userId),
        db.prepare('DELETE FROM scenarios WHERE user_id = ?').bind(userId),
        db.prepare('DELETE FROM user_settings WHERE user_id = ?').bind(userId)
    ];

    products.forEach((product, index) => {
        statements.push(db.prepare(`
            INSERT INTO products (
                user_id, id, name, hpp, marketplace, category_group, category_name, payload_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            recordId(product, 'product', index),
            valueAt(product, 'name', 'productName'),
            numberOrNull(valueAt(product, 'hpp', 'cost', 'modal')),
            valueAt(product, 'marketplace', 'platform'),
            valueAt(product, 'categoryGroup'),
            valueAt(product, 'categoryName', 'category'),
            jsonString(product),
            valueAt(product, 'createdAt') || now,
            valueAt(product, 'updatedAt') || now
        ));
    });

    history.forEach((item, index) => {
        statements.push(db.prepare(`
            INSERT INTO calculation_history (
                user_id, id, product_name, marketplace, selling_price, hpp, profit, margin, payload_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            recordId(item, 'history', index),
            valueAt(item, 'productName', 'name'),
            valueAt(item, 'marketplace', 'platform'),
            numberOrNull(valueAt(item, 'sellingPrice', 'price')),
            numberOrNull(valueAt(item, 'hpp', 'cost', 'modal')),
            numberOrNull(valueAt(item, 'profit', 'netProfit')),
            numberOrNull(valueAt(item, 'margin')),
            jsonString(item),
            valueAt(item, 'createdAt', 'date', 'timestamp') || now
        ));
    });

    scenarios.forEach((scenario, index) => {
        statements.push(db.prepare(`
            INSERT INTO scenarios (user_id, id, label, name, payload_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            recordId(scenario, 'scenario', index),
            valueAt(scenario, 'label'),
            valueAt(scenario, 'name', 'productName'),
            jsonString(scenario),
            valueAt(scenario, 'createdAt') || now,
            valueAt(scenario, 'updatedAt') || now
        ));
    });

    Object.entries(settings).forEach(([key, value]) => {
        statements.push(db.prepare(`
            INSERT INTO user_settings (user_id, key, value_json, updated_at)
            VALUES (?, ?, ?, ?)
        `).bind(userId, key, jsonString(value), now));
    });

    statements.push(db.prepare(`
        INSERT INTO sync_events (id, user_id, event, detail, created_at)
        VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), userId, 'push', 'Full local state pushed to D1', now));

    await db.batch(statements);
}

export async function getCloudState(env, userId) {
    const db = requireDb(env);
    const [products, history, scenarios, settings] = await Promise.all([
        db.prepare('SELECT payload_json FROM products WHERE user_id = ? ORDER BY updated_at, id').bind(userId).all(),
        db.prepare('SELECT payload_json FROM calculation_history WHERE user_id = ? ORDER BY created_at, id').bind(userId).all(),
        db.prepare('SELECT payload_json FROM scenarios WHERE user_id = ? ORDER BY updated_at, id').bind(userId).all(),
        db.prepare('SELECT key, value_json FROM user_settings WHERE user_id = ? ORDER BY key').bind(userId).all()
    ]);

    return {
        products: (products.results || []).map(row => parseJson(row.payload_json, null)).filter(Boolean),
        history: (history.results || []).map(row => parseJson(row.payload_json, null)).filter(Boolean),
        scenarios: (scenarios.results || []).map(row => parseJson(row.payload_json, null)).filter(Boolean),
        settings: Object.fromEntries((settings.results || []).map(row => [row.key, parseJson(row.value_json, null)]))
    };
}
