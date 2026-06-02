import { getGoogleTokens, getUserSpreadsheet, saveUserSpreadsheet, upsertGoogleTokens } from './db.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DEFAULT_SPREADSHEET_NAME = 'CekBiayaJualan Data';
const REQUIRED_SHEETS = ['Products', 'History', 'Scenarios', 'Settings', 'SyncLog'];

export class GoogleApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'GoogleApiError';
        this.status = status;
        this.details = details;
    }
}

function escapeDriveQueryValue(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function parseGoogleError(response) {
    try {
        return await response.json();
    } catch {
        return await response.text().catch(() => null);
    }
}

export async function refreshAccessToken(env, googleSub) {
    const existing = await getGoogleTokens(env, googleSub);
    if (!existing?.refresh_token) {
        throw new GoogleApiError('Missing Google refresh token', 401);
    }

    const body = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: existing.refresh_token,
        grant_type: 'refresh_token'
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    if (!response.ok) {
        throw new GoogleApiError('Google token refresh failed', response.status, await parseGoogleError(response));
    }

    const tokens = await response.json();
    await upsertGoogleTokens(env, { sub: googleSub, email: existing.email }, {
        ...tokens,
        refresh_token: existing.refresh_token
    });

    return getGoogleTokens(env, googleSub);
}

export async function getValidAccessToken(env, googleSub) {
    const tokens = await getGoogleTokens(env, googleSub);
    if (!tokens) throw new GoogleApiError('Google tokens not found', 401);

    const expiresSoon = Number(tokens.expires_at || 0) < Math.floor(Date.now() / 1000) + 60;
    if (!expiresSoon) return tokens.access_token;

    const refreshed = await refreshAccessToken(env, googleSub);
    return refreshed.access_token;
}

export async function googleFetch(env, googleSub, url, init = {}) {
    const accessToken = await getValidAccessToken(env, googleSub);
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(url, { ...init, headers });
    if (response.status !== 401) return response;

    const refreshed = await refreshAccessToken(env, googleSub);
    headers.set('Authorization', `Bearer ${refreshed.access_token}`);
    return fetch(url, { ...init, headers });
}

export async function findAppSpreadsheet(env, googleSub, name = DEFAULT_SPREADSHEET_NAME) {
    const query = [
        `name='${escapeDriveQueryValue(name)}'`,
        "mimeType='application/vnd.google-apps.spreadsheet'",
        'trashed=false'
    ].join(' and ');

    const url = new URL(DRIVE_FILES_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('spaces', 'drive');
    url.searchParams.set('fields', 'files(id,name,modifiedTime)');
    url.searchParams.set('pageSize', '1');

    const response = await googleFetch(env, googleSub, url.toString());
    if (!response.ok) {
        throw new GoogleApiError('Failed to search Google Drive spreadsheet', response.status, await parseGoogleError(response));
    }

    const data = await response.json();
    return data.files?.[0] || null;
}

export async function createAppSpreadsheet(env, googleSub, name = DEFAULT_SPREADSHEET_NAME) {
    const response = await googleFetch(env, googleSub, DRIVE_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            mimeType: 'application/vnd.google-apps.spreadsheet'
        })
    });

    if (!response.ok) {
        throw new GoogleApiError('Failed to create Google spreadsheet', response.status, await parseGoogleError(response));
    }

    return response.json();
}

export async function getOrCreateAppSpreadsheet(env, googleSub, name = DEFAULT_SPREADSHEET_NAME) {
    const cached = await getUserSpreadsheet(env, googleSub);
    if (cached?.spreadsheet_id) {
        return { id: cached.spreadsheet_id, name: cached.spreadsheet_name, cached: true };
    }

    const existing = await findAppSpreadsheet(env, googleSub, name);
    const spreadsheet = existing || await createAppSpreadsheet(env, googleSub, name);
    await saveUserSpreadsheet(env, googleSub, spreadsheet.id, spreadsheet.name || name);
    await ensureSpreadsheetSheets(env, googleSub, spreadsheet.id);

    return { id: spreadsheet.id, name: spreadsheet.name || name, cached: false };
}

export async function getSpreadsheetMetadata(env, googleSub, spreadsheetId) {
    const url = `${SHEETS_URL}/${spreadsheetId}?fields=sheets.properties`;
    const response = await googleFetch(env, googleSub, url);
    if (!response.ok) {
        throw new GoogleApiError('Failed to read spreadsheet metadata', response.status, await parseGoogleError(response));
    }
    return response.json();
}

export async function ensureSpreadsheetSheets(env, googleSub, spreadsheetId) {
    const metadata = await getSpreadsheetMetadata(env, googleSub, spreadsheetId);
    const existingTitles = new Set(
        (metadata.sheets || []).map(sheet => sheet.properties?.title).filter(Boolean)
    );

    const requests = REQUIRED_SHEETS
        .filter(title => !existingTitles.has(title))
        .map(title => ({ addSheet: { properties: { title } } }));

    if (requests.length === 0) return { created: [] };

    const response = await googleFetch(env, googleSub, `${SHEETS_URL}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
    });

    if (!response.ok) {
        throw new GoogleApiError('Failed to initialize spreadsheet sheets', response.status, await parseGoogleError(response));
    }

    return { created: requests.map(request => request.addSheet.properties.title) };
}

export async function appendSheetRows(env, googleSub, spreadsheetId, sheetName, rows) {
    if (!Array.isArray(rows) || rows.length === 0) return { updates: null };

    const range = encodeURIComponent(`${sheetName}!A:Z`);
    const url = `${SHEETS_URL}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
    const response = await googleFetch(env, googleSub, url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows })
    });

    if (!response.ok) {
        throw new GoogleApiError(`Failed to append rows to ${sheetName}`, response.status, await parseGoogleError(response));
    }

    return response.json();
}

export async function readSheetValues(env, googleSub, spreadsheetId, sheetName) {
    const range = encodeURIComponent(`${sheetName}!A:Z`);
    const response = await googleFetch(env, googleSub, `${SHEETS_URL}/${spreadsheetId}/values/${range}`);

    if (response.status === 404) return { values: [] };
    if (!response.ok) {
        throw new GoogleApiError(`Failed to read ${sheetName}`, response.status, await parseGoogleError(response));
    }

    return response.json();
}

export async function overwriteSheetValues(env, googleSub, spreadsheetId, sheetName, rows) {
    const clearRange = encodeURIComponent(`${sheetName}!A:Z`);
    const clearResponse = await googleFetch(env, googleSub, `${SHEETS_URL}/${spreadsheetId}/values/${clearRange}:clear`, {
        method: 'POST'
    });

    if (!clearResponse.ok) {
        throw new GoogleApiError(`Failed to clear ${sheetName}`, clearResponse.status, await parseGoogleError(clearResponse));
    }

    if (!rows?.length) return { updatedRows: 0 };

    const updateRange = encodeURIComponent(`${sheetName}!A1`);
    const response = await googleFetch(env, googleSub, `${SHEETS_URL}/${spreadsheetId}/values/${updateRange}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows })
    });

    if (!response.ok) {
        throw new GoogleApiError(`Failed to overwrite ${sheetName}`, response.status, await parseGoogleError(response));
    }

    return response.json();
}
