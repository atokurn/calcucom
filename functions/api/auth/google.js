import { buildGoogleAuthUrl } from '../../_shared/oauth.js';

export async function onRequestGet({ request, env }) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET) {
        return new Response('Google auth is not configured', { status: 500 });
    }

    const state = crypto.randomUUID();
    const headers = new Headers({
        Location: buildGoogleAuthUrl(request, env, state),
        'Cache-Control': 'no-store'
    });
    headers.append('Set-Cookie', `cbj_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

    return new Response(null, { status: 302, headers });
}
