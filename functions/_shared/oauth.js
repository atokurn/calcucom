const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export const GOOGLE_SCOPES = [
    'openid',
    'email',
    'profile'
];

export function getBaseUrl(request, env) {
    if (env.APP_ORIGIN) return env.APP_ORIGIN.replace(/\/$/, '');
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
}

export function getRedirectUri(request, env) {
    return `${getBaseUrl(request, env)}/api/auth/callback`;
}

export function buildGoogleAuthUrl(request, env, state) {
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', getRedirectUri(request, env));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('state', state);
    return url.toString();
}

export async function exchangeCodeForTokens(request, env, code) {
    const body = new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getRedirectUri(request, env),
        grant_type: 'authorization_code'
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    if (!response.ok) {
        throw new Error(`Google token exchange failed: ${response.status}`);
    }

    return response.json();
}

export async function fetchGoogleUser(accessToken) {
    const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw new Error(`Google userinfo failed: ${response.status}`);
    }

    return response.json();
}

function base64UrlEncode(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeText(text) {
    return base64UrlEncode(new TextEncoder().encode(text));
}

function base64UrlDecodeText(value) {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

async function hmacSha256(secret, message) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
}

export async function createSignedSession(payload, secret) {
    const body = base64UrlEncodeText(JSON.stringify(payload));
    const signature = base64UrlEncode(await hmacSha256(secret, body));
    return `${body}.${signature}`;
}

export async function verifySignedSession(cookieValue, secret) {
    if (!cookieValue || !cookieValue.includes('.')) return null;
    const [body, signature] = cookieValue.split('.');
    const expected = base64UrlEncode(await hmacSha256(secret, body));
    if (signature !== expected) return null;

    try {
        return JSON.parse(base64UrlDecodeText(body));
    } catch {
        return null;
    }
}

export function parseCookies(request) {
    const header = request.headers.get('Cookie') || '';
    return Object.fromEntries(
        header.split(';')
            .map(part => part.trim())
            .filter(Boolean)
            .map(part => {
                const index = part.indexOf('=');
                if (index === -1) return [part, ''];
                return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
            })
    );
}

export function sessionCookie(value, maxAge = 60 * 60 * 24 * 7) {
    return `cbj_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function getSessionId(request) {
    return parseCookies(request).cbj_session || '';
}

export function clearSessionCookie() {
    return 'cbj_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...(init.headers || {})
        }
    });
}
